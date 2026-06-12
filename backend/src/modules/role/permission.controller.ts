import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RoleService } from "./role.service";

@Controller("permissions")
@UseGuards(AuthGuard("jwt"))
export class PermissionController {
  constructor(private readonly service: RoleService) {}

  @Get()
  findAll() {
    return this.service.findAllPermissions();
  }
}
