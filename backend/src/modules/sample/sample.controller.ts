import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SampleService } from "./sample.service";
import { CreateSampleDto, SubmitFeedbackDto } from "./dto/sample.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("sample-requests")
@UseGuards(AuthGuard("jwt"))
export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Get()
  findAll(@Query() q: any) {
    return this.sampleService.findAll(q);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sampleService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSampleDto, @CurrentUser("employee_id") userId: string) {
    return this.sampleService.create(dto, userId);
  }

  @Put(":id/submit")
  submit(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.sampleService.submit(id, userId);
  }

  @Put(":id/approve-manager")
  approveManager(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.sampleService.approveManager(id, userId);
  }

  @Put(":id/qa-release")
  qaRelease(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.sampleService.qaRelease(id, userId);
  }

  @Put(":id/ship")
  ship(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.sampleService.ship(id, userId);
  }

  @Post(":id/feedback")
  feedback(@Param("id") id: string, @Body() dto: SubmitFeedbackDto, @CurrentUser("employee_id") userId: string) {
    return this.sampleService.submitFeedback(id, dto, userId);
  }

  @Put(":id/reject")
  reject(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.sampleService.reject(id, userId);
  }
}