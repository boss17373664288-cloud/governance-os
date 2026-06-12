import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RoleService } from "./role.service";

@Controller("roles")
@UseGuards(AuthGuard("jwt"))
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get()
  findAllRoles() {
    return this.service.findAllRoles();
  }

  @Get(":id")
  findOneRole(@Param("id") id: string) {
    return this.service.findOneRole(id);
  }

  @Post()
  createRole(@Body() dto: any) {
    return this.service.createRole(dto);
  }

  @Put(":id")
  updateRole(@Param("id") id: string, @Body() dto: any) {
    return this.service.updateRole(id, dto);
  }

  @Delete(":id")
  removeRole(@Param("id") id: string) {
    return this.service.removeRole(id);
  }

  @Get(":id/permissions")
  getRolePermissions(@Param("id") id: string) {
    return this.service.getRolePermissions(id);
  }

  @Put(":id/permissions")
  setRolePermissions(@Param("id") id: string, @Body() body: { permission_ids: string[] }) {
    return this.service.setRolePermissions(id, body.permission_ids);
  }
}
