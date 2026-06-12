import { IsString, IsNotEmpty, IsUUID, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateArDto {
  @IsUUID() @IsNotEmpty() order_id: string;
  @IsUUID() @IsNotEmpty() customer_id: string;
  @IsNumber() @Min(0) amount: number;
  @IsString() @IsOptional() payment_terms?: string;
}

export class PaymentDto {
  @IsUUID() @IsNotEmpty() ar_id: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsString() @IsOptional() reference_no?: string;
}

export class FreezeCustomerDto {
  @IsString() @IsNotEmpty() reason: string;
}

export class SuspendArDto {
  @IsUUID() @IsNotEmpty() ar_id: string;
  @IsNumber() @Min(1) days: number;
  @IsString() @IsNotEmpty() reason: string;
}
