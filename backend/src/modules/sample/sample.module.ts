import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SampleService } from "./sample.service";
import { SampleController } from "./sample.controller";
import { SampleRequest } from "../../entities/sample-request.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SampleRequest])],
  controllers: [SampleController],
  providers: [SampleService],
  exports: [SampleService],
})
export class SampleModule {}