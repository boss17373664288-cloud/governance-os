import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CommissionService } from "./commission.service";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("commission")
@UseGuards(AuthGuard("jwt"))
export class CommissionController {
  constructor(private readonly service: CommissionService) {}

  @Get("configs") getConfigs() { return this.service.getConfigs(); }
  @Post("configs") saveConfig(@Body() body: any) { return this.service.saveConfig(body); }

  @Get("products") getProducts() { return this.service.getProducts(); }

  @Get("calculate") calculate(@Query("employee_id") eid: string, @Query("month") month: string) {
    return this.service.calculate(eid, month);
  }

  @Get() list(@Query() q: any) { return this.service.list(q); }
  @Post("generate") generate(@Body() body: any, @CurrentUser("employee_id") uid: string) { return this.service.generate(body, uid); }
  @Get(":id") getOne(@Param("id") id: string) { return this.service.getOne(id); }
  @Delete(":id") remove(@Param("id") id: string) { return this.service.remove(id); }
  @Post(":id/post") postToJournal(@Param("id") id: string, @CurrentUser("employee_id") uid: string) { return this.service.postToJournal(id, uid); }
}
