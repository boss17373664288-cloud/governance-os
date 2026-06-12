import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('recall_case')
export class RecallCase {
  @PrimaryColumn({ type: 'uuid',  })
  recall_id: string;
  @Column({ type: 'varchar', length: 30, unique: true })
  recall_no: string;
  @Column({ type: 'varchar', length: 5 })
  recall_level: string;
  @Column({ type: 'varchar' })
  product_id: string;
  @Column({ type: 'varchar', length: 50 })
  batch_no: string;
  @Column({ type: 'text', nullable: true })
  description: string;
  @Column({ type: 'date', nullable: true })
  discovery_date: Date;
  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
  status: string;
  @Column({ type: 'varchar', nullable: true })
  approval_instance_id: string;
  @Column({ type: 'varchar', nullable: true })
  created_by: string;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
  @Column({ type: 'timestamptz', nullable: true })
  closed_at: Date;
}

@Entity('batch_master')
export class BatchMaster {
  @PrimaryColumn({ type: 'uuid',  })
  batch_id: string;
  @Column({ type: 'varchar', length: 50 })
  batch_no: string;
  @Column({ type: 'varchar' })
  product_id: string;
  @Column({ type: 'date', nullable: true })
  production_date: Date;
  @Column({ type: 'date' })
  expiry_date: Date;
  @Column({ type: 'varchar', length: 200, nullable: true })
  manufacturer: string;
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  qa_status: string;
  @Column({ type: 'varchar', length: 20, default: 'NORMAL' })
  recall_status: string;
  @Column({ type: 'int' })
  total_quantity: number;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

@Entity('inventory_ledger')
export class InventoryLedger {
  @PrimaryColumn({ type: 'uuid',  })
  ledger_id: string;
  @Column({ type: 'varchar' })
  product_id: string;
  @Column({ type: 'varchar', nullable: true })
  batch_id: string;
  @Column({ type: 'varchar' })
  warehouse_id: string;
  @Column({ type: 'varchar', length: 30 })
  event_type: string;
  @Column({ type: 'int' })
  quantity_delta: number;
  @Column({ type: 'int' })
  balance_after: number;
  @Column({ type: 'varchar', length: 50, nullable: true })
  source_type: string;
  @Column({ type: 'varchar', nullable: true })
  source_id: string;
  @Column({ type: 'varchar', nullable: true })
  trace_id: string;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

@Entity('reservation')
export class Reservation {
  @PrimaryColumn({ type: 'uuid',  })
  reservation_id: string;
  @Column({ type: 'varchar' })
  batch_id: string;
  @Column({ type: 'varchar' })
  order_id: string;
  @Column({ type: 'varchar' })
  order_item_id: string;
  @Column({ type: 'int' })
  quantity: number;
  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;
  @Column({ type: 'timestamptz' })
  expiry_time: Date;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
