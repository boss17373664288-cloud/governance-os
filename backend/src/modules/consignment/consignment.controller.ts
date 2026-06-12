import { Controller, Get, Post, Put, Body, Query, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConsignmentService } from "./consignment.service";
import { ReleaseDto, ExchangeDto } from "./dto/consignment.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("consignment")
@UseGuards(AuthGuard("jwt"))
export class ConsignmentController {
  constructor(private readonly consignmentService: ConsignmentService) {}

  // 台帳
  @Get("ledger") getLedger(@Query("customer_id") customerId?: string) { return this.consignmentService.getLedger(customerId); }

  // ====== 寄庫出庫 ======
  @Get("releases") getReleases(@Query() query: any) { return this.consignmentService.getReleases(query); }
  @Post("release") release(@Body() dto: ReleaseDto, @CurrentUser("employee_id") userId: string) { return this.consignmentService.release(dto, userId); }
  @Put("release/:id/qa-approve") qaApproveRelease(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.consignmentService.qaApproveRelease(id, userId); }
  @Put("release/:id/reject") rejectRelease(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.consignmentService.rejectRelease(id, userId); }
  @Put("release/:id/ship") shipRelease(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.consignmentService.shipRelease(id, userId); }
  @Put("release/:id/complete") completeRelease(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.consignmentService.completeRelease(id, userId); }

  // ====== 寄庫換貨 ======
  @Get("exchanges") getExchanges(@Query() query: any) { return this.consignmentService.getExchanges(query); }
  @Post("exchange") exchange(@Body() dto: ExchangeDto, @CurrentUser("employee_id") userId: string) { return this.consignmentService.exchange(dto, userId); }
  @Put("exchange/:id/qa-approve") qaApproveExchange(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.consignmentService.qaApproveExchange(id, userId); }
  @Put("exchange/:id/reject") rejectExchange(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.consignmentService.rejectExchange(id, userId); }
  @Put("exchange/:id/ship") shipExchange(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.consignmentService.shipExchange(id, userId); }
  @Put("exchange/:id/complete") completeExchange(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.consignmentService.completeExchange(id, userId); }

  // 呆滯預警
  @Get("stale-alert") getStaleAlert() { return this.consignmentService.getStaleAlert(); }
}
