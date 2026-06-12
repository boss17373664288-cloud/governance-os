import { IsString, IsNotEmpty, IsUUID, IsArray, ValidateNested, IsNumber, Min, IsOptional, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @IsUUID() @IsNotEmpty() product_id: string;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() @Min(0) consignment_quantity: number;
  @IsNumber() @Min(0) unit_price: number;
}

export class CreateSalesOrderDto {
  @IsUUID() @IsNotEmpty() customer_id: string;

  @IsOptional()
  @IsIn(["ONE_TIME", "PARTIAL_CONSIGNMENT", "SAMPLE"])
  order_type?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class ApproveOrderDto {
  @IsOptional() @IsString() notes?: string;
}

export class RejectOrderDto {
  @IsString() @IsNotEmpty() reason: string;
}