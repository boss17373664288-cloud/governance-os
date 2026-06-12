import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("user_role")
export class UserRole {
  @PrimaryColumn({ type: "uuid" })
  user_id: string;

  @PrimaryColumn({ type: "varchar", length: 50 })
  role_code: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  scope_type: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  scope_value: string;

  @Column({ type: "uuid", nullable: true })
  granted_by: string;

  @CreateDateColumn({ type: "timestamptz" })
  granted_at: Date;
}
