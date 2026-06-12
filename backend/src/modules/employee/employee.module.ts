import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Employee } from "../../entities/employee.entity";
import { EmployeePosition } from "../../entities/employee-position.entity";
import { UserRole } from "../../entities/user-role.entity";
import { EmployeeService } from "./employee.service";
import { EmployeeController } from "./employee.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Employee, EmployeePosition, UserRole])],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
