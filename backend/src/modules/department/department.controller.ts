import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DepartmentService } from "./department.service";

@Controller("departments")
export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}

  @Get()
  findAll(@Query("company_id") companyId?: string) {
    return this.service.findAll(companyId);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("tree")
  findTree(@Query("company_id") companyId?: string) {
    return this.service.findTree(companyId);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @UseGuards(AuthGuard("jwt"))
  @Put(":id")
  update(@Param("id") id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @UseGuards(AuthGuard("jwt"))
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
