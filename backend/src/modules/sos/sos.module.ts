import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SosService } from './sos.service';
import { SosController } from './sos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [SosController],
  providers: [SosService],
  exports: [SosService],
})
export class SosModule {}
