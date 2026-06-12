import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("sample_request")
export class SampleRequest {
  @PrimaryColumn({ type: "uuid" })
  sample_id: string;

  @Column({ type: "varchar", length: 30, unique: true })
  sample_no: string;

  @Column({ type: "uuid" })
  customer_id: string;

  @Column({ type: "uuid" })
  product_id: string;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "varchar", length: 50 })
  purpose: string;

  @Column({ type: "varchar", length: 30, default: "DRAFT" })
  status: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  feedback_result?: string;

  @Column({ type: "date", nullable: true })
  feedback_date?: Date;

  @Column({ type: "text", nullable: true })
  feedback_notes?: string;

  @Column({ type: "boolean", default: false })
  convert_to_order: boolean;

  @Column({ type: "boolean", default: false })
  convert_to_sample: boolean;

  @Column({ type: "varchar", length: 20, nullable: true })
  previous_customer_status?: string;

  @Column({ type: "uuid", nullable: true })
  created_by?: string;

  @Column({ type: "uuid", nullable: true })
  approved_by?: string;

  @Column({ type: "uuid", nullable: true })
  qa_released_by?: string;

  @Column({ type: "uuid", nullable: true })
  shipped_by?: string;

  @Column({ type: "timestamptz", nullable: true })
  submitted_at?: Date;

  @Column({ type: "timestamptz", nullable: true })
  approved_at?: Date;

  @Column({ type: "timestamptz", nullable: true })
  qa_released_at?: Date;

  @Column({ type: "timestamptz", nullable: true })
  shipped_at?: Date;

  @Column({ type: "varchar", length: 50, nullable: true })
  batch_no?: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}