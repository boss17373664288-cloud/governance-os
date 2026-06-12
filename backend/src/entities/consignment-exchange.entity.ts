import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("consignment_exchange")
export class ConsignmentExchange {
  @PrimaryColumn({ type: "uuid" })
  exchange_id: string;

  @Column({ type: "varchar", length: 40, unique: true })
  exchange_no: string;

  @Column({ type: "varchar" })
  customer_id: string;

  @Column({ type: "varchar" })
  source_product_id: string;

  @Column({ type: "varchar" })
  target_product_id: string;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "varchar", nullable: true })
  reason: string;

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
