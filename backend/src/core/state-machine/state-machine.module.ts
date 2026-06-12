import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateMachineDefinition, StateMachineLog } from './state-machine.entity';
import { StateMachineService } from './state-machine.service';

@Module({
  imports: [TypeOrmModule.forFeature([StateMachineDefinition, StateMachineLog])],
  providers: [StateMachineService],
  exports: [StateMachineService],
})
export class StateMachineModule implements OnModuleInit {
  constructor(private readonly sm: StateMachineService) {}

  async onModuleInit() {
    await this.sm.seedDefaults();
  }
}
