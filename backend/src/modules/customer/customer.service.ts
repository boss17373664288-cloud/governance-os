import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, FindOptionsWhere } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Customer } from "../../entities/customer.entity";
import { CreateCustomerDto, UpdateCustomerDto } from "./dto/customer.dto";
import { PaginationDto, PaginatedResult } from "../../shared/dto/pagination.dto";

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async findAll(query: PaginationDto & { search?: string; status?: string; region_code?: string; owning_employee_id?: string }): Promise<PaginatedResult<Customer>> {
    const { page = 1, page_size = 20, sort_by = "created_at", sort_order = "DESC", search, status, region_code, owning_employee_id } = query;
    const where: FindOptionsWhere<Customer> = {};
    if (status) where.customer_status = status;
    if (region_code) where.region_code = region_code;
    if (owning_employee_id) where.owning_employee_id = owning_employee_id;
    const [items, total] = await this.customerRepo.findAndCount({
      where: search
        ? [{ ...where, customer_name: Like("%" + search + "%") }, { ...where, customer_code: Like("%" + search + "%") }, { ...where, unified_business_no: Like("%" + search + "%") }]
        : where,
      order: { [sort_by]: sort_order }, skip: (page - 1) * page_size, take: page_size,
      relations: ["owning_employee"],
    });
    return { items, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { customer_id: id }, relations: ["owning_employee", "company"] });
    if (!customer) throw new HttpException({ errorCode: "CUST_001", message: "客户不存在" }, HttpStatus.NOT_FOUND);
    return customer;
  }

  async create(dto: CreateCustomerDto, userId: string): Promise<Customer> {
    const zipPrefix = dto.company_zip_code.substring(0, 3);
    const zipNum = parseInt(zipPrefix, 10);
    const typePrefix = zipNum >= 100 && zipNum <= 399 ? "N" : zipNum >= 400 && zipNum <= 599 ? "M" : "S";
    const seq = await this.customerRepo.count({ where: { company_zip_code: Like(zipPrefix + "%") } });
    const customerCode = typePrefix + zipPrefix + String(seq + 1).padStart(5, "0");
    const defaultCompany = await this.customerRepo.manager.query("SELECT company_id FROM company LIMIT 1"); const defaultCompanyId = defaultCompany[0]?.company_id || uuidv4(); return this.customerRepo.save({ customer_id: uuidv4(), ...dto, customer_code: customerCode, customer_status: "LEAD", created_by: userId, owning_employee_id: userId, company_id: dto.company_id || defaultCompanyId, tenant_id: dto.tenant_id || uuidv4(), } as any);
  }

  async update(id: string, dto: UpdateCustomerDto, userId: string): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, { ...dto, updated_by: userId });
    return this.customerRepo.save(customer);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.customerRepo.softDelete(id);
  }

  async getContacts(id: string) {
    return this.customerRepo.manager.query("SELECT * FROM customer_contact WHERE customer_id = $1 AND deleted_at IS NULL ORDER BY sort_order", [id]);
  }

  async getTimeline(id: string) {
    return this.customerRepo.manager.query("SELECT visit_id as event_id, visit_date as event_date, visit_type as event_type, result_code as description, created_at FROM visit WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50", [id]);
  }

  async getConsignment(id: string) {
    return this.customerRepo.manager.query("SELECT * FROM customer_consignment_ledger WHERE customer_id = $1 ORDER BY created_at DESC", [id]);
  }
  // ── Contact CRUD ──
  async createContact(customerId: string, dto: any) {
    const id = uuidv4();
    await this.customerRepo.manager.query(
      `INSERT INTO customer_contact (contact_id, customer_id, contact_name, title, phone, email, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, customerId, dto.contact_name, dto.title || null, dto.phone || null, dto.email || null, dto.sort_order || 0]
    );
    return { contact_id: id, ...dto };
  }

  async updateContact(customerId: string, contactId: string, dto: any) {
    await this.customerRepo.manager.query(
      `UPDATE customer_contact SET contact_name=$1, title=$2, phone=$3, email=$4, sort_order=$5, updated_at=NOW()
       WHERE contact_id=$6 AND customer_id=$7`,
      [dto.contact_name, dto.title || null, dto.phone || null, dto.email || null, dto.sort_order || 0, contactId, customerId]
    );
    return { contact_id: contactId, ...dto };
  }

  async deleteContact(customerId: string, contactId: string) {
    await this.customerRepo.manager.query(
      `UPDATE customer_contact SET deleted_at=NOW() WHERE contact_id=$1 AND customer_id=$2`,
      [contactId, customerId]
    );
    return { message: "已刪除" };
  }
}