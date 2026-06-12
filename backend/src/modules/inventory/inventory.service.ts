import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { BatchMaster } from "../../entities/recall-inventory.entity";
import { WarehouseMaster } from "../../entities/warehouse.entity";

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(BatchMaster) private readonly batchRepo: Repository<BatchMaster>,
    @InjectRepository(WarehouseMaster) private readonly warehouseRepo: Repository<WarehouseMaster>,
  ) {}

  async getDashboard(warehouseId?: string) {
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const baseWhere = warehouseId
      ? `WHERE l.warehouse_id = '${warehouseId}' AND b.batch_id IS NOT NULL`
      : `WHERE b.batch_id IS NOT NULL`;
    const ledgerJoin = warehouseId
      ? `FROM inventory_ledger l JOIN batch_master b ON l.batch_id::uuid = b.batch_id ${baseWhere}`
      : `FROM batch_master b ${baseWhere}`;
    const qtyField = warehouseId ? `COALESCE(SUM(l.balance_after), 0)` : `COALESCE(SUM(b.total_quantity), 0)`;

    const sql = (extra: string) =>
      `SELECT ${qtyField} as total ${ledgerJoin} ${extra}`;

    const [normal, expiring, recall, frozen] = await Promise.all([
      this.batchRepo.manager.query(sql("AND b.qa_status = 'PASSED' AND b.recall_status = 'NORMAL'")),
      this.batchRepo.manager.query(sql(`AND b.expiry_date <= '${thirtyDaysLater.toISOString().slice(0, 10)}'`)),
      this.batchRepo.manager.query(sql("AND b.recall_status IN ('R2','R3','R4')")),
      this.batchRepo.manager.query(sql("AND b.qa_status = 'FAILED'")),
    ]);

    return {
      total_quantity: parseInt(normal[0]?.total || "0"),
      expiring_quantity: parseInt(expiring[0]?.total || "0"),
      recall_quantity: parseInt(recall[0]?.total || "0"),
      frozen_quantity: parseInt(frozen[0]?.total || "0"),
    };
  }

  async getBatches(query: any) {
    const page = query.page || 1;
    const page_size = query.page_size || 15;
    const warehouseId = query.warehouse_id;
    const search = query.search || "";

    if (warehouseId) {
      // Build dynamic filters
      let extraWhere = "";
      const extraParams: any[] = [];
      let pIdx = 1; // $1 is warehouseId
      if (query.qa_status) { pIdx++; extraWhere += " AND b.qa_status = $" + pIdx; extraParams.push(query.qa_status); }
      if (query.recall_status) { const recallVals = query.recall_status.split(","); if (recallVals.length === 1) { pIdx++; extraWhere += " AND b.recall_status = $" + pIdx; extraParams.push(recallVals[0]); } else { const placeholders = recallVals.map((_:string) => "$" + (++pIdx)).join(","); extraWhere += " AND b.recall_status IN (" + placeholders + ")"; recallVals.forEach((v:string) => extraParams.push(v)); } }

      // Count query
      let countExtra = "";
      const countParams: any[] = [warehouseId];
      if (query.qa_status) { countExtra += " AND b.qa_status = $2"; countParams.push(query.qa_status); }
      if (query.recall_status) { const recallVals = query.recall_status.split(","); if (recallVals.length === 1) { countExtra += " AND b.recall_status = $" + (countParams.length + 1); countParams.push(recallVals[0]); } else { const placeholders = recallVals.map((_:string, i:number) => "$" + (countParams.length + i + 1)).join(","); countExtra += " AND b.recall_status IN (" + placeholders + ")"; recallVals.forEach((v:string) => countParams.push(v)); } }
      const countSql = `SELECT COUNT(DISTINCT l.batch_id) FROM inventory_ledger l JOIN batch_master b ON l.batch_id::uuid = b.batch_id WHERE l.warehouse_id = $1 AND l.balance_after > 0${countExtra}`;
      const countResult = await this.batchRepo.manager.query(countSql, countParams);
      const total = parseInt(countResult[0]?.count || "0");

      const limitIdx = pIdx + 1;
      const offsetIdx = pIdx + 2;

      const dataSql = `
        SELECT DISTINCT ON (b.batch_id)
          b.batch_id, b.batch_no, b.product_id, b.production_date, b.expiry_date,
          b.manufacturer, b.qa_status, b.recall_status,
          (SELECT COALESCE(SUM(l2.balance_after), 0) FROM inventory_ledger l2 WHERE l2.batch_id = l.batch_id AND l2.warehouse_id = $1) as total_quantity,
          b.created_at,
          p.product_code, p.product_name
        FROM inventory_ledger l
        JOIN batch_master b ON l.batch_id::uuid = b.batch_id
        JOIN product_master p ON p.product_id = b.product_id
        WHERE l.warehouse_id = $1 AND l.balance_after > 0${extraWhere}
        ORDER BY b.batch_id, b.created_at DESC
        LIMIT ${limitIdx} OFFSET ${offsetIdx}
      `;
      const items = await this.batchRepo.manager.query(dataSql, [warehouseId, ...extraParams, page_size, (page - 1) * page_size]);
      return { items: items.map((r: any) => ({ ...r, total_quantity: parseInt(r.total_quantity || "0") })), pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
    }

    const qb = this.batchRepo.createQueryBuilder("b")
      .leftJoin("product_master", "p", "p.product_id = b.product_id")
      .select(["b.batch_id", "b.batch_no", "b.product_id", "b.production_date", "b.expiry_date", "b.manufacturer", "b.qa_status", "b.recall_status", "b.total_quantity", "b.created_at", "p.product_code", "p.product_name"]);

    if (query.qa_status) qb.andWhere("b.qa_status = :qa", { qa: query.qa_status });
    if (query.recall_status) { const vals = query.recall_status.split(","); if (vals.length === 1) { qb.andWhere("b.recall_status = :rs", { rs: vals[0] }); } else { qb.andWhere("b.recall_status IN (:...rs)", { rs: vals }); } }
    if (search) {
      qb.andWhere("(b.batch_no ILIKE :s OR p.product_name ILIKE :s OR p.product_code ILIKE :s)", { s: `%${search}%` });
    }

    qb.orderBy("b.created_at", "DESC").skip((page - 1) * page_size).take(page_size);

    const [rawItems, total] = await Promise.all([qb.getRawMany(), qb.getCount()]);
    const items = rawItems.map((r: any) => ({
      batch_id: r.b_batch_id, batch_no: r.b_batch_no, product_id: r.b_product_id,
      product_code: r.p_product_code, product_name: r.p_product_name,
      production_date: r.b_production_date, expiry_date: r.b_expiry_date,
      manufacturer: r.b_manufacturer, qa_status: r.b_qa_status,
      recall_status: r.b_recall_status, total_quantity: parseInt(r.b_total_quantity || "0"),
      created_at: r.b_created_at,
    }));

    return { items, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async findOneBatch(id: string) {
    const batch = await this.batchRepo.findOne({ where: { batch_id: id } });
    if (!batch) throw new HttpException("批次不存在", HttpStatus.NOT_FOUND);
    return batch;
  }

  async createBatch(dto: any) {
    const tenantId = "00000000-0000-0000-0000-000000000001";
    const code = dto.batch_no || ("B" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + uuidv4().slice(0, 6).toUpperCase());
    return this.batchRepo.save({
      batch_id: uuidv4(),
      batch_no: code,
      product_id: dto.product_id,
      production_date: dto.production_date || null,
      expiry_date: dto.expiry_date,
      manufacturer: dto.manufacturer || null,
      qa_status: dto.qa_status || "PENDING",
      recall_status: dto.recall_status || "NORMAL",
      total_quantity: dto.total_quantity || 0,
    });
  }

  async updateBatch(id: string, dto: any) {
    const batch = await this.findOneBatch(id);
    if (dto.batch_no !== undefined) batch.batch_no = dto.batch_no;
    if (dto.product_id !== undefined) batch.product_id = dto.product_id;
    if (dto.production_date !== undefined) batch.production_date = dto.production_date;
    if (dto.expiry_date !== undefined) batch.expiry_date = dto.expiry_date;
    if (dto.manufacturer !== undefined) batch.manufacturer = dto.manufacturer;
    if (dto.qa_status !== undefined) batch.qa_status = dto.qa_status;
    if (dto.recall_status !== undefined) batch.recall_status = dto.recall_status;
    if (dto.total_quantity !== undefined) batch.total_quantity = dto.total_quantity;
    return this.batchRepo.save(batch);
  }

  async removeBatch(id: string) {
    const batch = await this.findOneBatch(id);
    return this.batchRepo.remove(batch);
  }

  // ── Warehouse CRUD ──

  async getWarehouses() {
    return this.warehouseRepo.find({ where: { is_active: true }, order: { warehouse_code: "ASC" } });
  }

  async createWarehouse(dto: any) {
    const tenantId = "00000000-0000-0000-0000-000000000001";
    const code = dto.warehouse_code || ("WH-" + String(Math.floor(Math.random() * 9000) + 1000));
    return this.warehouseRepo.save({
      warehouse_id: uuidv4(),
      warehouse_code: code,
      warehouse_name: dto.warehouse_name,
      warehouse_type: dto.warehouse_type || "BRANCH",
      address: dto.address || null,
      is_active: true,
      tenant_id: tenantId,
    });
  }

  async updateWarehouse(id: string, dto: any) {
    const wh = await this.warehouseRepo.findOne({ where: { warehouse_id: id } });
    if (!wh) throw new HttpException("倉庫不存在", HttpStatus.NOT_FOUND);
    if (dto.warehouse_name !== undefined) wh.warehouse_name = dto.warehouse_name;
    if (dto.warehouse_code !== undefined) wh.warehouse_code = dto.warehouse_code;
    if (dto.warehouse_type !== undefined) wh.warehouse_type = dto.warehouse_type;
    if (dto.address !== undefined) wh.address = dto.address;
    if (dto.is_active !== undefined) wh.is_active = dto.is_active;
    return this.warehouseRepo.save(wh);
  }

  async removeWarehouse(id: string) {
    const wh = await this.warehouseRepo.findOne({ where: { warehouse_id: id } });
    if (!wh) throw new HttpException("倉庫不存在", HttpStatus.NOT_FOUND);
    wh.is_active = false;
    return this.warehouseRepo.save(wh);
  }
}