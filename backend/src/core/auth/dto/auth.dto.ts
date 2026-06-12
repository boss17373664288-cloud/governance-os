import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class LoginDto {
  @IsString() @IsNotEmpty() employee_no: string;
  @IsString() @IsNotEmpty() password: string;
  @IsOptional() @IsString() device_id?: string;
  @IsOptional() @IsString() device_name?: string;
  @IsOptional() @IsString() device_type?: string;
  @IsOptional() @IsString() platform?: string;
}

export class RefreshDto {
  @IsString() @IsNotEmpty() employee_id: string;
  @IsString() @IsNotEmpty() refresh_token: string;
}

export class ChangePasswordDto {
  @IsString() @IsNotEmpty() old_password: string;
  @IsString() @MinLength(8) new_password: string;
}
