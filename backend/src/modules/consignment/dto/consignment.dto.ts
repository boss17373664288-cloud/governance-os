import { IsString, IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';

export class ReleaseDto {
  @IsUUID() @IsNotEmpty() customer_id: string;
  @IsUUID() @IsNotEmpty() product_id: string;
  @IsNumber() @Min(1) quantity: number;
}

export class ExchangeDto {
  @IsUUID() @IsNotEmpty() customer_id: string;
  @IsUUID() @IsNotEmpty() source_product_id: string;
  @IsUUID() @IsNotEmpty() target_product_id: string;
  @IsNumber() @Min(1) quantity: number;
  @IsString() @IsNotEmpty() reason: string;
}
