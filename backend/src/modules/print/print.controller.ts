import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrintService } from './print.service';
import { CreateTemplateDto, RenderPdfDto } from './dto/print.dto';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../core/auth/decorators/roles.decorator';

@Controller('print')
@UseGuards(AuthGuard('jwt'))
export class PrintController {
  constructor(private readonly printService: PrintService) {}

  @Get('templates')
  getTemplates(@Query('entityType') entityType?: string) {
    return this.printService.getTemplates(entityType);
  }

  @Get('variables/:entityType')
  getVariables(@Param('entityType') entityType: string) {
    return this.printService.getVariables(entityType);
  }

  @Post('templates')
  @Roles('ADMIN')
  createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser('employee_id') userId: string) {
    return this.printService.createTemplate(dto, userId);
  }

  @Post('render')
  renderPdf(@Body() dto: RenderPdfDto, @CurrentUser('employee_id') userId: string) {
    return this.printService.renderPdf(dto, userId);
  }
  @Post('generate')
  generatePdf(@Body() body: { entity_type: string; entity_id: string }, @CurrentUser('employee_id') userId: string) {
    return this.printService.generatePdfForEntity(body.entity_type, body.entity_id, userId);
  }
}
