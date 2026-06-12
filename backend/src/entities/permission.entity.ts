import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("permission")
export class Permission {
  @PrimaryColumn({ type: "uuid" })
  permission_id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  permission_code: string;

  @Column({ type: "varchar", length: 100 })
  permission_name: string;

  @Column({ type: "varchar", length: 50 })
  resource_code: string;

  @Column({ type: "varchar", length: 50 })
  resource_type: string;

  @Column({ type: "varchar", length: 20 })
  action: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
