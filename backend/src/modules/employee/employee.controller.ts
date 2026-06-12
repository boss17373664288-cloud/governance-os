import { Controller, Get, Put, Param, Query, Body, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EmployeeService } from "./employee.service";
import { Roles } from "../../core/auth/decorators/roles.decorator";

@Controller("employees")
@UseGuards(AuthGuard("jwt"))
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @Get()
  @Roles("ADMIN", "GM")
  findAll(@Query() q: any) {
    return this.service.findAll(q);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Put(":id")
  @Roles("ADMIN", "GM")
  update(@Param("id") id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }
}
