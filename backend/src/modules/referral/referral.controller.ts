import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ReferralService } from "./referral.service";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("referral")
@UseGuards(AuthGuard("jwt"))
export class ReferralController {
  constructor(private readonly service: ReferralService) {}

  @Get("referrers") getReferrers() { return this.service.getReferrers(); }
  @Post("referrers") saveReferrer(@Body() body: any) { return this.service.saveReferrer(body); }
  @Delete("referrers/:id") deleteReferrer(@Param("id") id: string) { return this.service.deleteReferrer(id); }

  @Get("links") getLinks() { return this.service.getLinks(); }
  @Post("links") saveLink(@Body() body: any) { return this.service.saveLink(body); }
  @Delete("links/:customer_id") deleteLink(@Param("customer_id") id: string) { return this.service.deleteLink(id); }

  @Get("customers") getUnlinkedCustomers(@Query("search") search: string) { return this.service.getUnlinkedCustomers(search); }

  @Get("calculate") calculate(@Query("referrer_id") rid: string, @Query("month") month: string) {
    return this.service.calculate(rid, month);
  }

  @Get() list(@Query() q: any) { return this.service.list(q); }
  @Post("generate") generate(@Body() body: any, @CurrentUser("employee_id") uid: string) { return this.service.generate(body, uid); }
  @Get(":id") getOne(@Param("id") id: string) { return this.service.getOne(id); }
  @Delete(":id") remove(@Param("id") id: string) { return this.service.remove(id); }
  @Post(":id/post") postToJournal(@Param("id") id: string, @CurrentUser("employee_id") uid: string) { return this.service.postToJournal(id, uid); }
}
