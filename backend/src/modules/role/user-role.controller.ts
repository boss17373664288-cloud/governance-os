import { Controller, Get, Put, Param, Body, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RoleService } from "./role.service";

@Controller("users")
@UseGuards(AuthGuard("jwt"))
export class UserRoleController {
  constructor(private readonly service: RoleService) {}

  @Get(":id/roles")
  getUserRoles(@Param("id") id: string) {
    return this.service.getUserRoles(id);
  }

  @Put(":id/roles")
  setUserRoles(@Param("id") id: string, @Body() body: { roles: any[]; granted_by?: string }) {
    return this.service.setUserRoles(id, body.roles, body.granted_by);
  }
}
