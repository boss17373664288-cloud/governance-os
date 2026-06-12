import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SosTriggerDto {
  @IsString() @IsNotEmpty() trigger_method: string;
  @IsOptional() @IsNumber() gps_latitude?: number;
  @IsOptional() @IsNumber() gps_longitude?: number;
  @IsOptional() @IsString() device_info?: string;
}

export class SosResolveDto {
  @IsString() @IsNotEmpty() resolution_note: string;
}
