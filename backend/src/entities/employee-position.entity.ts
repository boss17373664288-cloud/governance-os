import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("employee_position")
export class EmployeePosition {
  @PrimaryColumn({ type: "uuid" })
  employee_id: string;

  @PrimaryColumn({ type: "varchar", length: 50 })
  position_code: string;

  @Column({ type: "boolean", default: false })
  is_primary: boolean;

  @Column({ type: "date", nullable: true })
  start_date: string;

  @Column({ type: "date", nullable: true })
  end_date: string;

  @Column({ type: "uuid", nullable: true })
  created_by: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
