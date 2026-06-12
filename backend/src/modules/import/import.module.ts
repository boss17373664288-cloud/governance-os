import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';

@Module({
  imports: [TypeOrmModule.forFeature([]), BullModule.registerQueue({ name: 'import' })],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
