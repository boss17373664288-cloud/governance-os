import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('company')
export class Company {
  @PrimaryColumn({ type: 'uuid',  })
  company_id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  company_code: string;

  @Column({ type: 'varchar', length: 200 })
  company_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tax_id: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  short_name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  fax: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  medical_permit_no: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pharma_permit_no: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gmp_cert_no: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bank_account: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_account_name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  invoice_title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
