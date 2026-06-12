import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductBrandSeries } from './brand-series.entity';

@Entity('product_master')
export class Product {
  @PrimaryColumn({ type: 'uuid',  })
  product_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  product_code: string;

  @Column({ type: 'varchar', length: 200 })
  product_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  product_short_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  product_barcode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  product_uid_code: string;

  @Column({ type: 'varchar', length: 30 })
  product_category: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  product_series: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  product_specification: string;

  @Column({ type: 'boolean', default: false })
  medical_device_flag: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  medical_device_class: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  medical_registration_no: string;

  @Column({ type: 'date', nullable: true })
  registration_expiry_date: Date;

  @Column({ type: 'varchar', length: 5, default: 'R1' })
  recall_level: string;

  @Column({ type: 'boolean', default: true })
  qa_review_required: boolean;

  @Column({ type: 'int', nullable: true })
  expiration_days: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  base_price: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  minimum_price: number;

  @Column({ type: 'varchar', nullable: true })
  brand_series_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  import_source: string;

  @Column({ type: 'varchar' })
  tenant_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'varchar', nullable: true })
  created_by: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'varchar', nullable: true })
  updated_by: string;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;

  @ManyToOne(() => ProductBrandSeries)
  @JoinColumn({ name: 'brand_series_id' })
  brand_series: ProductBrandSeries;
}
