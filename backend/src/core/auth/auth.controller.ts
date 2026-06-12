import { Controller, Post, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, ChangePasswordDto } from './dto/auth.dto';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('employee_id') employeeId: string) {
    return this.authService.logout(employeeId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Get('permissions')
  @UseGuards(AuthGuard('jwt'))
  async getPermissions(@CurrentUser('employee_id') employeeId: string) {
    return this.authService.getPermissions(employeeId);
  }

  @Put('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @CurrentUser('employee_id') employeeId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(employeeId, dto);
  }
  @Post('apply-account')
  @HttpCode(HttpStatus.OK)
  async applyAccount(@Body() dto: any) {
    return this.authService.applyAccount(dto);
  }
}