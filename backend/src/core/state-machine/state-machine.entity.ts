import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('state_machine_definition')
export class StateMachineDefinition {
  @PrimaryColumn({ type: 'uuid',  })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  entity_type: string;

  @Column({ type: 'varchar', length: 64 })
  from_state: string;

  @Column({ type: 'varchar', length: 64 })
  to_state: string;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  guard_conditions: object;

  @Column({ type: 'jsonb', nullable: true })
  side_effects: object;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}

@Entity('state_machine_log')
export class StateMachineLog {
  @PrimaryColumn({ type: 'uuid',  })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  entity_type: string;

  @Column({ type: 'varchar' })
  entity_id: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  from_state: string;

  @Column({ type: 'varchar', length: 64 })
  to_state: string;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ type: 'varchar' })
  user_id: string;

  @Column({ type: 'jsonb', nullable: true })
  context: object;

  @CreateDateColumn({ type: 'timestamptz' })
  occurred_at: Date;
}
