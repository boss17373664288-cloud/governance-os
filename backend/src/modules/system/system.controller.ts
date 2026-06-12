import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SystemService } from "./system.service";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { Response } from "express";

@Controller("system")
@UseGuards(AuthGuard("jwt"))
export class SystemController {
  private readonly logger = new Logger(SystemController.name);
  constructor(private readonly service: SystemService) {}

  // ====== Export (use @Res() without passthrough to bypass interceptor) ======
  @Get("export/customers")
  async exportCustomers(@Res() res: Response): Promise<void> {
    try {
      const data = await this.service.exportCustomersData();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
      res.send("\uFEFF" + data);
    } catch (e: any) {
      this.logger.error("export/customers: " + (e.message || e), e.stack);
      res.status(500).json({ message: "導出失敗: " + (e.message || "未知錯誤") });
    }
  }

  @Get("export/products")
  async exportProducts(@Res() res: Response): Promise<void> {
    try {
      const data = await this.service.exportProductsData();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=products.csv");
      res.send("\uFEFF" + data);
    } catch (e: any) {
      this.logger.error("export/products: " + (e.message || e), e.stack);
      res.status(500).json({ message: "導出失敗: " + (e.message || "未知錯誤") });
    }
  }

  @Get("export/suppliers")
  async exportSuppliers(@Res() res: Response): Promise<void> {
    try {
      const data = await this.service.exportSuppliersData();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=suppliers.csv");
      res.send("\uFEFF" + data);
    } catch (e: any) {
      this.logger.error("export/suppliers: " + (e.message || e), e.stack);
      res.status(500).json({ message: "導出失敗: " + (e.message || "未知錯誤") });
    }
  }

  @Get("export/orders")
  async exportOrders(@Res() res: Response): Promise<void> {
    try {
      const data = await this.service.exportOrdersData();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
      res.send("\uFEFF" + data);
    } catch (e: any) {
      this.logger.error("export/orders: " + (e.message || e), e.stack);
      res.status(500).json({ message: "導出失敗: " + (e.message || "未知錯誤") });
    }
  }

  @Get("export/finance-ar")
  async exportFinanceAr(@Res() res: Response): Promise<void> {
    try {
      const data = await this.service.exportFinanceArData();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=finance-ar.csv");
      res.send("\uFEFF" + data);
    } catch (e: any) {
      this.logger.error("export/finance-ar: " + (e.message || e), e.stack);
      res.status(500).json({ message: "導出失敗: " + (e.message || "未知錯誤") });
    }
  }

  @Get("export/audit-logs")
  async exportAuditLogs(@Res() res: Response): Promise<void> {
    try {
      const data = await this.service.exportAuditLogsData();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
      res.send("\uFEFF" + data);
    } catch (e: any) {
      this.logger.error("export/audit-logs: " + (e.message || e), e.stack);
      res.status(500).json({ message: "導出失敗: " + (e.message || "未知錯誤") });
    }
  }

    @Get("export/employees")
  async exportEmployees(@Res() res: Response): Promise<void> {
    try {
      const data = await this.service.exportEmployeesData();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=employees.csv");
      res.send("\uFEFF" + data);
    } catch (e: any) {
      this.logger.error("export/employees: " + (e.message || e), e.stack);
      res.status(500).json({ message: "匯出失敗" });
    }
  }

  @Get("export/inventory")
  async exportInventory(@Res() res: Response): Promise<void> {
    try {
      const data = await this.service.exportInventoryData();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=inventory.csv");
      res.send("\uFEFF" + data);
    } catch (e: any) {
      this.logger.error("export/inventory: " + (e.message || e), e.stack);
      res.status(500).json({ message: "導出失敗: " + (e.message || "未知錯誤") });
    }
  }

  @Get("enums") getEnums(@Query("type") type?: string) { return this.service.getEnums(type); }

  @Get("params") getParams() { return this.service.getParams(); }
  @Put("params/:key") updateParam(@Param("key") key: string, @Body("value") value: string, @CurrentUser("employee_id") userId: string) { return this.service.updateParam(key, value, userId); }

  @Get("roles") getRoles() { return this.service.getRoles(); }
  @Get("roles/:id") getRoleDetail(@Param("id") id: string) { return this.service.getRoleDetail(id); }
  @Put("roles/:id") updateRole(@Param("id") id: string, @Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.updateRole(id, body, userId); }
  @Get("roles/:id/permissions") getRolePermissions(@Param("id") id: string) { return this.service.getRolePermissions(id); }
  @Put("roles/:id/permissions") setRolePermissions(@Param("id") id: string, @Body("permission_ids") ids: string[], @CurrentUser("employee_id") userId: string) { return this.service.setRolePermissions(id, ids, userId); }

  @Get("permissions") getPermissions() { return this.service.getPermissions(); }

  @Get("users") getUsers(@Query() query: any) { return this.service.getUsers(query); }
  @Post("users") createUser(@Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.createUser(body, userId); }
  @Put("users/:id") updateUser(@Param("id") id: string, @Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.updateUser(id, body, userId); }
  @Delete("users/:id") deleteUser(@Param("id") id: string) { return this.service.deleteUser(id); }

  @Get("audit-logs") getAuditLogs(@Query() query: any) { return this.service.getAuditLogs(query); }

  @Get("devices") getDevices(@Query() query: any) { return this.service.getDevices(query); }
  @Delete("devices/:id") unbindDevice(@Param("id") id: string, @Body("reason") reason: string, @CurrentUser("employee_id") userId: string) { return this.service.unbindDevice(id, reason, userId); }

  @Get("profile") getProfile(@CurrentUser("employee_id") userId: string) { return this.service.getProfile(userId); }
  @Put("profile") updateProfile(@Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.updateProfile(userId, body); }
  @Put("profile/password") changePassword(@Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.changePassword(userId, body); }
  @Get("profile/devices") getMyDevices(@CurrentUser("employee_id") userId: string) { return this.service.getMyDevices(userId); }
  @Delete("profile/devices/:deviceId") unbindMyDevice(@Param("deviceId") deviceId: string, @CurrentUser("employee_id") userId: string) { return this.service.unbindMyDevice(deviceId, userId); }

  @Post("import/:entity") async importData(@Param("entity") entity: string, @Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.importData(entity, body, userId); }
  @Get("account-applications") getAccountApplications(@Query() query: any) { return this.service.getAccountApplications(query); }
  @Get("workflows") getWorkflows() { return this.service.getWorkflows(); }
  @Post("workflows") createWorkflow(@Body() dto: any, @CurrentUser("employee_id") userId: string) { return this.service.createWorkflow(dto, userId); }
  @Put("workflows/:id") updateWorkflow(@Param("id") id: string, @Body() dto: any, @CurrentUser("employee_id") userId: string) { return this.service.updateWorkflow(id, dto, userId); }
  @Delete("workflows/:id") deleteWorkflow(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.service.deleteWorkflow(id, userId); }
  @Get("field-policies") getFieldPolicies() { return this.service.getFieldPolicies(); }
  @Post("field-policies") createFieldPolicy(@Body() dto: any, @CurrentUser("employee_id") userId: string) { return this.service.createFieldPolicy(dto, userId); }
  @Put("field-policies/:id") updateFieldPolicy(@Param("id") id: string, @Body() dto: any, @CurrentUser("employee_id") userId: string) { return this.service.updateFieldPolicy(id, dto, userId); }
  @Delete("field-policies/:id") deleteFieldPolicy(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.service.deleteFieldPolicy(id, userId); }

  @Get("state-machines") getStateMachines() { return this.service.getStateMachines(); }

  @Put("account-applications/:id") reviewAccountApplication(@Param("id") id: string, @Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.reviewAccountApplication(id, body, userId); }

  // ====== Enum Options Management ======
  @Get("enum-options/:type") getEnumOptions(@Param("type") type: string) { return this.service.getEnumOptions(type); }
  @Put("enum-options/:type") saveEnumOptions(@Param("type") type: string, @Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.saveEnumOptions(type, body.options, userId); }
  @Post("enum-options/:type") addEnumOption(@Param("type") type: string, @Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.addEnumOption(type, body, userId); }
  @Delete("enum-options/:type/:code") deleteEnumOption(@Param("type") type: string, @Param("code") code: string, @CurrentUser("employee_id") userId: string) { return this.service.deleteEnumOption(type, code, userId); }
}