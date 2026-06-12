import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ReleaseDto, ExchangeDto } from "./dto/consignment.dto";

@Injectable()
export class ConsignmentService {
  private readonly logger = new Logger(ConsignmentService.name);

  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async getLedger(customerId?: string) {
    let sql = `
      SELECT l.*, c.customer_code, c.customer_name, p.product_code, p.product_name
      FROM customer_consignment_ledger l
      JOIN customer_master c ON c.customer_id = l.customer_id
      JOIN product_master p ON p.product_id = l.product_id
      WHERE l.status = 'ACTIVE' AND l.remaining_qty > 0
    `;
    const params: any[] = [];
    if (customerId) { sql += " AND l.customer_id = $1"; params.push(customerId); }
    sql += " ORDER BY l.created_at DESC";
    return this.em.query(sql, params);
  }

  async release(dto: ReleaseDto, userId: string) {
    return this.em.transaction(async (tx) => {
      // Find active ledger entry
      const ledgers = await tx.query(
        "SELECT * FROM customer_consignment_ledger WHERE customer_id = $1 AND product_id = $2 AND status = 'ACTIVE' AND remaining_qty >= $3 ORDER BY created_at ASC LIMIT 1",
        [dto.customer_id, dto.product_id, dto.quantity]
      );
      if (ledgers.length === 0) {
        throw new HttpException({ errorCode: "CONSIGN_001", message: "寄庫額度不足或不存在" }, HttpStatus.BAD_REQUEST);
      }

      const ledger = ledgers[0];
      const releaseId = uuidv4();
      const releaseNo = "RELEASE-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(Math.floor(Math.random() * 9000 + 1000));

      // Deduct quantity
      await tx.query(
        "UPDATE customer_consignment_ledger SET remaining_qty = remaining_qty - $1, last_release_date = CURRENT_DATE WHERE ledger_id = $2",
        [dto.quantity, ledger.ledger_id]
      );

      // Set to DEPLETED if zero
      await tx.query(
        "UPDATE customer_consignment_ledger SET status = 'DEPLETED' WHERE ledger_id = $1 AND remaining_qty <= 0",
        [ledger.ledger_id]
      );

      this.logger.log("Consignment release: " + releaseNo + " qty=" + dto.quantity);
      return { release_id: releaseId, release_no: releaseNo, customer_id: dto.customer_id, product_id: dto.product_id, quantity: dto.quantity, status: "RELEASED" };
    });
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
      if (src.brand_series_id !== tgt.brand_series_id) {
        throw new HttpException({ errorCode: "CONSIGN_003", message: "限同品牌同系列產品換貨" }, HttpStatus.BAD_REQUEST);
      }

      // Deduct source
      const srcLedgers = await tx.query(
        "SELECT * FROM customer_consignment_ledger WHERE customer_id = $1 AND product_id = $2 AND status = 'ACTIVE' AND remaining_qty >= $3 ORDER BY created_at ASC LIMIT 1",
        [dto.customer_id, dto.source_product_id, dto.quantity]
      );
      if (srcLedgers.length === 0) {
        throw new HttpException({ errorCode: "CONSIGN_001", message: "來源產品寄庫額度不足" }, HttpStatus.BAD_REQUEST);
      }

      const srcLedger = srcLedgers[0];
      const actualQty = Math.min(dto.quantity, srcLedger.remaining_qty);

      // Deduct source
      await tx.query(
        "UPDATE customer_consignment_ledger SET remaining_qty = remaining_qty - $1 WHERE ledger_id = $2",
        [actualQty, srcLedger.ledger_id]
      );
      await tx.query(
        "UPDATE customer_consignment_ledger SET status = 'DEPLETED' WHERE ledger_id = $1 AND remaining_qty <= 0",
        [srcLedger.ledger_id]
      );

      // Find or create target ledger
      const tgtLedgers = await tx.query(
        "SELECT * FROM customer_consignment_ledger WHERE customer_id = $1 AND product_id = $2 AND status = 'ACTIVE' LIMIT 1",
        [dto.customer_id, dto.target_product_id]
      );

      if (tgtLedgers.length > 0) {
        await tx.query(
          "UPDATE customer_consignment_ledger SET remaining_qty = remaining_qty + $1 WHERE ledger_id = $2",
          [actualQty, tgtLedgers[0].ledger_id]
        );
      } else {
        await tx.query(
          "INSERT INTO customer_consignment_ledger (ledger_id, customer_id, product_id, source_sales_order_id, remaining_qty, status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
          [uuidv4(), dto.customer_id, dto.target_product_id, srcLedger.source_sales_order_id, actualQty]
        );
      }

      const exchangeId = uuidv4();
      this.logger.log("Consignment exchange: " + dto.source_product_id + " -> " + dto.target_product_id + " qty=" + actualQty);
      return { exchange_id: exchangeId, status: "COMPLETED", source_product_id: dto.source_product_id, target_product_id: dto.target_product_id, quantity: actualQty };
    });
  }

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