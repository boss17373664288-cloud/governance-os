import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SupplierService } from "./supplier.service";
import { CreateSupplierDto } from "./dto/supplier.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("suppliers")
@UseGuards(AuthGuard("jwt"))
export class SupplierController {
  constructor(private readonly service: SupplierService) {}

  @Get()
  findAll(@Query() q: any) {
    return this.service.findAll(q);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSupplierDto, @CurrentUser("employee_id") userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: any, @CurrentUser("employee_id") userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}