import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('sales_order')
export class SalesOrder {
  @PrimaryColumn({ type: 'uuid',  })
  order_id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  order_no: string;

  @Column({ type: 'varchar' })
  customer_id: string;

  @Column({ type: 'date' })
  order_date: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  total_cost: number;

  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
  status: string;

  @Column({ type: 'int', default: 0 })
  reject_count: number;

  @Column({ type: 'varchar', nullable: true })
  approval_instance_id: string;

  @Column({ type: 'boolean', default: false })
  is_historical: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  original_order_no: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  internal_order_no: string;

  @Column({ type: 'varchar', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}

@Entity('sales_order_item')
export class SalesOrderItem {
  @PrimaryColumn({ type: 'uuid',  })
  item_id: string;

  @Column({ type: 'varchar' })
  order_id: string;

  @Column({ type: 'varchar' })
  product_id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  immediate_ship_quantity: number;

  @Column({ type: 'int', default: 0 })
  consignment_quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unit_price: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  allocated_batch_no: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder;
}
