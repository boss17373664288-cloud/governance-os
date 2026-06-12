import { Injectable, UnauthorizedException, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository, InjectEntityManager } from "@nestjs/typeorm";
import { Repository, MoreThan, IsNull, EntityManager } from "typeorm";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Employee } from "../../entities/employee.entity";
import { RefreshToken, DeviceBinding } from "./refresh-token.entity";
import { jwtConfig } from "../../config";
import { LoginDto, RefreshDto, ChangePasswordDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(Employee) private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(RefreshToken) private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(DeviceBinding) private readonly deviceBindingRepo: Repository<DeviceBinding>,
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const employee = await this.employeeRepo.findOne({ where: { employee_no: dto.employee_no } });
    if (!employee) throw new UnauthorizedException({ error_code: "AUTH_002", message: "員工編號或密碼錯誤" });
    const valid = await bcrypt.compare(dto.password, employee.password_hash);
    if (!valid) throw new UnauthorizedException({ error_code: "AUTH_002", message: "員工編號或密碼錯誤" });
    if (employee.status !== "ACTIVE") throw new UnauthorizedException({ error_code: "AUTH_004", message: "帳號已被鎖定" });
    // Update last login timestamp
    await this.employeeRepo.update(employee.employee_id, { last_login_at: new Date() } as any);
    const payload = { sub: employee.employee_id, employee_no: employee.employee_no, role: employee.role_code };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    await this.refreshTokenRepo.insert({
      token_id: uuidv4(), token_hash: refreshToken, employee_id: employee.employee_id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return {
        access_token: accessToken, refresh_token: refreshToken,
        employee: { employee_id: employee.employee_id, employee_no: employee.employee_no, full_name: employee.full_name, role_code: employee.role_code, region_code: employee.region_code },
    };
  }

  async logout(employeeId: string) {
    await this.refreshTokenRepo.update({ employee_id: employeeId, revoked_at: IsNull() }, { revoked_at: new Date() });
    return { message: "已登出" };
  }

  async refresh(dto: RefreshDto) {
    const token = await this.refreshTokenRepo.findOne({
      where: { token_hash: dto.refresh_token, revoked_at: IsNull(), expires_at: MoreThan(new Date()) },
    });
    if (!token) throw new UnauthorizedException({ error_code: "AUTH_003", message: "Refresh token 無效或已過期" });
    const employee = await this.employeeRepo.findOne({ where: { employee_id: token.employee_id } });
    if (!employee) throw new UnauthorizedException({ error_code: "AUTH_005", message: "使用者不存在" });
    const payload = { sub: employee.employee_id, employee_no: employee.employee_no, role: employee.role_code };
    const accessToken = this.jwtService.sign(payload);
    return { access_token: accessToken, refresh_token: dto.refresh_token };
  }

  async changePassword(employeeId: string, dto: ChangePasswordDto) {
    const employee = await this.employeeRepo.findOne({ where: { employee_id: employeeId } });
    if (!employee) throw new HttpException({ message: "使用者不存在" }, 404);
    const valid = await bcrypt.compare(dto.old_password, employee.password_hash);
    if (!valid) throw new HttpException({ message: "原密碼錯誤" }, 400);
    employee.password_hash = await bcrypt.hash(dto.new_password, 10);
    await this.employeeRepo.save(employee);
    return { message: "密碼已更新" };
  }

  async getPermissions(employeeId: string) {
    const employee = await this.employeeRepo.findOne({ where: { employee_id: employeeId } });
    if (!employee) throw new HttpException({ message: "使用者不存在" }, 404);
    const perms: Record<string, string[]> = {
      SALES: ["customers","products","sample","visit","consignment","orders"],
      FINANCE: ["customers","products","finance","budget","purchase"],
      QA: ["recall","inventory","products"],
      WAREHOUSE: ["inventory","consignment","products"],
      PURCHASE: ["suppliers","purchase","products"],
      GM: ["*"], EXECUTIVE_DIRECTOR: ["*"], ADMIN: ["*"],
    };
    return { role_code: employee.role_code, region_code: employee.region_code, permissions: perms[employee.role_code] || [] };
  }

  async applyAccount(dto: { applicant_name: string; applicant_email: string; applicant_phone?: string; company_name?: string; department?: string; reason?: string }) {
    if (!dto.applicant_name?.trim()) throw new HttpException({ message: "請填寫申請人姓名" }, HttpStatus.BAD_REQUEST);
    if (!dto.applicant_email?.trim()) throw new HttpException({ message: "請填寫英文名（登錄帳號）" }, HttpStatus.BAD_REQUEST);
    const appId = uuidv4();
    await this.em.query(
      "INSERT INTO account_applications (application_id, applicant_name, applicant_email, applicant_phone, company_name, department, reason, status, tenant_id) VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING','00000000-0000-0000-0000-000000000001')",
      [appId, dto.applicant_name.trim(), dto.applicant_email.trim(), dto.applicant_phone || null, dto.company_name || null, dto.department || null, dto.reason || null]
    );
    try {
      const admins = await this.em.query("SELECT employee_id FROM employee_master WHERE role_code = 'ADMIN' AND deleted_at IS NULL LIMIT 5");
      for (const admin of admins) {
        await this.em.query(
          "INSERT INTO notifications (notification_id, recipient_id, title, content, notification_type, entity_type, entity_id, is_read, tenant_id) VALUES ($1,$2,$3,$4,'SYSTEM','ACCOUNT_APPLICATION',$5,false,'00000000-0000-0000-0000-000000000001')",
          [uuidv4(), admin.employee_id, '新帳號申請', `${dto.applicant_name} (${dto.applicant_email}) 申請開通帳號`, appId]
        );
      }
    } catch (e: any) { this.logger.warn("Failed to create notification: " + e.message); }
    this.logger.log(`Account application submitted by ${dto.applicant_email}`);
    return { application_id: appId, message: "申請已提交，請等待管理員審批" };
  }
}