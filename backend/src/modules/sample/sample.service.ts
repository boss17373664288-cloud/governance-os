import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { SampleRequest } from "../../entities/sample-request.entity";
import { CreateSampleDto, SubmitFeedbackDto } from "./dto/sample.dto";

@Injectable()
export class SampleService {
  private readonly logger = new Logger(SampleService.name);

  constructor(
    @InjectRepository(SampleRequest) private readonly repo: Repository<SampleRequest>,
  ) {}

  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const page_size = parseInt(query.page_size) || 15;
    let where = "";
    const params: any[] = [];
    if (query.status) { where += " AND sr.status = $" + (params.length + 1); params.push(query.status); }
    if (query.purpose) { where += " AND sr.purpose = $" + (params.length + 1); params.push(query.purpose); }
    const countResult = await this.repo.manager.query(
      "SELECT COUNT(*) as cnt FROM sample_request sr WHERE 1=1" + where,
      params
    );
    const total = parseInt(countResult[0].cnt);
    const items = await this.repo.manager.query(
      "SELECT sr.*, pm.product_name, pm.product_code, cm.customer_name, cm.customer_code " +
      "FROM sample_request sr " +
      "LEFT JOIN product_master pm ON pm.product_id = sr.product_id " +
      "LEFT JOIN customer_master cm ON cm.customer_id = sr.customer_id " +
      "WHERE 1=1" + where +
      " ORDER BY sr.created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2),
      [...params, page_size, (page - 1) * page_size]
    );
    return { items, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async findOne(id: string) {
    const rows = await this.repo.manager.query(
      "SELECT sr.*, pm.product_name, pm.product_code, cm.customer_name, cm.customer_code " +
      "FROM sample_request sr " +
      "LEFT JOIN product_master pm ON pm.product_id = sr.product_id " +
      "LEFT JOIN customer_master cm ON cm.customer_id = sr.customer_id " +
      "WHERE sr.sample_id = $1",
      [id]
    );
    if (rows.length === 0) throw new HttpException({ errorCode: "SMP_001", message: "打板申請不存在" }, HttpStatus.NOT_FOUND);
    return rows[0];
  }

  async create(dto: CreateSampleDto, userId: string) {
    const items = dto.items || [];
    if (items.length === 0) throw new HttpException({ errorCode: "SMP_009", message: "請至少選擇一個產品" }, HttpStatus.BAD_REQUEST);
    if (items.length > 5) throw new HttpException({ errorCode: "SMP_010", message: "單次最多5個產品" }, HttpStatus.BAD_REQUEST);

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const baseCount = await this.repo.count();

    let previousStatus = undefined;
    try {
      const cust = await this.repo.manager.query(
        "SELECT customer_status FROM customer_master WHERE customer_id = $1", [dto.customer_id]
      );
      if (cust.length > 0) previousStatus = cust[0].customer_status;
    } catch {}

    const saved: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sampleNo = "SP" + today + String(baseCount + i + 1).padStart(4, "0");
      const sample = this.repo.create({
        sample_id: uuidv4(),
        sample_no: sampleNo,
        customer_id: dto.customer_id,
        product_id: item.product_id,
        quantity: item.quantity,
        purpose: dto.purpose,
        status: "DRAFT",
        previous_customer_status: previousStatus,
        created_by: userId,
      });
      saved.push(await this.repo.save(sample));
    }

    this.logger.log("Samples created: " + saved.length + " items for customer " + dto.customer_id);
    return { count: saved.length, samples: saved };
  }

  async submit(id: string, userId: string) {
    const s = await this.findOne(id);
    if (s.status !== "DRAFT") throw new HttpException({ errorCode: "SMP_002", message: "僅草稿狀態可提交" }, HttpStatus.BAD_REQUEST);
    s.status = "SUBMITTED";
    s.submitted_at = new Date();
    return this.repo.save(s);
  }

  async approveManager(id: string, userId: string) {
    const s = await this.findOne(id);
    if (s.status !== "SUBMITTED") throw new HttpException({ errorCode: "SMP_003", message: "僅已提交狀態可審批" }, HttpStatus.BAD_REQUEST);
    s.status = "MANAGER_APPROVED";
    s.approved_by = userId;
    s.approved_at = new Date();
    return this.repo.save(s);
  }

  async qaRelease(id: string, userId: string) {
    const s = await this.findOne(id);
    if (s.status !== "MANAGER_APPROVED") throw new HttpException({ errorCode: "SMP_004", message: "僅主管已審批狀態可QA放行" }, HttpStatus.BAD_REQUEST);
    try {
      const recall = await this.repo.manager.query(
        "SELECT recall_level FROM product_master WHERE product_id = $1 AND recall_level IN ($2,$3)",
        [s.product_id, "R3", "R4"]
      );
      if (recall.length > 0) {
        throw new HttpException({ errorCode: "SMP_005", message: "產品處於Recall狀態(R3/R4)，無法QA放行" }, HttpStatus.BAD_REQUEST);
      }
    } catch (e) {
      if (e instanceof HttpException) throw e;
    }
    s.status = "QA_RELEASED";
    s.qa_released_by = userId;
    s.qa_released_at = new Date();
    return this.repo.save(s);
  }

  async ship(id: string, userId: string) {
    const s = await this.findOne(id);
    if (s.status !== "QA_RELEASED") throw new HttpException({ errorCode: "SMP_006", message: "僅QA已放行狀態可出庫" }, HttpStatus.BAD_REQUEST);
    s.status = "SHIPPED";
    s.shipped_by = userId;
    s.shipped_at = new Date();
    try {
      await this.repo.manager.query(
        "UPDATE customer_master SET customer_status = 'SAMPLING' WHERE customer_id = $1 AND customer_status IN ('LEAD','DEVELOPING')",
        [s.customer_id]
      );
      await this.repo.manager.query(
        "UPDATE customer_master SET total_sample_count = COALESCE(total_sample_count, 0) + 1 WHERE customer_id = $1",
        [s.customer_id]
      );
    } catch {}
    return this.repo.save(s);
  }

  async submitFeedback(id: string, dto: SubmitFeedbackDto, userId: string) {
    const s = await this.findOne(id);
    if (s.status !== "SHIPPED") throw new HttpException({ errorCode: "SMP_007", message: "僅已出庫狀態可填寫反饋" }, HttpStatus.BAD_REQUEST);
    s.feedback_result = dto.feedback_result;
    s.feedback_notes = dto.notes || undefined;
    s.feedback_date = new Date();
    s.status = "FEEDBACK_DONE";
    return this.repo.save(s);
  }

  async reject(id: string, userId: string) {
    const s = await this.findOne(id);
    if (!["SUBMITTED", "MANAGER_APPROVED", "QA_RELEASED"].includes(s.status)) {
      throw new HttpException({ errorCode: "SMP_008", message: "當前狀態不可退回" }, HttpStatus.BAD_REQUEST);
    }
    s.status = "REJECTED";
    return this.repo.save(s);
  }
}