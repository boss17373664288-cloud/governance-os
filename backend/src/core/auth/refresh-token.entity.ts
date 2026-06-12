import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../entities/employee.entity';

@Entity('refresh_token')
export class RefreshToken {
  @PrimaryColumn({ type: 'uuid',  })
  token_id: string;

  @Column({ type: 'varchar' })
  employee_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token_hash: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  device_id: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}

@Entity('device_binding')
export class DeviceBinding {
  @PrimaryColumn({ type: 'uuid',  })
  binding_id: string;

  @Column({ type: 'varchar' })
  employee_id: string;

  @Column({ type: 'varchar', length: 200 })
  device_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  device_type: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  platform: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
