import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateImportDto {
  @IsString() @IsNotEmpty() entity_type: string;
  @IsString() @IsNotEmpty() file_name: string;
  @IsOptional() @IsIn(['INSERT','UPDATE','UPSERT']) import_mode?: string;
  @IsOptional() @IsIn(['SKIP','STOP']) error_strategy?: string;
}
