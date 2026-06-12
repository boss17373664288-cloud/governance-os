import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecallCase, BatchMaster, InventoryLedger } from '../../entities/recall-inventory.entity';
import { SalesOrder, SalesOrderItem } from '../../entities/sales-order.entity';
import { Product } from '../../entities/product.entity';
import { RecallService } from './recall.service';
import { RecallController } from './recall.controller';
import { StateMachineModule } from '../../core/state-machine/state-machine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecallCase, BatchMaster, InventoryLedger, SalesOrder, SalesOrderItem, Product]),
    StateMachineModule,
  ],
  controllers: [RecallController],
  providers: [RecallService],
  exports: [RecallService],
})
export class RecallModule {}
