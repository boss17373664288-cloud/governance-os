import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectRepository, InjectEntityManager } from "@nestjs/typeorm";
import { Repository, IsNull, EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { SalesOrder, SalesOrderItem } from "../../entities/sales-order.entity";
import { CreateSalesOrderDto, ApproveOrderDto, RejectOrderDto } from "./dto/sales-order.dto";
import { AccountingService } from "../accounting/accounting.service";

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING_APPROVAL", "APPROVED", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["STOCK_ALLOCATED", "CANCELLED"],
  STOCK_ALLOCATED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  REJECTED: ["DRAFT"],
  CANCELLED: [],
  COMPLETED: [],
};

@Injectable()
export class SalesOrderService {
  private readonly logger = new Logger(SalesOrderService.name);

  constructor(
    @InjectRepository(SalesOrder) private readonly orderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem) private readonly itemRepo: Repository<SalesOrderItem>,
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly accountingService: AccountingService,
  ) {}

  async findAll(query: any) {
    const page = query.page || 1;
    const page_size = query.page_size || 15;
    const sort_by = query.sort_by || "created_at";
    const sort_order = query.sort_order || "DESC";
    const qb = this.orderRepo.createQueryBuilder("o")
      .leftJoinAndSelect("o.customer", "c")
      .where("o.deleted_at IS NULL");
    if (query.status) qb.andWhere("o.status = :status", { status: query.status });
    if (query.search) {
      qb.andWhere("(o.order_no ILIKE :s OR c.customer_name ILIKE :s)", { s: "%" + query.search + "%" });
    }
    const [items, total] = await qb
      .orderBy("o." + sort_by, sort_order as any)
      .skip((page - 1) * page_size)
      .take(page_size)
      .getManyAndCount();
    
    // 扁平化客戶名稱 + 附加明細摘要
    const result = items.map((order: any) => {
      const plain: any = { ...order };
      plain.customer_name = order.customer?.customer_name || null;
      plain.customer_code = order.customer?.customer_code || null;
      delete plain.customer;
      return plain;
    });
    
    // 為每筆訂單取得產品摘要
    for (const order of result) {
      const itemRows = await this.em.query(
        `SELECT soi.quantity, soi.consignment_quantity, soi.unit_price, p.product_name, p.product_code
         FROM sales_order_item soi
         LEFT JOIN product_master p ON p.product_id = soi.product_id
         WHERE soi.order_id = $1`,
        [order.order_id]
      );
      order.items = itemRows;
      order.product_summary = itemRows.map((r: any) => r.product_name || r.product_code).join("、");
      order.total_quantity = itemRows.reduce((s: number, r: any) => s + Number(r.quantity), 0);
      order.total_consignment = itemRows.reduce((s: number, r: any) => s + Number(r.consignment_quantity || 0), 0);
    }
    
    return { items: result, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { order_id: id, deleted_at: IsNull() },
      relations: ["customer"],
    });
    if (!order) throw new HttpException({ errorCode: "ORDER_001", message: "訂單不存在" }, HttpStatus.NOT_FOUND);
    return order;
  }

  async getItems(orderId: string) {
    return this.em.query(
      `SELECT i.*, p.product_code, p.product_name, p.product_specification, p.minimum_price
       FROM sales_order_item i
       LEFT JOIN product_master p ON p.product_id = i.product_id
       WHERE i.order_id = $1
       ORDER BY i.created_at ASC`,
      [orderId]
    );
  }

  async create(dto: CreateSalesOrderDto, userId: string) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const seq = await this.orderRepo.count({ where: { deleted_at: IsNull() } });
    const orderNo = "SO" + today + String(seq + 1).padStart(4, "0");
    let totalAmount = 0;
    let totalCost = 0;
    for (const itemDto of dto.items) {
      totalAmount += itemDto.quantity * itemDto.unit_price;
      totalCost += itemDto.quantity * (itemDto.unit_price * 0.6);
    }
    const orderId = uuidv4();
    await this.orderRepo.insert({
      order_id: orderId, order_no: orderNo, customer_id: dto.customer_id,
      order_date: new Date(), total_amount: totalAmount, total_cost: totalCost,
      status: "DRAFT", reject_count: 0, created_by: userId,
    } as any);
    for (const itemDto of dto.items) {
      const immediateQty = itemDto.quantity - (itemDto.consignment_quantity || 0);
      await this.itemRepo.insert({
        item_id: uuidv4(), order_id: orderId, product_id: itemDto.product_id,
        quantity: itemDto.quantity, immediate_ship_quantity: immediateQty,
        consignment_quantity: itemDto.consignment_quantity || 0, unit_price: itemDto.unit_price,
      } as any);
    }
    this.logger.log("Order created: " + orderNo);
    return this.findOne(orderId);
  }

  async submit(id: string, userId: string) {
    const order = await this.findOne(id);
    if (!["DRAFT", "REJECTED"].includes(order.status)) {
      throw new HttpException({ errorCode: "ORDER_002", message: "僅草稿或已駁回狀態可提交審批" }, HttpStatus.BAD_REQUEST);
    }
    if (order.reject_count >= 2) {
      throw new HttpException({ errorCode: "ORDER_LOCKED", message: "該訂單已被鎖定，請聯繫業務總監解鎖" }, HttpStatus.FORBIDDEN);
    }

    // 檢查低價：任何明細單價低於產品最低限價 → 需要審批
    const items = await this.getItems(id);
    const hasLowPrice = items.some((i: any) => i.minimum_price && Number(i.unit_price) < Number(i.minimum_price));

    if (hasLowPrice) {
      order.status = "PENDING_APPROVAL";
      this.logger.log(`Order ${order.order_no} submitted for low-price approval`);
    } else {
      // 無異常直接核准
      order.status = "APPROVED";
      this.logger.log(`Order ${order.order_no} auto-approved (no anomalies)`);
      // 規則：審批通過即全額認列應收/收入/成本
      this.accountingService.createSalesJournal(order.order_id, order.customer_id, Number(order.total_amount), Number(order.total_cost), userId).catch(err => this.logger.error("Failed to create sales journal", err));
      // 建立寄庫台帳
      this.createConsignmentLedger(order.order_id, order.customer_id).catch(err => this.logger.error("Failed to create consignment ledger", err));
    }
    return this.orderRepo.save(order);
  }

  async approve(id: string, userId: string, dto?: ApproveOrderDto) {
    const order = await this.findOne(id);
    if (order.status !== "PENDING_APPROVAL") {
      throw new HttpException({ errorCode: "ORDER_003", message: "僅待審批狀態可核准" }, HttpStatus.BAD_REQUEST);
    }
    order.status = "APPROVED";
    this.logger.log(`Order ${order.order_no} approved by ${userId}`);
    // 規則：審批通過即全額認列應收/收入/成本
    this.accountingService.createSalesJournal(order.order_id, order.customer_id, Number(order.total_amount), Number(order.total_cost), userId).catch(err => this.logger.error("Failed to create sales journal", err));
      // 建立寄庫台帳
      this.createConsignmentLedger(order.order_id, order.customer_id).catch(err => this.logger.error("Failed to create consignment ledger", err));
    return this.orderRepo.save(order);
  }

  async reject(id: string, userId: string, dto: RejectOrderDto) {
    const order = await this.findOne(id);
    if (order.status !== "PENDING_APPROVAL") {
      throw new HttpException({ errorCode: "ORDER_004", message: "僅待審批狀態可駁回" }, HttpStatus.BAD_REQUEST);
    }
    order.reject_count = (order.reject_count || 0) + 1;
    if (order.reject_count >= 2) {
      order.status = "REJECTED_LOCKED";
      this.logger.log(`Order ${order.order_no} locked after 2 rejections`);
    } else {
      order.status = "REJECTED";
    }
    // 保存駁回原因
    if (dto?.reason) {
      await this.em.query(
        `INSERT INTO order_audit_log (log_id, order_id, action, operator_id, detail) VALUES ($1,$2,$3,$4,$5)`,
        [uuidv4(), id, "REJECT", userId, dto.reason]
      );
    }
    return this.orderRepo.save(order);
  }

  async allocate(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== "APPROVED") {
      throw new HttpException({ errorCode: "ORDER_005", message: "僅已核准狀態可分配庫存" }, HttpStatus.BAD_REQUEST);
    }
    order.status = "STOCK_ALLOCATED";
    this.logger.log(`Order ${order.order_no} stock allocated`);
    return this.orderRepo.save(order);
  }

  async ship(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== "STOCK_ALLOCATED") {
      throw new HttpException({ errorCode: "ORDER_006", message: "僅已分配庫存狀態可出貨" }, HttpStatus.BAD_REQUEST);
    }
    order.status = "SHIPPED";
    this.logger.log(`Order ${order.order_no} shipped`);
    return this.orderRepo.save(order);
  }

  async complete(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== "SHIPPED") {
      throw new HttpException({ errorCode: "ORDER_007", message: "僅已出貨狀態可結案" }, HttpStatus.BAD_REQUEST);
    }
    order.status = "COMPLETED";
    this.logger.log(`Order ${order.order_no} completed`);
    return this.orderRepo.save(order);
  }

  async cancel(id: string, userId: string) {
    const order = await this.findOne(id);
    if (!["DRAFT", "APPROVED", "STOCK_ALLOCATED"].includes(order.status)) {
      throw new HttpException({ errorCode: "ORDER_008", message: "目前狀態不可取消" }, HttpStatus.BAD_REQUEST);
    }
    order.status = "CANCELLED";
    this.logger.log(`Order ${order.order_no} cancelled by ${userId}`);
    return this.orderRepo.save(order);
  }

  async unlock(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== "REJECTED_LOCKED") {
      throw new HttpException({ errorCode: "ORDER_009", message: "僅已鎖定訂單可解鎖" }, HttpStatus.BAD_REQUEST);
    }
    order.status = "DRAFT";
    order.reject_count = 0;
    this.logger.log(`Order ${order.order_no} unlocked by ${userId}`);
    return this.orderRepo.save(order);
  }

  
  async createConsignmentLedger(orderId: string, customerId: string) {
    const items = await this.em.query(
      "SELECT * FROM sales_order_item WHERE order_id = $1 AND consignment_quantity > 0",
      [orderId]
    );
    
    for (const item of items) {
      const existing = await this.em.query(
        "SELECT * FROM customer_consignment_ledger WHERE source_sales_order_id = $1 AND product_id = $2",
        [orderId, item.product_id]
      );
      if (existing.length > 0) continue;
      
      await this.em.query(
        "INSERT INTO customer_consignment_ledger (customer_id, product_id, source_sales_order_id, remaining_qty, status) VALUES ($1,$2,$3,$4,'ACTIVE')",
        [customerId, item.product_id, orderId, item.consignment_quantity]
      );
      this.logger.log("Consignment ledger created: order=" + orderId + " product=" + item.product_id + " qty=" + item.consignment_quantity);
    }
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    order.deleted_at = new Date();
    await this.orderRepo.save(order);
    this.logger.log("Order deleted: " + order.order_no);
    return { message: "訂單已刪除" };
  }
}