import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OcrRequestDto } from './dto/ocr.dto';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private ocrEndpoint = process.env.PADDLEOCR_ENDPOINT || 'http://localhost:5000';

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async recognize(dto: OcrRequestDto, userId: string): Promise<any> {
    this.logger.log('OCR request: ' + dto.record_type + ' from ' + userId);

    // In production: call PaddleOCR HTTP API
    // const result = await axios.post(this.ocrEndpoint + '/predict', { image_url: dto.image_url });

    const recordId = 'OCR-' + Date.now();
    const mockResult = this.getMockResult(dto.record_type);

    this.eventEmitter.emit('ocr.completed', { recordId, recordType: dto.record_type, userId });

    return {
      record_id: recordId,
      record_type: dto.record_type,
      raw_text: mockResult.rawText,
      structured_data: mockResult.structured,
    };
  }

  private getMockResult(type: string): any {
    const templates: Record<string, any> = {
      BUSINESS_CARD: {
        rawText: '王大明 主任医师\n台大医院 心脏外科\n电话: 02-23123456\n手机: 0912-345-678',
        structured: {
          contact_name: '王大明',
          position: '主任医师',
          company: '台大医院',
          department: '心脏外科',
          phone: '02-23123456',
          mobile: '0912-345-678',
        },
      },
      ORDER: {
        rawText: '客户: XX诊所\n产品: 玻尿酸注射剂 x10\n单价: 3500\n金额: 35000',
        structured: {
          customer_name: 'XX诊所',
          product_name: '玻尿酸注射剂',
          quantity: 10,
          unit_price: 3500,
          total_amount: 35000,
        },
      },
      GENERAL: {
        rawText: '文件内容待辨识',
        structured: {},
      },
    };
    return templates[type] || templates.GENERAL;
  }

  async getFieldMappings(): Promise<any[]> {
    return [
      { field: 'contact_name', patterns: ['姓名[：:]\s*([^\\n]+)', '联系人[：:]\s*([^\\n]+)'] },
      { field: 'phone', patterns: ['电话[：:]\s*([0-9\\-]+)', 'Tel[：:]\s*([0-9\\-]+)'] },
      { field: 'amount', patterns: ['金额[：:]\s*([0-9,]+)', '总计[：:]\s*([0-9,]+)'] },
      { field: 'date', patterns: ['日期[：:]\s*(\\d{4}[-/]\\d{1,2}[-/]\\d{1,2})'] },
    ];
  }
}
