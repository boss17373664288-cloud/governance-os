import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OcrService } from './ocr.service';
import { OcrRequestDto } from './dto/ocr.dto';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../core/auth/decorators/roles.decorator';

@Controller('ocr')
@UseGuards(AuthGuard('jwt'))
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('recognize')
  recognize(@Body() dto: OcrRequestDto, @CurrentUser('employee_id') userId: string) {
    return this.ocrService.recognize(dto, userId);
  }

  @Get('field-mappings')
  @Roles('ADMIN')
  getFieldMappings() { return this.ocrService.getFieldMappings(); }
}
