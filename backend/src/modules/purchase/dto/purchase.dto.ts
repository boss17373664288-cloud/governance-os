import { IsString, IsNotEmpty, IsUUID, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min } from "class-validator";
import { Type } from "class-transformer";

export class PoItemDto {
  @IsUUID() @IsNotEmpty() product_id: string;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() @Min(0) unit_price: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID() @IsNotEmpty() supplier_id: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PoItemDto) items: PoItemDto[];
  @IsOptional() @IsBoolean() is_emergency?: boolean;
}

export class ReceiveItemDto {
  @IsUUID() @IsNotEmpty() product_id: string;
  @IsNumber() @Min(1) quantity: number;
}

export class ReceiveGoodsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => ReceiveItemDto) items: ReceiveItemDto[];
}

export class PurchaseReturnDto {
  @IsUUID() @IsNotEmpty() product_id: string;
  @IsNumber() @Min(1) quantity: number;
  @IsOptional() @IsString() reason?: string;
}