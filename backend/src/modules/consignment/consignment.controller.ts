import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConsignmentService } from './consignment.service';
import { ReleaseDto, ExchangeDto } from './dto/consignment.dto';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';

@Controller('consignment')
@UseGuards(AuthGuard('jwt'))
export class ConsignmentController {
  constructor(private readonly consignmentService: ConsignmentService) {}

  @Get('ledger') getLedger(@Query('customer_id') customerId?: string) { return this.consignmentService.getLedger(customerId); }
  @Post('release') release(@Body() dto: ReleaseDto, @CurrentUser('employee_id') userId: string) { return this.consignmentService.release(dto, userId); }
  @Post('exchange') exchange(@Body() dto: ExchangeDto, @CurrentUser('employee_id') userId: string) { return this.consignmentService.exchange(dto, userId); }
  @Get('stale-alert') getStaleAlert() { return this.consignmentService.getStaleAlert(); }
}
