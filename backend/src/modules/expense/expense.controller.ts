import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ExpenseService } from "./expense.service";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("expense")
@UseGuards(AuthGuard("jwt"))
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  @Get("accounts") getAccounts() { return this.service.getChartOfAccounts(); }

  @Get("hidden-accounts") getHiddenAccounts() { return this.service.getHiddenAccounts(); }
  @Put("hidden-accounts") updateHiddenAccounts(@Body() body: { account_ids: string[] }) { return this.service.updateHiddenAccounts(body.account_ids); }

  @Get("employees") getEmployees() { return this.service.getEmployeesWithBudget(); }
  @Post("employees/:id/budget") setBudget(@Param("id") id: string, @Body() body: any) {
    return this.service.setEmployeeBudget(id, Number(body.monthly_amount) || 0);
  }

  @Get("check-budget") checkBudget(@Query("employee_id") employeeId: string, @Query("expense_month") expenseMonth: string) {
    return this.service.checkBudget(employeeId, expenseMonth);
  }

  @Get() list(@Query() q: any) { return this.service.list(q); }
  @Get(":id") getOne(@Param("id") id: string) { return this.service.getOne(id); }
  @Post() create(@Body() dto: any, @CurrentUser("employee_id") userId: string) { return this.service.create(dto, userId); }
  @Put(":id") update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }
  @Delete(":id") remove(@Param("id") id: string) { return this.service.remove(id); }
  @Post(":id/post") postToJournal(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.service.postToJournal(id, userId); }
}
