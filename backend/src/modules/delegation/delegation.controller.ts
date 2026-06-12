import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DelegationService } from "./delegation.service";

@Controller("delegations")
@UseGuards(AuthGuard("jwt"))
export class DelegationController {
  constructor(private readonly service: DelegationService) {}

  @Get()
  findAll(@Query() q: any) {
    return this.service.findAll(q);
  }

  @Get("active/:userId")
  findActive(@Param("userId") userId: string) {
    return this.service.findActive(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Put(":id/revoke")
  revoke(@Param("id") id: string) {
    return this.service.revoke(id);
  }
}
