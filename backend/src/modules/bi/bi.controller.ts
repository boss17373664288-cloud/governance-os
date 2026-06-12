import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BiService } from './bi.service';

@Controller('bi')
@UseGuards(AuthGuard('jwt'))
export class BiController {
  constructor(private readonly biService: BiService) {}

  @Get('dashboard/ceo')
  getCeoDashboard() {
    return this.biService.getCeoDashboard();
  }

  @Get('analytics/orders')
  getOrderAnalytics(@Query('start') start?: string, @Query('end') end?: string, @Query('groupBy') groupBy?: string) {
    return this.biService.getOrderAnalytics({ start, end, groupBy });
  }
}
