import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateRecallDto {
  @IsString() @IsNotEmpty() recall_level: string;
  @IsUUID() @IsNotEmpty() product_id: string;
  @IsString() @IsNotEmpty() batch_no: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() discovery_date?: string;
}

export class ReplaceBatchDto {
  @IsString() @IsNotEmpty() target_batch_no: string;
  @IsOptional() @IsString() reason?: string;
}
