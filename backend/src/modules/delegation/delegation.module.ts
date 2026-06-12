import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Delegation } from "../../entities/delegation.entity";
import { DelegationService } from "./delegation.service";
import { DelegationController } from "./delegation.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Delegation])],
  controllers: [DelegationController],
  providers: [DelegationService],
  exports: [DelegationService],
})
export class DelegationModule {}
