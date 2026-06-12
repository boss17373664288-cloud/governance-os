import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsignmentService } from "./consignment.service";
import { ConsignmentController } from "./consignment.controller";

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [ConsignmentController],
  providers: [ConsignmentService],
  exports: [ConsignmentService],
})
export class ConsignmentModule {}