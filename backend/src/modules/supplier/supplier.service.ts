import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Supplier } from "../../entities/supplier.entity";

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier) private readonly repo: Repository<Supplier>,
  ) {}

  async findAll(query: any) {
    const page = query.page || 1;
    const page_size = query.page_size || 20;
    const [items, total] = await this.repo.findAndCount({
      where: { deleted_at: IsNull() },
      order: { created_at: "DESC" },
      skip: (page - 1) * page_size,
      take: page_size,
    });
    return { items, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async findOne(id: string) {
    const s = await this.repo.findOne({ where: { supplier_id: id } });
    if (!s) throw new HttpException({ errorCode: "SUPP_001", message: "供應商不存在" }, HttpStatus.NOT_FOUND);
    return s;
  }

  async create(dto: any, userId: string) {
    const tenantId = "00000000-0000-0000-0000-000000000001";
    // Auto-generate sequential supplier code
    const lastSupplier = await this.repo.findOne({
      where: { deleted_at: IsNull() },
      order: { supplier_code: "DESC" },
    });
    let nextSeq = 1;
    if (lastSupplier && lastSupplier.supplier_code) {
      const match = lastSupplier.supplier_code.match(/^SUPP-(\d+)$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }
    const supplierCode = "SUPP-" + String(nextSeq).padStart(3, "0");

    return this.repo.save({
      supplier_id: uuidv4(),
      supplier_code: supplierCode,
      supplier_name: dto.supplier_name,
      supplier_short_name: dto.supplier_short_name || null,
      tax_id: dto.tax_id || null,
      contact_person: dto.contact_person || null,
      contact_phone: dto.contact_phone || null,
      contact_email: dto.contact_email || null,
      address: dto.address || null,
      payment_terms: dto.payment_terms || "NET_30",
      is_active: true,
      tenant_id: tenantId,
    });
  }

  async update(id: string, dto: any, _userId: string) {
    const supplier = await this.findOne(id);
    if (dto.supplier_name !== undefined) supplier.supplier_name = dto.supplier_name;
    if (dto.supplier_short_name !== undefined) supplier.supplier_short_name = dto.supplier_short_name;
    if (dto.tax_id !== undefined) supplier.tax_id = dto.tax_id;
    if (dto.contact_person !== undefined) supplier.contact_person = dto.contact_person;
    if (dto.contact_phone !== undefined) supplier.contact_phone = dto.contact_phone;
    if (dto.contact_email !== undefined) supplier.contact_email = dto.contact_email;
    if (dto.address !== undefined) supplier.address = dto.address;
    if (dto.payment_terms !== undefined) supplier.payment_terms = dto.payment_terms;
    return this.repo.save(supplier);
  }

  async remove(id: string) {
    const supplier = await this.findOne(id);
    supplier.deleted_at = new Date();
    return this.repo.save(supplier);
  }
}