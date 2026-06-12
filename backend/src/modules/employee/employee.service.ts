import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Employee } from "../../entities/employee.entity";
import { EmployeePosition } from "../../entities/employee-position.entity";
import { UserRole } from "../../entities/user-role.entity";

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee) private readonly repo: Repository<Employee>,
    @InjectRepository(EmployeePosition) private readonly epRepo: Repository<EmployeePosition>,
    @InjectRepository(UserRole) private readonly urRepo: Repository<UserRole>,
  ) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    } else if (query.active === "true" || query.active === true) {
      where.status = "ACTIVE";
    }
    if (query.role_code) where.role_code = query.role_code;
    if (query.region_code) where.region_code = query.region_code;
    const page = Math.max(1, parseInt(query.page) || 1);
    const pageSize = Math.min(100, parseInt(query.page_size) || 20);
    const [items, total] = await this.repo.findAndCount({
      where,
      select: ["employee_id", "employee_no", "full_name", "display_name", "job_title", "email", "phone", "mobile", "region_code", "status", "created_at"],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { employee_no: "ASC" },
    });
    return { items, pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) } };
  }

  async findOne(id: string) {
    const employee = await this.repo.findOne({
      where: { employee_id: id },
      select: ["employee_id", "employee_no", "full_name", "display_name", "email", "phone", "mobile", "job_title", "region_code", "status", "mfa_enabled", "last_login_at", "tenant_id", "created_at", "updated_at"],
    });
    if (!employee) throw new HttpException({ errorCode: "SYSTEM_001", message: "员工不存在" }, HttpStatus.NOT_FOUND);

    // Get multi-department positions
    const positions = await this.epRepo.find({ where: { employee_id: id } });
    // Get multi-roles
    const roles = await this.urRepo.find({ where: { user_id: id } });

    return { ...employee, positions, roles };
  }

  async update(id: string, dto: any) {
    const employee = await this.repo.findOne({ where: { employee_id: id } });
    if (!employee) throw new HttpException({ errorCode: "SYSTEM_001", message: "员工不存在" }, HttpStatus.NOT_FOUND);
    Object.assign(employee, dto);
    return this.repo.save(employee);
  }
}
