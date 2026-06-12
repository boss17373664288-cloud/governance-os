import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class OcrRequestDto {
  @IsString() @IsNotEmpty() image_url: string;
  @IsString() @IsNotEmpty() @IsIn(['BUSINESS_CARD','ORDER','PURCHASE_ORDER','REMITTANCE','RECEIPT','GENERAL'])
  record_type: string;
}
