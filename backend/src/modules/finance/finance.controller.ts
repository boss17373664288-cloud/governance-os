import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FinanceService } from "./finance.service";
import { PaymentDto } from "./dto/finance.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("finance")
@UseGuards(AuthGuard("jwt"))
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get("dashboard")
  getDashboard() {
    return this.financeService.getDashboard();
  }

  @Get("ar/list")
  getArList(@Query() query: any) {
    return this.financeService.getArList(query);
  }

  @Get("ar/aging")
  getAgingReport() {
    return this.financeService.getAgingReport();
  }

  @Get("ar/overdue")
  getOverdue() {
    return this.financeService.getOverdue();
  }

  @Get("ar/:id")
  getArDetail(@Param("id") id: string) {
    return this.financeService.getArDetail(id);
  }

  @Get("customer-ar/:customerId")
  getCustomerAr(@Param("customerId") customerId: string) {
    return this.financeService.getCustomerAr(customerId);
  }

  @Post("payment")
  processPayment(@Body() dto: PaymentDto, @CurrentUser("employee_id") userId: string) {
    return this.financeService.processPayment(dto, userId);
  }
}