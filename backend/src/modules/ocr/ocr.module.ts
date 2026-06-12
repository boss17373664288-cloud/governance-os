import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [OcrController],
  providers: [OcrService],
  exports: [OcrService],
})
export class OcrModule {}
