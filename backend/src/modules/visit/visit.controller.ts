import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { VisitService } from "./visit.service";
import { CreateVisitDto, ScheduleVisitDto, CheckinDto } from "./dto/visit.dto";
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("visits")
@UseGuards(AuthGuard("jwt"))
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Get()
  findAll(@Query("customerId") customerId?: string, @CurrentUser("employee_id") userId?: string) {
    if (customerId) return this.visitService.findByCustomer(customerId);
    return this.visitService.getMyVisits(userId || "");
  }

  @Get("today")
  getToday(@CurrentUser("employee_id") userId: string) {
    return this.visitService.getTodaySchedule(userId);
  }

  @Post("schedule")
  schedule(@Body() dto: ScheduleVisitDto, @CurrentUser("employee_id") userId: string) {
    return this.visitService.schedule(dto, userId);
  }

  @Post("checkin")
  checkin(@Body() dto: CheckinDto, @CurrentUser("employee_id") userId: string) {
    return this.visitService.checkin(dto, userId);
  }

  @Put(":id/checkout")
  checkout(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.visitService.checkout(id, userId);
  }

  @Post("records")
  createRecord(@Body() dto: CreateVisitDto, @CurrentUser("employee_id") userId: string) {
    return this.visitService.createRecord(dto, userId);
  }


  @Get("admin/all")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  getAllWithDistance() {
    return this.visitService.getAllWithDistance();
  }
}
