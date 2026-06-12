import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintTemplate, PaperFormat, PrintJob } from './print.entity';
import { PrintService } from './print.service';
import { PrintController } from './print.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PrintTemplate, PaperFormat, PrintJob])],
  controllers: [PrintController],
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}
