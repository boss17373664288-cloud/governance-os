import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity("employee_master")
export class Employee {
  @PrimaryColumn({ type: "uuid" })
  employee_id: string;

  @Column({ type: "varchar", length: 20, unique: true })
  employee_no: string;

  @Column({ type: "varchar", length: 100 })
  full_name: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  display_name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  department: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  position: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  job_title: string;

  @Column({ type: "varchar", length: 100, unique: true })
  email: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  mobile: string;

  @Column({ type: "date", nullable: true })
  birth_date: string;

  @Column({ type: "varchar", length: 255 })
  password_hash: string;

  @Column({ type: "varchar", length: 50 })
  role_code: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  region_code: string;

  @Column({ type: "varchar", length: 20, default: "ACTIVE" })
  status: string;

  @Column({ type: "varchar", length: 20, default: "NORMAL" })
  sos_status: string;

  @Column({ type: "boolean", default: false })
  mfa_enabled: boolean;

  @Column({ type: "varchar", length: 100, nullable: true })
  mfa_secret: string;

  @Column({ type: "int", default: 1 })
  permission_version: number;

  @Column({ type: "timestamptz", nullable: true })
  last_login_at: Date;

  @Column({ type: "inet", nullable: true })
  last_login_ip: string;

  @Column({ type: "varchar" })
  tenant_id: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @Column({ type: "uuid", nullable: true })
  created_by: string;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @Column({ type: "uuid", nullable: true })
  updated_by: string;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deleted_at: Date;
}
