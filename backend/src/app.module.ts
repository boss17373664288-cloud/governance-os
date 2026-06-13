import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { databaseConfig, redisConfig } from "./config";
import { AuthModule } from "./core/auth/auth.module";
import { PermissionModule } from "./core/permission/permission.module";
import { AuditModule } from "./core/audit/audit.module";
import { StateMachineModule } from "./core/state-machine/state-machine.module";
import { EventBusModule } from "./core/event-bus/event-bus.module";
import { WorkflowModule } from "./core/workflow/workflow.module";
import { HealthModule } from "./core/health/health.module";
import { FieldPolicyInterceptor } from './shared/interceptors/field-policy.interceptor';
import { MigrationService } from "./core/database/migration.service";
import { CustomerModule } from "./modules/customer/customer.module";
import { ProductModule } from "./modules/product/product.module";
import { EmployeeModule } from "./modules/employee/employee.module";
import { SupplierModule } from "./modules/supplier/supplier.module";
import { SalesOrderModule } from "./modules/sales-order/sales-order.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { ConsignmentModule } from "./modules/consignment/consignment.module";
import { RecallModule } from "./modules/recall/recall.module";
import { PurchaseModule } from "./modules/purchase/purchase.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { BudgetModule } from "./modules/budget/budget.module";
import { SampleModule } from "./modules/sample/sample.module";
import { VisitModule } from "./modules/visit/visit.module";
import { PrintModule } from "./modules/print/print.module";
import { ImportModule } from "./modules/import/import.module";
import { OcrModule } from "./modules/ocr/ocr.module";
import { SosModule } from "./modules/sos/sos.module";
import { BiModule } from "./modules/bi/bi.module";
import { SystemModule } from "./modules/system/system.module";
import { CompanyModule } from "./modules/company/company.module";
import { GoodsReceiptModule } from "./modules/goods-receipt/goods-receipt.module";
import { AccountingModule } from "./modules/accounting/accounting.module";
import { ExpenseModule } from "./modules/expense/expense.module";
import { PayrollModule } from "./modules/payroll/payroll.module";
import { CommissionModule } from "./modules/commission/commission.module";
import { ReferralModule } from "./modules/referral/referral.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { DepartmentModule } from "./modules/department/department.module";
import { RoleModule } from "./modules/role/role.module";
import { DelegationModule } from "./modules/delegation/delegation.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    BullModule.forRoot({ redis: redisConfig }),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: "." }),
    AuthModule, PermissionModule, AuditModule, StateMachineModule,
    EventBusModule, WorkflowModule, HealthModule,
    CompanyModule,
    CustomerModule, ProductModule, EmployeeModule, SupplierModule,
    SalesOrderModule, InventoryModule, ConsignmentModule,
    RecallModule, PurchaseModule, FinanceModule, BudgetModule,
    SampleModule, VisitModule, PrintModule, ImportModule,
    OcrModule, SosModule, BiModule, SystemModule, NotificationModule,
    DepartmentModule, RoleModule, DelegationModule, GoodsReceiptModule, AccountingModule,
    ExpenseModule,
    PayrollModule,
    CommissionModule,
    ReferralModule,
  ],
  providers: [MigrationService],
})
export class AppModule {}