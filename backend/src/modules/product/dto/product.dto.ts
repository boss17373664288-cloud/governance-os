import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateProductDto {
  @IsString() @IsNotEmpty() product_code: string;
  @IsString() @IsNotEmpty() product_name: string;
  @IsOptional() @IsString() product_short_name?: string;
  @IsOptional() @IsString() product_barcode?: string;
  @IsOptional() @IsString() product_uid_code?: string;
  @IsString() @IsNotEmpty() product_category: string;
  @IsOptional() @IsString() product_series?: string;
  @IsOptional() @IsString() product_specification?: string;
  @IsOptional() @IsBoolean() medical_device_flag?: boolean;
  @IsOptional() @IsString() medical_device_class?: string;
  @IsOptional() @IsString() medical_registration_no?: string;
  @IsOptional() @IsNumber() expiration_days?: number;
  @IsOptional() @IsNumber() base_price?: number;
  @IsOptional() @IsNumber() minimum_price?: number;
  @IsOptional() @IsString() brand_series_id?: string;
  @IsOptional() @IsString() recall_level?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() product_name?: string;
  @IsOptional() @IsString() product_short_name?: string;
  @IsOptional() @IsString() product_barcode?: string;
  @IsOptional() @IsString() product_uid_code?: string;
  @IsOptional() @IsString() product_category?: string;
  @IsOptional() @IsString() product_series?: string;
  @IsOptional() @IsString() product_specification?: string;
  @IsOptional() @IsBoolean() medical_device_flag?: boolean;
  @IsOptional() @IsString() medical_device_class?: string;
  @IsOptional() @IsString() medical_registration_no?: string;
  @IsOptional() @IsNumber() expiration_days?: number;
  @IsOptional() @IsNumber() base_price?: number;
  @IsOptional() @IsNumber() minimum_price?: number;
  @IsOptional() @IsString() brand_series_id?: string;
  @IsOptional() @IsString() recall_level?: string;
}