import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity("department")
export class Department {
  @PrimaryColumn({ type: "uuid" })
  department_id: string;

  @Column({ type: "varchar", length: 20, unique: true })
  department_code: string;

  @Column({ type: "varchar", length: 100 })
  department_name: string;

  @Column({ type: "varchar", length: 20 })
  department_type: string;

  @Column({ type: "uuid", nullable: true })
  parent_department_id: string;

  @Column({ type: "uuid" })
  company_id: string;

  @Column({ type: "int", default: 0 })
  sort_order: number;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deleted_at: Date;
}
