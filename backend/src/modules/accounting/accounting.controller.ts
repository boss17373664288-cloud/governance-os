import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AccountingService } from "./accounting.service";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("accounting")
@UseGuards(AuthGuard("jwt"))
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get("accounts") getAccounts() { return this.service.getAccounts(); }
  @Post("accounts") createAccount(@Body() dto: any) { return this.service.createAccount(dto); }
  @Put("accounts/:id") updateAccount(@Param("id") id: string, @Body() dto: any) { return this.service.updateAccount(id, dto); }

  @Get("journal") getJournalEntries(@Query() q: any) { return this.service.getJournalEntries(q); }
  @Get("journal/:id") getJournalEntry(@Param("id") id: string) { return this.service.getJournalEntry(id); }
  @Post("journal") createJournalEntry(@Body() dto: any, @CurrentUser("employee_id") userId: string) { return this.service.createJournalEntry(dto, userId); }

  @Get("ledger") getGeneralLedger(@Query() q: any) { return this.service.getGeneralLedger(q); }
  @Get("income-statement") getIncomeStatement(@Query() q: any) { return this.service.getIncomeStatement(q); }
  
  @Get("petty-cash") getPettyCash(@Query() q: any) { return this.service.getPettyCash(q); }
  @Post("petty-cash") createPettyCash(@Body() dto: any, @CurrentUser("employee_id") userId: string) { return this.service.createPettyCash(dto, userId); }
  @Put("petty-cash/:id") updatePettyCash(@Param("id") id: string, @Body() dto: any) { return this.service.updatePettyCash(id, dto); }
  @Delete("petty-cash/:id") deletePettyCash(@Param("id") id: string) { return this.service.deletePettyCash(id); }
  
  @Get("bank-statement") getBankStatement(@Query() q: any) { return this.service.getBankStatement(q); }
  @Post("bank-statement") addBankStatement(@Body() dto: any) { return this.service.addBankStatement(dto); }
  @Put("bank-statement/:id") updateBankStatement(@Param("id") id: string, @Body() dto: any) { return this.service.updateBankStatement(id, dto); }
  @Delete("bank-statement/:id") deleteBankStatement(@Param("id") id: string) { return this.service.deleteBankStatement(id); }
  @Put("bank-statement/:id/reconcile") reconcileBank(@Param("id") id: string) { return this.service.reconcileBank(id); }
  @Get("reconciliation") getReconciliation() { return this.service.getReconciliation(); }
  @Get("cashbook") getCashBook(@Query() q: any) { return this.service.getCashBook(q); }
  @Get("balance-sheet") getBalanceSheet() { return this.service.getBalanceSheet(); }

  @Get("ap") getApList(@Query() q: any) { return this.service.getApList(q); }
  @Post("ap/pay") recordApPayment(@Body() dto: any, @CurrentUser("employee_id") userId: string) { return this.service.recordApPayment(dto, userId); }
}
