import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { BudgetService } from "./budget.service";
import { Roles } from "../../core/auth/decorators/roles.decorator";

@Controller("budget")
@UseGuards(AuthGuard("jwt"))
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // Dashboard
  @Get("dashboard")
  @Roles("FINANCE", "GM", "EXECUTIVE_DIRECTOR", "SALES_MANAGER", "ADMIN")
  dashboard() { return this.budgetService.getDashboard(); }

  // Budget Plan CRUD
  @Get("plans")
  @Roles("FINANCE", "GM", "ADMIN")
  listPlans(@Query("year") year?: string, @Query("department") department?: string) {
    return this.budgetService.listPlans(year ? parseInt(year) : undefined, department);
  }

  @Post("plans")
  @Roles("FINANCE", "ADMIN")
  createPlan(@Body() dto: any) { return this.budgetService.createPlan(dto); }

  @Put("plans/:id")
  @Roles("FINANCE", "ADMIN")
  updatePlan(@Param("id") id: string, @Body() dto: any) { return this.budgetService.updatePlan(id, dto); }

  @Delete("plans/:id")
  @Roles("FINANCE", "ADMIN")
  deletePlan(@Param("id") id: string) { return this.budgetService.deletePlan(id); }

  // Budget Check & Commit
  @Post("check")
  @Roles("FINANCE", "GM", "ADMIN")
  check(@Body() params: { department: string; expenseType: string; amount: number }) {
    return this.budgetService.checkBudget(params);
  }

  @Post("commit")
  @Roles("FINANCE", "ADMIN")
  commit(@Body() params: { department: string; expenseType: string; amount: number; referenceId: string }) {
    return this.budgetService.commitBudget(params);
  }

  // Budget Adjustments
  @Get("adjustments")
  @Roles("FINANCE", "GM", "ADMIN")
  listAdjustments(@Query("budget_id") budgetId?: string) {
    return this.budgetService.listAdjustments(budgetId);
  }

  @Post("adjustments")
  @Roles("FINANCE", "ADMIN")
  createAdjustment(@Body() dto: any) { return this.budgetService.createAdjustment(dto); }

  // Expense Type Management
  @Get("expense-types")
  listExpenseTypes() { return this.budgetService.listExpenseTypes(); }

  @Post("expense-types")
  addExpenseType(@Body() body: { code: string; label: string }) { return this.budgetService.addExpenseType(body.code, body.label); }

  @Delete("expense-types/:code")
  deleteExpenseType(@Param("code") code: string) { return this.budgetService.deleteExpenseType(code); }

}