import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PurchaseService } from "./purchase.service";
import { CreatePurchaseOrderDto, ReceiveGoodsDto, PurchaseReturnDto } from "./dto/purchase.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("purchase")
@UseGuards(AuthGuard("jwt"))
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.purchaseService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.purchaseService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser("employee_id") userId: string) {
    return this.purchaseService.create(dto, userId);
  }

  @Post(":id/receive")
  receive(@Param("id") id: string, @Body() dto: ReceiveGoodsDto, @CurrentUser("employee_id") userId: string) {
    return this.purchaseService.receiveGoods(id, dto, userId);
  }

  @Post(":id/return")
  returnGoods(@Param("id") id: string, @Body() dto: PurchaseReturnDto, @CurrentUser("employee_id") userId: string) {
    return this.purchaseService.returnGoods(id, dto, userId);
  }
}