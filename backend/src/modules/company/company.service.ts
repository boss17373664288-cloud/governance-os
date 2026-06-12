import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Company } from "../../entities/company.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CompanyService {
  constructor(@InjectRepository(Company) private readonly repo: Repository<Company>) {}

  async findAll() { return this.repo.find({ order: { company_code: "ASC" } }); }

  async findOne(id: string) {
    const c = await this.repo.findOne({ where: { company_id: id } });
    if (!c) throw new (require("@nestjs/common").HttpException)({ errorCode: "COMP_001", message: "公司不存在" }, 404);
    return c;
  }

  async create(dto: any) {
    if (!dto.company_code || !dto.company_name) throw new (require("@nestjs/common").HttpException)({ message: "公司代碼與名稱為必填" }, 400);
    const exist = await this.repo.findOne({ where: { company_code: dto.company_code } });
    if (exist) throw new (require("@nestjs/common").HttpException)({ message: "公司代碼已存在" }, 409);
    return this.repo.save({ company_id: uuidv4(), ...dto });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    if (dto.company_code) {
      const dup = await this.repo.findOne({ where: { company_code: dto.company_code } });
      if (dup && dup.company_id !== id) throw new (require("@nestjs/common").HttpException)({ message: "公司代碼已存在" }, 409);
    }
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const c = await this.findOne(id);
    await this.repo.delete(id);
    return { message: "公司已刪除" };
  }
}