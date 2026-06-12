import { IsString, IsNotEmpty, IsArray, IsOptional, IsUUID } from "class-validator";

export class SendNotificationDto {
  @IsArray() @IsUUID("all", { each: true }) @IsOptional() recipient_ids?: string[];
  @IsString() @IsOptional() notification_type?: string;
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() body: string;
  @IsString() @IsOptional() link_url?: string;
  @IsString() @IsOptional() entity_type?: string;
  @IsString() @IsOptional() entity_id?: string;
}