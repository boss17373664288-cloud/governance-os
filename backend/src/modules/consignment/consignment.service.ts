import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ReleaseDto, ExchangeDto } from "./dto/consignment.dto";

const VALID_RELEASE_TRANSITIONS: Record<string, string[]> = {
  PENDING_QA: ["QA_APPROVED", "REJECTED"],
  QA_APPROVED: ["SHIPPED", "REJECTED"],
  SHIPPED: ["COMPLETED"],
  REJECTED: ["PENDING_QA"],
  COMPLETED: [],
};

@Injectable()
export class ConsignmentService {
  private readonly logger = new Logger(ConsignmentService.name);

  constructor(@InjectEntityManager() private readonly em: EntityManager, private readonly eventEmitter: EventEmitter2) {}

  async getLedger(customerId?: string) {
    let sql = `
      SELECT l.*, c.customer_code, c.customer_name, p.product_code, p.product_name,
        COALESCE(so.order_no, l.source_sales_order_id::text) as source_order_no
      FROM customer_consignment_ledger l
      JOIN customer_master c ON c.customer_id = l.customer_id
      JOIN product_master p ON p.product_id = l.product_id
      LEFT JOIN sales_order so ON so.order_id = l.source_sales_order_id
      WHERE l.status = 'ACTIVE' AND l.remaining_qty > 0
    `;
    const params: any[] = [];
    if (customerId) { sql += " AND l.customer_id = $1"; params.push(customerId); }
    sql += " ORDER BY l.created_at DESC";
    return this.em.query(sql, params);
  }

  // ====== 寄庫出庫 ======

  async getReleases(query: any) {
    let sql = `
      SELECT r.*, c.customer_code, c.customer_name, p.product_code, p.product_name
      FROM consignment_release r
      JOIN customer_master c ON c.customer_id = r.customer_id
      JOIN product_master p ON p.product_id = r.product_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (query.status) { sql += " AND r.status = $1"; params.push(query.status); }
    sql += " ORDER BY r.created_at DESC";
    if (query.page_size) {
      const page = query.page || 1;
      const pageSize = query.page_size;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(pageSize, (page - 1) * pageSize);
    }
    return this.em.query(sql, params);
  }

  async release(dto: ReleaseDto, userId: string) {
    return this.em.transaction(async (tx) => {
      const ledgers = await tx.query(
        "SELECT * FROM customer_consignment_ledger WHERE customer_id = $1 AND product_id = $2 AND status = 'ACTIVE' AND remaining_qty >= $3 ORDER BY created_at ASC LIMIT 1",
        [dto.customer_id, dto.product_id, dto.quantity]
      );
      if (ledgers.length === 0) {
        throw new HttpException({ errorCode: "CONSIGN_001", message: "寄庫額度不足或不存在" }, HttpStatus.BAD_REQUEST);
      }

      const releaseId = uuidv4();
      const releaseNo = "REL-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(Math.floor(Math.random() * 9000 + 1000));

      await tx.query(
        "INSERT INTO consignment_release (release_id, release_no, customer_id, product_id, quantity, status, created_by) VALUES ($1,$2,$3,$4,$5,'PENDING_QA',$6)",
        [releaseId, releaseNo, dto.customer_id, dto.product_id, dto.quantity, userId]
      );

      this.logger.log("Consignment release created: " + releaseNo + " status=PENDING_QA");
      this.eventEmitter.emit("consignment.release_submitted", { entityId: releaseId, release_no: releaseNo, customer_id: dto.customer_id, product_id: dto.product_id, quantity: dto.quantity });
      return { release_id: releaseId, release_no: releaseNo, status: "PENDING_QA", message: "已建立寄庫出庫申請，等待QA審批" };
    });
  }

  async qaApproveRelease(releaseId: string, userId: string) {
    return this.em.transaction(async (tx) => {
      const rows = await tx.query("SELECT * FROM consignment_release WHERE release_id = $1", [releaseId]);
      if (rows.length === 0) throw new HttpException({ errorCode: "CONSIGN_010", message: "出庫單不存在" }, HttpStatus.NOT_FOUND);
      const r = rows[0];
      if (r.status !== "PENDING_QA") {
        throw new HttpException({ errorCode: "CONSIGN_011", message: "僅待QA審批狀態可核准" }, HttpStatus.BAD_REQUEST);
      }
      await tx.query(
        "UPDATE consignment_release SET status = 'QA_APPROVED', qa_approved_by = $1, qa_approved_at = NOW() WHERE release_id = $2",
        [userId, releaseId]
      );
      this.logger.log("Consignment release QA approved: " + r.release_no);
      this.eventEmitter.emit("consignment.release_qa_approved", { entityId: releaseId, release_no: r.release_no, customer_id: r.customer_id, product_id: r.product_id, quantity: r.quantity });
      return { release_id: releaseId, release_no: r.release_no, status: "QA_APPROVED", message: "QA已放行，等待倉管出貨" };
    });
  }

  async rejectRelease(releaseId: string, userId: string) {
    return this.em.transaction(async (tx) => {
      const rows = await tx.query("SELECT * FROM consignment_release WHERE release_id = $1", [releaseId]);
      if (rows.length === 0) throw new HttpException({ errorCode: "CONSIGN_010", message: "出庫單不存在" }, HttpStatus.NOT_FOUND);
      const r = rows[0];
      if (!["PENDING_QA", "QA_APPROVED"].includes(r.status)) {
        throw new HttpException({ errorCode: "CONSIGN_012", message: "目前狀態不可駁回" }, HttpStatus.BAD_REQUEST);
      }
      await tx.query("UPDATE consignment_release SET status = 'REJECTED' WHERE release_id = $1", [releaseId]);
      this.logger.log("Consignment release rejected: " + r.release_no);
      return { release_id: releaseId, release_no: r.release_no, status: "REJECTED", message: "已駁回" };
    });
  }

  async shipRelease(releaseId: string, userId: string) {
    return this.em.transaction(async (tx) => {
      const rows = await tx.query("SELECT * FROM consignment_release WHERE release_id = $1", [releaseId]);
      if (rows.length === 0) throw new HttpException({ errorCode: "CONSIGN_010", message: "出庫單不存在" }, HttpStatus.NOT_FOUND);
      const r = rows[0];
      if (r.status !== "QA_APPROVED") {
        throw new HttpException({ errorCode: "CONSIGN_013", message: "僅QA已放行狀態可出貨" }, HttpStatus.BAD_REQUEST);
      }

      // 實際扣減寄庫額度
      await tx.query(
        "UPDATE customer_consignment_ledger SET remaining_qty = remaining_qty - $1, last_release_date = CURRENT_DATE WHERE customer_id = $2 AND product_id = $3 AND status = 'ACTIVE' AND remaining_qty >= $1",
        [r.quantity, r.customer_id, r.product_id]
      );
      await tx.query(
        "UPDATE customer_consignment_ledger SET status = 'DEPLETED' WHERE customer_id = $1 AND product_id = $2 AND remaining_qty <= 0",
        [r.customer_id, r.product_id]
      );

      await tx.query(
        "UPDATE consignment_release SET status = 'SHIPPED', shipped_by = $1, shipped_at = NOW() WHERE release_id = $2",
        [userId, releaseId]
      );
      this.logger.log("Consignment release shipped: " + r.release_no);
      this.eventEmitter.emit("consignment.release_shipped", { entityId: releaseId, release_no: r.release_no });
      return { release_id: releaseId, release_no: r.release_no, status: "SHIPPED", message: "已出貨完成" };
    });
  }

  async completeRelease(releaseId: string, userId: string) {
    const rows = await this.em.query("SELECT * FROM consignment_release WHERE release_id = $1", [releaseId]);
    if (rows.length === 0) throw new HttpException({ errorCode: "CONSIGN_010", message: "出庫單不存在" }, HttpStatus.NOT_FOUND);
    const r = rows[0];
    if (r.status !== "SHIPPED") {
      throw new HttpException({ errorCode: "CONSIGN_014", message: "僅已出貨狀態可結案" }, HttpStatus.BAD_REQUEST);
    }
    await this.em.query("UPDATE consignment_release SET status = 'COMPLETED' WHERE release_id = $1", [releaseId]);
    return { release_id: releaseId, release_no: r.release_no, status: "COMPLETED", message: "已結案" };
  }

  // ====== 寄庫換貨 ======

  async getExchanges(query: any) {
    let sql = `
      SELECT e.*, c.customer_code, c.customer_name,
        sp.product_code as source_product_code, sp.product_name as source_product_name,
        tp.product_code as target_product_code, tp.product_name as target_product_name
      FROM consignment_exchange e
      JOIN customer_master c ON c.customer_id = e.customer_id
      JOIN product_master sp ON sp.product_id = e.source_product_id
      JOIN product_master tp ON tp.product_id = e.target_product_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (query.status) { sql += " AND e.status = $1"; params.push(query.status); }
    sql += " ORDER BY e.created_at DESC";
    if (query.page_size) {
      const page = query.page || 1;
      const pageSize = query.page_size;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(pageSize, (page - 1) * pageSize);
    }
    return this.em.query(sql, params);
  }

  async exchange(dto: ExchangeDto, userId: string) {
    return this.em.transaction(async (tx) => {
      // Validate same brand/series
      const products = await tx.query(
        "SELECT product_id, brand_series_id, base_price FROM product_master WHERE product_id IN ($1, $2)",
        [dto.source_product_id, dto.target_product_id]
      );
      if (products.length < 2) throw new HttpException({ errorCode: "CONSIGN_002", message: "產品不存在" }, HttpStatus.BAD_REQUEST);
      const src = products.find((p: any) => p.product_id === dto.source_product_id);
      const tgt = products.find((p: any) => p.product_id === dto.target_product_id);
      if (!src || !tgt) throw new HttpException({ errorCode: "CONSIGN_002", message: "產品不存在" }, HttpStatus.BAD_REQUEST);
      // Check exchange mode from system params
      const modeParam = await tx.query("SELECT param_value FROM system_param WHERE param_key = 'consignment_exchange_mode'");
      const mode = modeParam.length > 0 ? JSON.parse(modeParam[0].param_value) : "SAME_SERIES";
      
      if (mode === "CUSTOM") {
        const pairsParam = await tx.query("SELECT param_value FROM system_param WHERE param_key = 'consignment_exchange_allowed_pairs'");
        const allowedPairs: any[] = pairsParam.length > 0 ? JSON.parse(pairsParam[0].param_value) : [];
        const products2 = await tx.query("SELECT product_id, product_code FROM product_master WHERE product_id IN ($1, $2)", [dto.source_product_id, dto.target_product_id]);
        const srcCode = products2.find((p: any) => p.product_id === dto.source_product_id)?.product_code;
        const tgtCode = products2.find((p: any) => p.product_id === dto.target_product_id)?.product_code;
        const allowed = allowedPairs.some((pair: any) => pair.source === srcCode && pair.target === tgtCode);
        if (!allowed) {
          throw new HttpException({ errorCode: "CONSIGN_003", message: "此產品組合不在換貨允許清單中" }, HttpStatus.BAD_REQUEST);
        }
      } else {
        if (src.brand_series_id !== tgt.brand_series_id) {
          throw new HttpException({ errorCode: "CONSIGN_003", message: "限同品牌同系列產品換貨" }, HttpStatus.BAD_REQUEST);
        }
      }

      // Validate source ledger has enough quantity
      const srcLedgers = await tx.query(
        "SELECT * FROM customer_consignment_ledger WHERE customer_id = $1 AND product_id = $2 AND status = 'ACTIVE' AND remaining_qty >= $3 ORDER BY created_at ASC LIMIT 1",
        [dto.customer_id, dto.source_product_id, dto.quantity]
      );
      if (srcLedgers.length === 0) {
        throw new HttpException({ errorCode: "CONSIGN_001", message: "來源產品寄庫額度不足" }, HttpStatus.BAD_REQUEST);
      }

      const exchangeId = uuidv4();
      const exchangeNo = "EXC-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(Math.floor(Math.random() * 9000 + 1000));

      await tx.query(
        "INSERT INTO consignment_exchange (exchange_id, exchange_no, customer_id, source_product_id, target_product_id, quantity, reason, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING_QA',$8)",
        [exchangeId, exchangeNo, dto.customer_id, dto.source_product_id, dto.target_product_id, dto.quantity, dto.reason || "", userId]
      );

      this.logger.log("Consignment exchange created: " + exchangeNo + " status=PENDING_QA");
      this.eventEmitter.emit("consignment.exchange_submitted", { entityId: exchangeId, exchange_no: exchangeNo, customer_id: dto.customer_id, source_product_id: dto.source_product_id, target_product_id: dto.target_product_id, quantity: dto.quantity });
      return { exchange_id: exchangeId, exchange_no: exchangeNo, status: "PENDING_QA", message: "已建立寄庫換貨申請，等待QA審批" };
    });
  }

  async qaApproveExchange(exchangeId: string, userId: string) {
    return this.em.transaction(async (tx) => {
      const rows = await tx.query("SELECT * FROM consignment_exchange WHERE exchange_id = $1", [exchangeId]);
      if (rows.length === 0) throw new HttpException({ errorCode: "CONSIGN_020", message: "換貨單不存在" }, HttpStatus.NOT_FOUND);
      const e = rows[0];
      if (e.status !== "PENDING_QA") {
        throw new HttpException({ errorCode: "CONSIGN_021", message: "僅待QA審批狀態可核准" }, HttpStatus.BAD_REQUEST);
      }
      await tx.query(
        "UPDATE consignment_exchange SET status = 'QA_APPROVED', qa_approved_by = $1, qa_approved_at = NOW() WHERE exchange_id = $2",
        [userId, exchangeId]
      );
      this.logger.log("Consignment exchange QA approved: " + e.exchange_no);
      this.eventEmitter.emit("consignment.exchange_qa_approved", { entityId: exchangeId, exchange_no: e.exchange_no, customer_id: e.customer_id, quantity: e.quantity });
      return { exchange_id: exchangeId, exchange_no: e.exchange_no, status: "QA_APPROVED", message: "QA已放行，等待倉管出貨" };
    });
  }

  async rejectExchange(exchangeId: string, userId: string) {
    return this.em.transaction(async (tx) => {
      const rows = await tx.query("SELECT * FROM consignment_exchange WHERE exchange_id = $1", [exchangeId]);
      if (rows.length === 0) throw new HttpException({ errorCode: "CONSIGN_020", message: "換貨單不存在" }, HttpStatus.NOT_FOUND);
      const e = rows[0];
      if (!["PENDING_QA", "QA_APPROVED"].includes(e.status)) {
        throw new HttpException({ errorCode: "CONSIGN_022", message: "目前狀態不可駁回" }, HttpStatus.BAD_REQUEST);
      }
      await tx.query("UPDATE consignment_exchange SET status = 'REJECTED' WHERE exchange_id = $1", [exchangeId]);
      this.logger.log("Consignment exchange rejected: " + e.exchange_no);
      return { exchange_id: exchangeId, exchange_no: e.exchange_no, status: "REJECTED", message: "已駁回" };
    });
  }

  async shipExchange(exchangeId: string, userId: string) {
    return this.em.transaction(async (tx) => {
      const rows = await tx.query("SELECT * FROM consignment_exchange WHERE exchange_id = $1", [exchangeId]);
      if (rows.length === 0) throw new HttpException({ errorCode: "CONSIGN_020", message: "換貨單不存在" }, HttpStatus.NOT_FOUND);
      const e = rows[0];
      if (e.status !== "QA_APPROVED") {
        throw new HttpException({ errorCode: "CONSIGN_023", message: "僅QA已放行狀態可出貨" }, HttpStatus.BAD_REQUEST);
      }

      // 實際執行換貨：扣減來源產品額度，增加目標產品額度
      const srcLedgers = await tx.query(
        "SELECT * FROM customer_consignment_ledger WHERE customer_id = $1 AND product_id = $2 AND status = 'ACTIVE' AND remaining_qty >= $3 ORDER BY created_at ASC LIMIT 1",
        [e.customer_id, e.source_product_id, e.quantity]
      );
      if (srcLedgers.length === 0) {
        throw new HttpException({ errorCode: "CONSIGN_001", message: "來源產品寄庫額度不足" }, HttpStatus.BAD_REQUEST);
      }
      const srcLedger = srcLedgers[0];
      const actualQty = Math.min(e.quantity, srcLedger.remaining_qty);

      await tx.query(
        "UPDATE customer_consignment_ledger SET remaining_qty = remaining_qty - $1 WHERE ledger_id = $2",
        [actualQty, srcLedger.ledger_id]
      );
      await tx.query(
        "UPDATE customer_consignment_ledger SET status = 'DEPLETED' WHERE ledger_id = $1 AND remaining_qty <= 0",
        [srcLedger.ledger_id]
      );

      const tgtLedgers = await tx.query(
        "SELECT * FROM customer_consignment_ledger WHERE customer_id = $1 AND product_id = $2 AND status = 'ACTIVE' LIMIT 1",
        [e.customer_id, e.target_product_id]
      );
      if (tgtLedgers.length > 0) {
        await tx.query(
          "UPDATE customer_consignment_ledger SET remaining_qty = remaining_qty + $1 WHERE ledger_id = $2",
          [actualQty, tgtLedgers[0].ledger_id]
        );
      } else {
        await tx.query(
          "INSERT INTO customer_consignment_ledger (ledger_id, customer_id, product_id, source_sales_order_id, remaining_qty, status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
          [uuidv4(), e.customer_id, e.target_product_id, srcLedger.source_sales_order_id, actualQty]
        );
      }

      await tx.query(
        "UPDATE consignment_exchange SET status = 'SHIPPED', shipped_by = $1, shipped_at = NOW() WHERE exchange_id = $2",
        [userId, exchangeId]
      );
      this.logger.log("Consignment exchange shipped: " + e.exchange_no);
      this.eventEmitter.emit("consignment.exchange_shipped", { entityId: exchangeId, exchange_no: e.exchange_no });
      return { exchange_id: exchangeId, exchange_no: e.exchange_no, status: "SHIPPED", message: "已換貨出貨完成" };
    });
  }

  async completeExchange(exchangeId: string, userId: string) {
    const rows = await this.em.query("SELECT * FROM consignment_exchange WHERE exchange_id = $1", [exchangeId]);
    if (rows.length === 0) throw new HttpException({ errorCode: "CONSIGN_020", message: "換貨單不存在" }, HttpStatus.NOT_FOUND);
    const e = rows[0];
    if (e.status !== "SHIPPED") {
      throw new HttpException({ errorCode: "CONSIGN_024", message: "僅已出貨狀態可結案" }, HttpStatus.BAD_REQUEST);
    }
    await this.em.query("UPDATE consignment_exchange SET status = 'COMPLETED' WHERE exchange_id = $1", [exchangeId]);
    return { exchange_id: exchangeId, exchange_no: e.exchange_no, status: "COMPLETED", message: "已結案" };
  }

  // ====== 呆滯預警 ======
  async getStaleAlert() {
    const param = await this.em.query(
      "SELECT param_value FROM system_param WHERE param_key = 'consignment_stale_days'"
    );
    const staleDays = parseInt(param[0]?.param_value || "90");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - staleDays);

    return this.em.query(`
      SELECT l.*, c.customer_code, c.customer_name, p.product_code, p.product_name
      FROM customer_consignment_ledger l
      JOIN customer_master c ON c.customer_id = l.customer_id
      JOIN product_master p ON p.product_id = l.product_id
      WHERE l.status = 'ACTIVE' AND l.remaining_qty > 0
        AND l.created_at < $1
        AND (l.last_release_date IS NULL OR l.last_release_date < $1)
      ORDER BY l.last_release_date ASC NULLS FIRST
    `, [cutoff.toISOString().slice(0, 10)]);
  }
}




