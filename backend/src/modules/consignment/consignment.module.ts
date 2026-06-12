import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsignmentService } from "./consignment.service";
import { ConsignmentController } from "./consignment.controller";
import { ConsignmentRelease } from "../../entities/consignment-release.entity";
import { ConsignmentExchange } from "../../entities/consignment-exchange.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ConsignmentRelease, ConsignmentExchange])],
  controllers: [ConsignmentController],
  providers: [ConsignmentService],
  exports: [ConsignmentService],
})
export class ConsignmentModule {}
