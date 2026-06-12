import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('product_brand_series')
export class ProductBrandSeries {
  @PrimaryColumn({ type: 'uuid',  })
  series_id: string;

  @Column({ type: 'varchar', length: 100 })
  brand_name: string;

  @Column({ type: 'varchar', length: 100 })
  series_name: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
