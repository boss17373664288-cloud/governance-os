import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("account_applications")
export class AccountApplication {
  @PrimaryGeneratedColumn("uuid")
  application_id: string;

  @Column({ type: "varchar", length: 100 })
  applicant_name: string;

  @Column({ type: "varchar", length: 200 })
  applicant_email: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  applicant_phone: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  company_name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  department: string;

  @Column({ type: "text", nullable: true })
  reason: string;

  @Column({ type: "varchar", length: 20, default: "PENDING" })
  status: string;

  @Column({ type: "uuid", nullable: true })
  reviewer_id: string;

  @Column({ type: "text", nullable: true })
  review_comment: string;

  @Column({ type: "uuid", nullable: true })
  created_employee_id: string;

  @Column({ type: "varchar", length: 50 })
  tenant_id: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
