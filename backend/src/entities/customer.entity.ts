import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Company } from './company.entity';

@Entity('customer_master')
export class Customer {
  @PrimaryColumn({ type: 'uuid',  })
  customer_id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  customer_code: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  old_erp_customer_code: string;

  @Column({ type: 'varchar', length: 200 })
  customer_name: string;

  @Column({ type: 'varchar', length: 100 })
  customer_short_name: string;

  @Column({ type: 'varchar', length: 50 })
  customer_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  customer_source: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  industry_type: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unified_business_no: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  medical_institution_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_person: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_position: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contact_phone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile_phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contact_email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 10 })
  company_zip_code: string;

  @Column({ type: 'text' })
  company_address: string;
  @Column({ type: 'text', nullable: true })
  shipping_address: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shipping_recipient: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  shipping_recipient_phone: string;

  @Column({ type: 'text', nullable: true })
  billing_address: string;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  shipping_zip: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  billing_zip: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bank_account: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_account_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  billing_recipient: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  billing_recipient_phone: string;

  @Column({ type: 'text', nullable: true })
  invoice_remark: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  invoice_tax_id: string;


  @Column({ type: 'time', nullable: true })
  business_hours_start: string;

  @Column({ type: 'time', nullable: true })
  business_hours_end: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  payment_terms: string;

  @Column({ type: 'int', nullable: true })
  closing_day: number;

  @Column({ type: 'int', nullable: true })
  invoice_date: number;

  @Column({ type: 'int', nullable: true })
  credit_days: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  credit_limit: number;

  @Column({ type: 'varchar', length: 20, default: 'NORMAL' })
  credit_status: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  outstanding_ar: number;

  @Column({ type: 'int', default: 0 })
  consignment_balance: number;

  @Column({ type: 'boolean', default: false })
  contract_signed: boolean;

  @Column({ type: 'boolean', default: true })
  allow_transaction: boolean;

  @Column({ type: 'date', nullable: true })
  pause_start_date: Date;

  @Column({ type: 'varchar', nullable: true })
  owning_employee_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  region_code: string;

  @Column({ type: 'varchar', length: 20, default: 'LEAD' })
  customer_status: string;

  @Column({ type: 'int', default: 0 })
  total_sample_count: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  import_source: string;

  @Column({ type: 'varchar' })
  company_id: string;

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

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'owning_employee_id' })
  owning_employee: Employee;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
