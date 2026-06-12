import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { CreatePurchaseOrderDto, ReceiveGoodsDto, PurchaseReturnDto } from "./dto/purchase.dto";

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async create(dto: CreatePurchaseOrderDto, userId: string) {
    return this.em.transaction(async (tx) => {
      let totalAmount = 0;
      for (const item of dto.items) {
        if (item.quantity <= 0 || item.unit_price < 0) throw new HttpException({ errorCode: "PO_001", message: "數量或單價無效" }, HttpStatus.BAD_REQUEST);
        totalAmount += item.quantity * item.unit_price;
      }

      // Check supplier exists
      const suppliers = await tx.query("SELECT supplier_id FROM supplier_master WHERE supplier_id = $1 AND deleted_at IS NULL", [dto.supplier_id]);
      if (suppliers.length === 0) throw new HttpException({ errorCode: "PO_002", message: "供應商不存在" }, HttpStatus.BAD_REQUEST);

      // Generate PO number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const count = await tx.query("SELECT COUNT(*) as cnt FROM purchase_order WHERE po_no LIKE $1", [`PO${dateStr}%`]);
      const seq = String((parseInt(count[0].cnt) || 0) + 1).padStart(4, "0");
      const poNo = `PO${dateStr}${seq}`;

      const poId = uuidv4();
      await tx.query(
        `INSERT INTO purchase_order (po_id, po_no, supplier_id, order_date, total_amount, status, is_emergency, created_at, updated_at)
         VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        [poId, poNo, dto.supplier_id, totalAmount, dto.is_emergency ? "EMERGENCY_PENDING" : "DRAFT", dto.is_emergency || false]
      );

      for (const item of dto.items) {
        await tx.query(
          `INSERT INTO purchase_order_item (item_id, po_id, product_id, quantity, unit_price, received_quantity, return_quantity, created_at)
           VALUES ($1,$2,$3,$4,$5,0,0,CURRENT_TIMESTAMP)`,
          [uuidv4(), poId, item.product_id, item.quantity, item.unit_price]
        );
      }

      this.logger.log(`PO created: ${poNo} by ${userId}, amount=${totalAmount}, emergency=${dto.is_emergency}`);
      return { po_id: poId, po_no: poNo, supplier_id: dto.supplier_id, total_amount: totalAmount, status: dto.is_emergency ? "EMERGENCY_PENDING" : "DRAFT" };
    });
  }

  async findAll(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.page_size) || 20));
    const offset = (page - 1) * pageSize;
    const search = query.search || "";
    const status = query.status || "";

    let where = "WHERE po.deleted_at IS NULL";
    const params: any[] = [];
    let paramIdx = 0;

    if (search) {
      paramIdx++;
      where += ` AND (po.po_no ILIKE $${paramIdx} OR s.supplier_name ILIKE $${paramIdx} OR s.supplier_code ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
    }
    if (status) {
      paramIdx++;
      where += ` AND po.status = $${paramIdx}`;
      params.push(status);
    }

    const countResult = await this.em.query(
      `SELECT COUNT(*) as cnt FROM purchase_order po JOIN supplier_master s ON s.supplier_id = po.supplier_id ${where}`,
      params
    );
    const total = parseInt(countResult[0].cnt);

    paramIdx++;
    params.push(pageSize);
    paramIdx++;
    params.push(offset);

    const items = await this.em.query(
      `SELECT po.*, s.supplier_code, s.supplier_name,
        (SELECT COUNT(*) FROM purchase_order_item WHERE po_id = po.po_id) as item_count,
        (SELECT COALESCE(SUM(received_quantity),0) FROM purchase_order_item WHERE po_id = po.po_id) as total_received
       FROM purchase_order po
       JOIN supplier_master s ON s.supplier_id = po.supplier_id
       ${where}
       ORDER BY po.created_at DESC
       LIMIT $${paramIdx - 1} OFFSET $${paramIdx}`,
      params
    );

    return {
      items,
      pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) }
    };
  }

  async findOne(id: string) {
    const orders = await this.em.query(
      `SELECT po.*, s.supplier_code, s.supplier_name
       FROM purchase_order po
       JOIN supplier_master s ON s.supplier_id = po.supplier_id
       WHERE po.po_id = $1 AND po.deleted_at IS NULL`,
      [id]
    );
    if (orders.length === 0) throw new HttpException({ errorCode: "PO_003", message: "採購單不存在" }, HttpStatus.NOT_FOUND);

    const items = await this.em.query(
      `SELECT i.*, p.product_code, p.product_name
       FROM purchase_order_item i
       JOIN product_master p ON p.product_id = i.product_id
       WHERE i.po_id = $1
       ORDER BY i.created_at`,
      [id]
    );

    const receipts = await this.em.query(
      `SELECT * FROM goods_receipt WHERE po_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    const returns = await this.em.query(
      `SELECT r.*, p.product_code, p.product_name
       FROM purchase_return r
       JOIN product_master p ON p.product_id = r.product_id
       WHERE r.po_id = $1 ORDER BY r.created_at DESC`,
      [id]
    );

    return { ...orders[0], items, receipts, returns };
  }

  async receiveGoods(poId: string, dto: ReceiveGoodsDto, userId: string) {
    return this.em.transaction(async (tx) => {
      const orders = await tx.query("SELECT * FROM purchase_order WHERE po_id = $1 AND deleted_at IS NULL FOR UPDATE", [poId]);
      if (orders.length === 0) throw new HttpException({ errorCode: "PO_003", message: "採購單不存在" }, HttpStatus.NOT_FOUND);

      const po = orders[0];
      if (!["DRAFT", "EMERGENCY_PENDING", "APPROVED"].includes(po.status)) {
        throw new HttpException({ errorCode: "PO_004", message: "目前狀態不允許收貨" }, HttpStatus.BAD_REQUEST);
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const count = await tx.query("SELECT COUNT(*) as cnt FROM goods_receipt WHERE receipt_no LIKE $1", [`GR${dateStr}%`]);
      const seq = String((parseInt(count[0].cnt) || 0) + 1).padStart(4, "0");
      const receiptNo = `GR${dateStr}${seq}`;

      const receiptId = uuidv4();
      await tx.query(
        `INSERT INTO goods_receipt (receipt_id, po_id, receipt_no, receipt_date, warehouse_staff_id, status, created_at)
         VALUES ($1,$2,$3,CURRENT_DATE,$4,'RECEIVED',CURRENT_TIMESTAMP)`,
        [receiptId, poId, receiptNo, userId]
      );

      if (dto.items && dto.items.length > 0) {
        for (const item of dto.items) {
          await tx.query(
            "UPDATE purchase_order_item SET received_quantity = received_quantity + $1 WHERE po_id = $2 AND product_id = $3",
            [item.quantity, poId, item.product_id]
          );
        }
      }

      this.logger.log(`Goods receipt: ${receiptNo} for PO ${po.po_no}`);
      return { receipt_id: receiptId, receipt_no: receiptNo, po_id: poId, status: "RECEIVED" };
    });
  }

  async returnGoods(poId: string, dto: PurchaseReturnDto, userId: string) {
    return this.em.transaction(async (tx) => {
      const orders = await tx.query("SELECT * FROM purchase_order WHERE po_id = $1 AND deleted_at IS NULL FOR UPDATE", [poId]);
      if (orders.length === 0) throw new HttpException({ errorCode: "PO_003", message: "採購單不存在" }, HttpStatus.NOT_FOUND);

      const po = orders[0];

      // Check received quantity is enough
      const items = await tx.query(
        "SELECT * FROM purchase_order_item WHERE po_id = $1 AND product_id = $2 FOR UPDATE",
        [poId, dto.product_id]
      );
      if (items.length === 0) throw new HttpException({ errorCode: "PO_005", message: "採購明細不存在" }, HttpStatus.NOT_FOUND);

      const item = items[0];
      if (item.received_quantity - item.return_quantity < dto.quantity) {
        throw new HttpException({ errorCode: "PO_006", message: "可退貨數量不足" }, HttpStatus.BAD_REQUEST);
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const count = await tx.query("SELECT COUNT(*) as cnt FROM purchase_return WHERE return_no LIKE $1", [`PR${dateStr}%`]);
      const seq = String((parseInt(count[0].cnt) || 0) + 1).padStart(4, "0");
      const returnNo = `PR${dateStr}${seq}`;

      const returnId = uuidv4();
      await tx.query(
        `INSERT INTO purchase_return (return_id, po_id, return_no, product_id, quantity, reason, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,'APPROVED',CURRENT_TIMESTAMP)`,
        [returnId, poId, returnNo, dto.product_id, dto.quantity, dto.reason || ""]
      );

      await tx.query(
        "UPDATE purchase_order_item SET return_quantity = return_quantity + $1 WHERE po_id = $2 AND product_id = $3",
        [dto.quantity, poId, dto.product_id]
      );

      this.logger.log(`Purchase return: ${returnNo} for PO ${po.po_no}, qty=${dto.quantity}`);
      return { return_id: returnId, return_no: returnNo, po_id: poId, product_id: dto.product_id, quantity: dto.quantity, status: "APPROVED" };
    });
  }
}