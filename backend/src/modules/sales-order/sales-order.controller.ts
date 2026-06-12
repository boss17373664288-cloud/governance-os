import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SalesOrderService } from "./sales-order.service";
import { CreateSalesOrderDto, ApproveOrderDto, RejectOrderDto } from "./dto/sales-order.dto";
import { PaginationDto } from "../../shared/dto/pagination.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("sales-orders")
@UseGuards(AuthGuard("jwt"))
export class SalesOrderController {
  constructor(private readonly salesOrderService: SalesOrderService) {}

  @Get()
  findAll(@Query() query: PaginationDto & { status?: string; customer_id?: string; search?: string }) {
    return this.salesOrderService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.salesOrderService.findOne(id);
  }

  @Get(":id/items")
  getItems(@Param("id") id: string) {
    return this.salesOrderService.getItems(id);
  }

  @Post()
  create(@Body() dto: CreateSalesOrderDto, @CurrentUser("employee_id") userId: string) {
    return this.salesOrderService.create(dto, userId);
  }

  @Put(":id/submit")
  submit(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.salesOrderService.submit(id, userId);
  }

  @Put(":id/approve")
  approve(@Param("id") id: string, @Body() dto: ApproveOrderDto, @CurrentUser("employee_id") userId: string) {
    return this.salesOrderService.approve(id, userId, dto);
  }

  @Put(":id/reject")
  reject(@Param("id") id: string, @Body() dto: RejectOrderDto, @CurrentUser("employee_id") userId: string) {
    return this.salesOrderService.reject(id, userId, dto);
  }

  @Put(":id/allocate")
  allocate(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.salesOrderService.allocate(id, userId);
  }

  @Put(":id/ship")
  ship(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.salesOrderService.ship(id, userId);
  }

  @Put(":id/complete")
  complete(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.salesOrderService.complete(id, userId);
  }

  @Put(":id/cancel")
  cancel(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.salesOrderService.cancel(id, userId);
  }

  @Put(":id/unlock")
  unlock(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.salesOrderService.unlock(id, userId);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.salesOrderService.remove(id);
  }
}