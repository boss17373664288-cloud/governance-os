import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("role_permission")
export class RolePermission {
  @PrimaryColumn({ type: "uuid" })
  role_id: string;

  @PrimaryColumn({ type: "uuid" })
  permission_id: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  granted_at: Date;
}