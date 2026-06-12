import { IsString, IsNotEmpty, IsUUID, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateVisitDto {
  @IsUUID() @IsNotEmpty() customer_id: string;
  @IsString() @IsNotEmpty() visit_date: string;
  @IsString() @IsNotEmpty() visit_type: string;
  @IsString() @IsNotEmpty() visit_purpose: string;
  @IsOptional() @IsString() result_code?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() next_action?: string;
  @IsOptional() @IsString() next_followup_date?: string;
}

export class ScheduleVisitDto {
  @IsUUID() @IsNotEmpty() customer_id: string;
  @IsString() @IsNotEmpty() scheduled_time: string;
  @IsString() @IsNotEmpty() visit_type: string;
}

export class CheckinDto {
  @IsUUID() @IsNotEmpty() visit_id: string;
  @IsNumber() gps_latitude: number;
  @IsNumber() gps_longitude: number;
}
