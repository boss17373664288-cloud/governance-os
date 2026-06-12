import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../../entities/sales-order.entity';
import { RecallCase } from '../../entities/recall-inventory.entity';
import { BiService } from './bi.service';
import { BiController } from './bi.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrder, RecallCase])],
  controllers: [BiController],
  providers: [BiService],
  exports: [BiService],
})
export class BiModule {}
