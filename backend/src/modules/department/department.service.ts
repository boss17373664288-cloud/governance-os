import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Department } from "../../entities/department.entity";

@Injectable()
export class DepartmentService {
  constructor(@InjectRepository(Department) private readonly repo: Repository<Department>) {}

  async findAll(companyId?: string) {
    const where: any = { deleted_at: IsNull() };
    if (companyId) where.company_id = companyId;
    return this.repo.find({ where, order: { sort_order: "ASC" } });
  }

  async findTree(companyId?: string) {
    const all = await this.findAll(companyId);
    return this.buildTree(all);
  }

  private buildTree(departments: Department[], parentId: string | null = null): any[] {
    return departments
      .filter((d) => (parentId === null && !d.parent_department_id) || d.parent_department_id === parentId)
      .map((d) => ({
        ...d,
        children: this.buildTree(departments, d.department_id),
      }));
  }

  async findOne(id: string) {
    const d = await this.repo.findOne({ where: { department_id: id } });
    if (!d) throw new HttpException({ errorCode: "DEPT_001", message: "部门不存在" }, HttpStatus.NOT_FOUND);
    return d;
  }

  async create(dto: any) {
    return this.repo.save(this.repo.create({ ...dto, department_id: undefined }));
  }

  async update(id: string, dto: any) {
    const d = await this.findOne(id);
    Object.assign(d, dto);
    return this.repo.save(d);
  }

  async remove(id: string) {
    const d = await this.findOne(id);
    d.deleted_at = new Date();
    return this.repo.save(d);
  }
}
