import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("delegation")
export class Delegation {
  @PrimaryColumn({ type: "uuid" })
  delegation_id: string;

  @Column({ type: "uuid" })
  delegator_id: string;

  @Column({ type: "uuid" })
  delegate_id: string;

  @Column({ type: "varchar", length: 50 })
  role_code: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  scope_type: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  scope_value: string;

  @Column({ type: "timestamptz" })
  start_date: Date;

  @Column({ type: "timestamptz" })
  end_date: Date;

  @Column({ type: "varchar", length: 20, default: "ACTIVE" })
  status: string;

  @Column({ type: "text", nullable: true })
  reason: string;

  @Column({ type: "uuid", nullable: true })
  granted_by: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
