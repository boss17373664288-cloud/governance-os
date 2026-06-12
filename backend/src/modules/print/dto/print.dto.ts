import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsString() @IsNotEmpty() entity_type: string;
  @IsString() @IsNotEmpty() template_code: string;
  @IsString() @IsNotEmpty() template_name: string;
  @IsOptional() @IsUUID() paper_format_id?: string;
  @IsString() @IsNotEmpty() html_content: string;
  @IsOptional() @IsBoolean() is_multi_part?: boolean;
  @IsOptional() @IsNumber() part_total?: number;
  @IsOptional() @IsNumber() part_index?: number;
}

export class RenderPdfDto {
  @IsString() @IsNotEmpty() entity_type: string;
  @IsUUID() @IsNotEmpty() entity_id: string;
  @IsOptional() @IsString() template_code?: string;
  @IsObject() data: Record<string, any>;
}
