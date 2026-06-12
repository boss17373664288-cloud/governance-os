import { IsString, IsInt, IsOptional, IsUUID, Min, MaxLength, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class SampleItemDto {
  @IsUUID()
  product_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateSampleDto {
  @IsUUID()
  customer_id: string;

  @IsString()
  @MaxLength(50)
  purpose: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SampleItemDto)
  items: SampleItemDto[];
}

export class SubmitFeedbackDto {
  @IsString()
  feedback_result: string;

  @IsOptional()
  @IsString()
  notes?: string;
}