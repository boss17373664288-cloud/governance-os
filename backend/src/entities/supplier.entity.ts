import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity("supplier_master")
export class Supplier {
  @PrimaryColumn({ type: "uuid" })
  supplier_id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  supplier_code: string;

  @Column({ type: "varchar", length: 200 })
  supplier_name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  supplier_short_name: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  tax_id: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  contact_person: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  contact_phone: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  contact_email: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  payment_terms: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "varchar" })
  tenant_id: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deleted_at: Date;
}
