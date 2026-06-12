import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { BatchMaster, InventoryLedger, RecallCase, Reservation } from "../../entities/recall-inventory.entity";
import { WarehouseMaster } from "../../entities/warehouse.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BatchMaster, InventoryLedger, RecallCase, Reservation, WarehouseMaster])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}