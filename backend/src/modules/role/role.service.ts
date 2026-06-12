import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "../../entities/role.entity";
import { Permission } from "../../entities/permission.entity";
import { RolePermission } from "../../entities/role-permission.entity";
import { UserRole } from "../../entities/user-role.entity";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rpRepo: Repository<RolePermission>,
    @InjectRepository(UserRole) private readonly urRepo: Repository<UserRole>,
  ) {}

  async findAllRoles() {
    return this.roleRepo.find({ order: { role_code: "ASC" } });
  }

  async findOneRole(id: string) {
    const r = await this.roleRepo.findOne({ where: { role_id: id } });
    if (!r) throw new HttpException({ errorCode: "ROLE_001", message: "角色不存在" }, HttpStatus.NOT_FOUND);
    return r;
  }

  async createRole(dto: any) {
    return this.roleRepo.save(this.roleRepo.create({ ...dto, role_id: undefined }));
  }

  async updateRole(id: string, dto: any) {
    const r = await this.findOneRole(id);
    Object.assign(r, dto);
    return this.roleRepo.save(r);
  }

  async removeRole(id: string) {
    const r = await this.findOneRole(id);
    r.is_active = false;
    return this.roleRepo.save(r);
  }

  async findAllPermissions() {
    return this.permRepo.find({ order: { resource_code: "ASC", action: "ASC" } });
  }

  async getRolePermissions(roleId: string) {
    const rps = await this.rpRepo.find({ where: { role_id: roleId } });
    const permIds = rps.map((rp) => rp.permission_id);
    if (permIds.length === 0) return [];
    return this.permRepo.findByIds(permIds);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]) {
    await this.rpRepo.delete({ role_id: roleId } as any);
    if (permissionIds.length === 0) return [];
    const entities = permissionIds.map((pid): RolePermission => {
      const rp = new RolePermission();
      rp.role_id = roleId;
      rp.permission_id = pid;
      return rp;
    });
    return this.rpRepo.save(entities);
  }

  async getUserRoles(userId: string) {
    return this.urRepo.find({ where: { user_id: userId } as any });
  }

  async setUserRoles(userId: string, roles: { role_code: string; scope_type?: string; scope_value?: string }[], grantedBy?: string) {
    await this.urRepo.delete({ user_id: userId } as any);
    if (roles.length === 0) return [];
    const entities = roles.map((r): UserRole => {
      const ur = new UserRole();
      ur.user_id = userId;
      ur.role_code = r.role_code;
      if (r.scope_type) ur.scope_type = r.scope_type;
      if (r.scope_value) ur.scope_value = r.scope_value;
      if (grantedBy) ur.granted_by = grantedBy;
      return ur;
    });
    return this.urRepo.save(entities);
  }
}