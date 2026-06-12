import { IsString, IsOptional, IsBoolean, MaxLength } from "class-validator";

export class CreateSupplierDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplier_code?: string;

  @IsString()
  @MaxLength(200)
  supplier_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplier_short_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tax_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contact_person?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contact_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contact_email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  payment_terms?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}