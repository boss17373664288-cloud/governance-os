import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("consignment_release")
export class ConsignmentRelease {
  @PrimaryColumn({ type: "uuid" })
  release_id: string;

  @Column({ type: "varchar", length: 40, unique: true })
  release_no: string;

  @Column({ type: "varchar" })
  customer_id: string;

  @Column({ type: "varchar" })
  product_id: string;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "varchar", length: 30, default: "PENDING_QA" })
  status: string;

  @Column({ type: "varchar", nullable: true })
  qa_approved_by: string;

  @Column({ type: "timestamptz", nullable: true })
  qa_approved_at: Date;

  @Column({ type: "varchar", nullable: true })
  shipped_by: string;

  @Column({ type: "timestamptz", nullable: true })
  shipped_at: Date;

  @Column({ type: "varchar" })
  created_by: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
