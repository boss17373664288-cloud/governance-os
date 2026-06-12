import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("role")
export class Role {
  @PrimaryColumn({ type: "uuid" })
  role_id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  role_code: string;

  @Column({ type: "varchar", length: 100 })
  role_name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "boolean", default: false })
  is_system: boolean;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
