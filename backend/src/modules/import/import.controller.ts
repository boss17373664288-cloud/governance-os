import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ImportService } from './import.service';
import { CreateImportDto } from './dto/import.dto';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../core/auth/decorators/roles.decorator';

@Controller('import')
@UseGuards(AuthGuard('jwt'))
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get('templates')
  getTemplates() { return this.importService.getDownloadTemplates(); }

  @Get('tasks')
  getTasks(@Query() query: any) { return this.importService.getTasks(query); }

  @Get('tasks/:id')
  getTask(@Param('id') id: string) { return this.importService.getTask(id); }

  @Post('tasks')
  @Roles('ADMIN','DATA_MIGRATOR')
  createTask(@Body() dto: CreateImportDto, @CurrentUser('employee_id') userId: string) {
    return this.importService.createTask(dto, userId);
  }

  @Put('tasks/:id/retry')
  @Roles('ADMIN')
  retry(@Param('id') id: string) { return this.importService.retryTask(id); }

  @Put('tasks/:id/cancel')
  @Roles('ADMIN')
  cancel(@Param('id') id: string) { return this.importService.cancelTask(id); }
}
