import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class GoodsReceiptService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async list(query: any) {
    const page = +query.page || 1;
    const page_size = +query.page_size || 15;
    const status = query.status;
    const where = status ? "WHERE gr.status = $1" : "";
    const params: any[] = status ? [status] : [];
    
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM goods_receipt gr " + where, params);
    const total = parseInt(countR[0].cnt);

    const items = await this.em.query(
      "SELECT gr.*, po.po_no, s.supplier_name, w.warehouse_name " +
      "FROM goods_receipt gr " +
      "LEFT JOIN purchase_order po ON po.po_id = gr.po_id " +
      "LEFT JOIN supplier_master s ON s.supplier_id = gr.supplier_id " +
      "LEFT JOIN warehouse_master w ON w.warehouse_id = gr.warehouse_id " +
      where + " ORDER BY gr.created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2),
      [...params, page_size, (page - 1) * page_size]
    );

    return { items, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async getOne(id: string) {
    const rows = await this.em.query("SELECT gr.*, po.po_no, s.supplier_name, w.warehouse_name FROM goods_receipt gr LEFT JOIN purchase_order po ON po.po_id = gr.po_id LEFT JOIN supplier_master s ON s.supplier_id = gr.supplier_id LEFT JOIN warehouse_master w ON w.warehouse_id = gr.warehouse_id WHERE gr.receipt_id = $1", [id]);
    if (rows.length === 0) throw new HttpException("收貨單不存在", HttpStatus.NOT_FOUND);
    const items = await this.em.query("SELECT gri.*, p.product_code, p.product_name FROM goods_receipt_item gri JOIN product_master p ON p.product_id = gri.product_id WHERE gri.receipt_id = $1", [id]);
    return { ...rows[0], items };
  }

  async createFromPO(dto: any, userId: string) {
    const poId = dto.po_id;
    const poRows = await this.em.query("SELECT * FROM purchase_order WHERE po_id = $1", [poId]);
    if (poRows.length === 0) throw new HttpException("採購單不存在", 404);
    
    const receiptId = uuidv4();
    const receiptNo = "GR-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + uuidv4().slice(0, 4).toUpperCase();
    
    await this.em.query(
      "INSERT INTO goods_receipt (receipt_id, receipt_no, po_id, warehouse_id, supplier_id, warehouse_staff_id, status, receipt_date) VALUES ($1,$2,$3,$4,$5,$6,'PENDING_RECEIPT',CURRENT_DATE)",
      [receiptId, receiptNo, poId, dto.warehouse_id || null, dto.supplier_id || null, userId]
    );

    // Copy PO items to receipt items
    const poItems = await this.em.query("SELECT * FROM purchase_order_item WHERE po_id = $1", [poId]);
    for (const item of poItems) {
      await this.em.query(
        "INSERT INTO goods_receipt_item (receipt_id, po_item_id, product_id, expected_qty, received_qty, qa_result) VALUES ($1,$2,$3,$4,0,'PENDING')",
        [receiptId, item.item_id, item.product_id, item.quantity || 0]
      );
    }

    await this.logState(receiptId, "PENDING_RECEIPT", "create_receipt", userId);
    return this.getOne(receiptId);
  }

  async confirmReceipt(id: string, items: any[], userId: string) {
    await this.em.query("UPDATE goods_receipt SET status = 'RECEIVED' WHERE receipt_id = $1", [id]);
    for (const it of items) {
      await this.em.query("UPDATE goods_receipt_item SET received_qty = $1, batch_no = $2 WHERE item_id = $3", [it.received_qty || 0, it.batch_no || null, it.item_id]);
    }
    await this.logState(id, "RECEIVED", "confirm_receipt", userId);
    return this.getOne(id);
  }

  async submitQA(id: string, userId: string) {
    await this.em.query("UPDATE goods_receipt SET status = 'QA_PENDING' WHERE receipt_id = $1", [id]);
    await this.logState(id, "QA_PENDING", "submit_qa", userId);
    return this.getOne(id);
  }

  async qaResult(id: string, items: any[], userId: string) {
    for (const it of items) {
      await this.em.query("UPDATE goods_receipt_item SET qa_result = $1, qa_notes = $2 WHERE item_id = $3", [it.qa_result, it.qa_notes || null, it.item_id]);
    }

    const allPassed = items.every((it: any) => it.qa_result === "PASSED");
    const allFailed = items.every((it: any) => it.qa_result === "FAILED");
    
    if (allPassed) {
      await this.em.query("UPDATE goods_receipt SET status = 'QA_PASSED', qa_staff_id = $1 WHERE receipt_id = $2", [userId, id]);
      await this.logState(id, "QA_PASSED", "qa_pass", userId);
    } else if (allFailed) {
      await this.em.query("UPDATE goods_receipt SET status = 'QA_FAILED', qa_staff_id = $1 WHERE receipt_id = $2", [userId, id]);
      await this.logState(id, "QA_FAILED", "qa_fail", userId);
    }
    // Partial: stays in QA_PENDING

    return this.getOne(id);
  }

  async confirmWarehouse(id: string, userId: string) {
    const receipt = await this.getOne(id);
    if (receipt.status !== "QA_PASSED") throw new HttpException("只有QA通過的才能入倉", 400);

    // Create batch records for passed items
    for (const item of receipt.items) {
      if (item.qa_result !== "PASSED") continue;
      const batchNo = item.batch_no || ("BT-RCV-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + uuidv4().slice(0, 4).toUpperCase());
      await this.em.query(
        "INSERT INTO batch_master (batch_id, batch_no, product_id, production_date, expiry_date, manufacturer, qa_status, recall_status, total_quantity) VALUES ($1,$2,$3,CURRENT_DATE,CURRENT_DATE + INTERVAL '2 years',$4,'PASSED','NORMAL',$5) ON CONFLICT DO NOTHING",
        [uuidv4(), batchNo, item.product_id, receipt.supplier_name || "unknown", item.received_qty || item.expected_qty]
      );
    }

    await this.em.query("UPDATE goods_receipt SET status = 'WAREHOUSED' WHERE receipt_id = $1", [id]);
    await this.logState(id, "WAREHOUSED", "confirm_warehouse", userId);
    return this.getOne(id);
  }

  async startReturn(id: string, userId: string) {
    await this.em.query("UPDATE goods_receipt SET status = 'RETURNING' WHERE receipt_id = $1", [id]);
    await this.logState(id, "RETURNING", "start_return", userId);
    return this.getOne(id);
  }

  async confirmReturn(id: string, userId: string) {
    await this.em.query("UPDATE goods_receipt SET status = 'RETURNED' WHERE receipt_id = $1", [id]);
    await this.logState(id, "RETURNED", "confirm_return", userId);
    return this.getOne(id);
  }

  private async logState(receiptId: string, toState: string, action: string, userId: string) {
    await this.em.query(
      "INSERT INTO state_machine_log (id, entity_type, entity_id, from_state, to_state, action, user_id) VALUES ($1,'GoodsReceipt',$2,'',$3,$4,$5)",
      [uuidv4(), receiptId, toState, action, userId]
    ).catch(() => {});
  }
}
