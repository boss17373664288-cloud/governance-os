import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("visit")
export class Visit {
  @PrimaryColumn({ type: "uuid" })
  visit_id: string;

  @Column({ type: "uuid" })
  customer_id: string;

  @Column({ type: "uuid" })
  employee_id: string;

  @Column({ type: "varchar", length: 20 })
  status: string;

  @Column({ type: "date" })
  visit_date: string;

  @Column({ type: "varchar", length: 30 })
  visit_type: string;

  @Column({ type: "varchar", length: 30 })
  visit_purpose: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  result_code: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  next_action: string;

  @Column({ type: "date", nullable: true })
  next_followup_date: string;

  @Column({ type: "timestamptz", nullable: true })
  checkin_time: Date;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  checkin_gps_lat: number;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  checkin_gps_lng: number;

  @Column({ type: "timestamptz", nullable: true })
  checkout_time: Date;

  @Column({ type: "int", nullable: true })
  duration_minutes: number;

  @Column({ type: "text", nullable: true })
  supervisor_note: string;

  @Column({ type: "uuid", nullable: true })
  supervisor_id: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}