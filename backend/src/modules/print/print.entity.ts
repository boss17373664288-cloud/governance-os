import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('print_template')
export class PrintTemplate {
  @PrimaryColumn({ type: 'uuid',  })
  template_id: string;

  @Column({ type: 'varchar', length: 50 })
  entity_type: string;

  @Column({ type: 'varchar', length: 50 })
  template_code: string;

  @Column({ type: 'varchar', length: 100 })
  template_name: string;

  @Column({ type: 'varchar', nullable: true })
  paper_format_id: string;

  @Column({ type: 'text' })
  html_content: string;

  @Column({ type: 'boolean', default: false })
  is_multi_part: boolean;

  @Column({ type: 'int', default: 1 })
  part_total: number;

  @Column({ type: 'int', default: 1 })
  part_index: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true })
  created_by: string;

  @Column({ type: 'varchar', nullable: true })
  updated_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

@Entity('paper_format')
export class PaperFormat {
  @PrimaryColumn({ type: 'uuid',  })
  paper_format_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  format_code: string;

  @Column({ type: 'varchar', length: 100 })
  format_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  width_mm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  height_mm: number;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

@Entity('print_job')
export class PrintJob {
  @PrimaryColumn({ type: 'uuid',  })
  job_id: string;

  @Column({ type: 'varchar' })
  template_id: string;

  @Column({ type: 'varchar', length: 50 })
  entity_type: string;

  @Column({ type: 'varchar' })
  entity_id: string;

  @Column({ type: 'text', nullable: true })
  output_url: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'varchar', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;
}
