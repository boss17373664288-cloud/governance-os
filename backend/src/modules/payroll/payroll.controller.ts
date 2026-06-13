import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PayrollService } from "./payroll.service";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("payroll")
@UseGuards(AuthGuard("jwt"))
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Get("configs") getConfigs() { return this.service.getConfigs(); }
  @Post("configs") saveConfig(@Body() body: any) { return this.service.saveConfig(body); }
  @Put("configs/:id") updateConfig(@Param("id") id: string, @Body() body: any) { return this.service.saveConfig({ ...body, employee_id: id }); }

  @Get("calculate") calculate(@Query("employee_id") employeeId: string, @Query("month") month: string) {
    return this.service.calculatePreview(employeeId, month);
  }

  @Get() list(@Query() q: any) { return this.service.list(q); }
  @Post("generate") generate(@Body() body: any, @CurrentUser("employee_id") userId: string) { return this.service.generateMonthly(body, userId); }
  @Get(":id") getOne(@Param("id") id: string) { return this.service.getOne(id); }
  @Delete(":id") remove(@Param("id") id: string) { return this.service.remove(id); }
  @Post(":id/post") postToJournal(@Param("id") id: string, @CurrentUser("employee_id") userId: string) { return this.service.postToJournal(id, userId); }
}
