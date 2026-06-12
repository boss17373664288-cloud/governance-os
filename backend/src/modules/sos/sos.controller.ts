import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SosService } from './sos.service';
import { SosTriggerDto, SosResolveDto } from './dto/sos.dto';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../core/auth/decorators/roles.decorator';

@Controller('sos')
@UseGuards(AuthGuard('jwt'))
export class SosController {
  constructor(private readonly sosService: SosService) {}

  @Post('trigger')
  trigger(@Body() dto: SosTriggerDto, @CurrentUser('employee_id') userId: string) {
    return this.sosService.trigger(userId, dto);
  }

  @Get('events')
  @Roles('ADMIN','GM','EXECUTIVE_DIRECTOR')
  getEvents() { return this.sosService.getActiveEvents(); }

  @Put('events/:id/resolve')
  @Roles('ADMIN')
  resolve(@Param('id') id: string, @CurrentUser('employee_id') userId: string, @Body() dto: SosResolveDto) {
    return this.sosService.resolve(id, userId, dto.resolution_note);
  }

  @Get('status')
  checkStatus(@CurrentUser('employee_id') userId: string) {
    return this.sosService.checkSosStatus(userId);
  }
}
