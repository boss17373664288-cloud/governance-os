import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GoodsReceiptService } from "./goods-receipt.service";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("goods-receipts")
@UseGuards(AuthGuard("jwt"))
export class GoodsReceiptController {
  constructor(private readonly service: GoodsReceiptService) {}

  @Get() list(@Query() query: any) { return this.service.list(query); }
  @Get(":id") getOne(@Param("id") id: string) { return this.service.getOne(id); }
  @Post("from-po") createFromPO(@Body() dto: any, @CurrentUser("employee_id") userId: string) { return this.service.createFromPO(dto, userId); }
  @Put(":id/confirm") confirmReceipt(@Param("id") id: string, @Body("items") items: any[], @CurrentUser("employee_id") userId: string) { return this.service.confirmReceipt(id, items, userId); }
  @Put(":id/submit-qa") submitQA(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.service.submitQA(id, userId); }
  @Put(":id/qa-result") qaResult(@Param("id") id: string, @Body("items") items: any[], @CurrentUser("employee_id") userId: string) { return this.service.qaResult(id, items, userId); }
  @Put(":id/warehouse") confirmWarehouse(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.service.confirmWarehouse(id, userId); }
  @Put(":id/return") startReturn(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.service.startReturn(id, userId); }
  @Put(":id/return-confirm") confirmReturn(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.service.confirmReturn(id, userId); }
}
