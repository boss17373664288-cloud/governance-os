import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("warehouse_master")
export class WarehouseMaster {
  @PrimaryColumn({ type: "uuid" })
  warehouse_id: string;

  @Column({ type: "varchar", length: 30, unique: true })
  warehouse_code: string;

  @Column({ type: "varchar", length: 100 })
  warehouse_name: string;

  @Column({ type: "varchar", length: 30, default: "BRANCH" })
  warehouse_type: string;

  @Column({ type: "varchar", length: 300, nullable: true })
  address: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "varchar", nullable: true })
  tenant_id: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}