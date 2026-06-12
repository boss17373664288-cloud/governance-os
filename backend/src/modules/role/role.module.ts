import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from "../../entities/role.entity";
import { Permission } from "../../entities/permission.entity";
import { RolePermission } from "../../entities/role-permission.entity";
import { UserRole } from "../../entities/user-role.entity";
import { RoleService } from "./role.service";
import { RoleController } from "./role.controller";
import { UserRoleController } from "./user-role.controller";
import { PermissionController } from "./permission.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole])],
  controllers: [RoleController, UserRoleController, PermissionController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
