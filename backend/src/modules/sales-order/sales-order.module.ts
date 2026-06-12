import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder, SalesOrderItem } from '../../entities/sales-order.entity';
import { Customer } from '../../entities/customer.entity';
import { Product } from '../../entities/product.entity';
import { SalesOrderService } from './sales-order.service';
import { SalesOrderController } from './sales-order.controller';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrder, SalesOrderItem, Customer, Product]), AccountingModule],
  controllers: [SalesOrderController],
  providers: [SalesOrderService],
  exports: [SalesOrderService],
})
export class SalesOrderModule {}
