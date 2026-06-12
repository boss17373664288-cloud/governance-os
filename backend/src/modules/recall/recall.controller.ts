import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecallService } from './recall.service';
import { CreateRecallDto, ReplaceBatchDto } from './dto/recall.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../core/auth/decorators/roles.decorator';

@Controller('recall')
@UseGuards(AuthGuard('jwt'))
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  @Get()
  findAll(@Query() query: PaginationDto & { status?: string; level?: string }) {
    return this.recallService.findAll(query);
  }

  @Get('trace/:batchNo')
  @Roles('QA', 'QA_DIRECTOR', 'GM', 'ADMIN')
  trace(@Param('batchNo') batchNo: string) {
    return this.recallService.trace(batchNo);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recallService.findOne(id);
  }

  @Post()
  @Roles('QA', 'QA_DIRECTOR', 'ADMIN')
  create(@Body() dto: CreateRecallDto, @CurrentUser('employee_id') userId: string) {
    return this.recallService.create(dto, userId);
  }

  @Put(':id/submit')
  @Roles('QA', 'QA_DIRECTOR', 'ADMIN')
  submit(@Param('id') id: string, @CurrentUser('employee_id') userId: string) {
    return this.recallService.submit(id, userId);
  }

  @Put(':id/approve')
  @Roles('QA', 'QA_DIRECTOR', 'GM', 'EXECUTIVE_DIRECTOR', 'ADMIN')
  approve(
    @Param('id') id: string,
    @CurrentUser('employee_id') userId: string,
    @CurrentUser('role_code') userRole: string,
  ) {
    return this.recallService.approve(id, userId, userRole);
  }

  @Put(':id/replace-batch')
  @Roles('QA_DIRECTOR', 'ADMIN')
  replaceBatch(
    @Param('id') id: string,
    @Body() dto: ReplaceBatchDto,
    @CurrentUser('employee_id') userId: string,
  ) {
    return this.recallService.replaceBatch(id, dto, userId);
  }

  @Put(':id/start')
  @Roles('QA_DIRECTOR', 'ADMIN')
  start(@Param('id') id: string, @CurrentUser('employee_id') userId: string) {
    return this.recallService.start(id, userId);
  }

  @Put(':id/resolve')
  @Roles('QA_DIRECTOR', 'ADMIN')
  resolve(@Param('id') id: string, @CurrentUser('employee_id') userId: string) {
    return this.recallService.resolve(id, userId);
  }

  @Put(':id/reject')
  @Roles('QA_DIRECTOR', 'GM', 'ADMIN')
  reject(@Param('id') id: string, @CurrentUser('employee_id') userId: string) {
    return this.recallService.reject(id, userId);
  }

  @Put(':id/close')
  @Roles('QA_DIRECTOR', 'ADMIN')
  close(
    @Param('id') id: string,
    @CurrentUser('employee_id') userId: string,
    @CurrentUser('role_code') userRole: string,
  ) {
    return this.recallService.close(id, userId, userRole);
  }

  @Put(':id/reopen')
  @Roles('QA_DIRECTOR', 'ADMIN')
  reopen(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('employee_id') userId: string,
  ) {
    return this.recallService.reopen(id, userId, reason);
  }
}
