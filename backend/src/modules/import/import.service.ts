import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(@InjectQueue('import') private readonly importQueue: Queue) {}

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024;
  private readonly ALLOWED_ENTITIES = ['CUSTOMER','PRODUCT','EMPLOYEE','SUPPLIER','INVENTORY','SALES_ORDER','PURCHASE_ORDER'];

  async createTask(dto: { entity_type: string; file_name: string; import_mode?: string; error_strategy?: string }, userId: string): Promise<any> {
    if (!this.ALLOWED_ENTITIES.includes(dto.entity_type)) {
      throw new HttpException({ errorCode: 'IMPORT_001', message: '不支持的实体类型' }, HttpStatus.BAD_REQUEST);
    }

    const taskId = 'IMP-' + Date.now();
    const job = await this.importQueue.add('process', {
      taskId, entityType: dto.entity_type, fileName: dto.file_name,
      importMode: dto.import_mode || 'INSERT',
      errorStrategy: dto.error_strategy || 'SKIP',
      userId,
    }, { attempts: 3, backoff: { type: 'exponential', delay: 60000 } });

    this.logger.log('Import task created: ' + taskId + ' entity=' + dto.entity_type);

    return {
      task_id: taskId,
      entity_type: dto.entity_type,
      file_name: dto.file_name,
      status: 'PENDING',
      job_id: job.id,
    };
  }

  async getTasks(query: { page?: number; page_size?: number; status?: string; entity_type?: string }): Promise<any> {
    return {
      items: [],
      pagination: { page: query.page || 1, page_size: query.page_size || 20, total: 0, total_pages: 0 },
    };
  }

  async getTask(id: string): Promise<any> {
    return { task_id: id, status: 'PENDING', entity_type: 'CUSTOMER', total_rows: 0, success_rows: 0, failed_rows: 0 };
  }

  async retryTask(id: string): Promise<any> {
    await this.importQueue.add('process', { taskId: id, retry: true });
    return { task_id: id, status: 'PROCESSING' };
  }

  async cancelTask(id: string): Promise<any> {
    return { task_id: id, status: 'CANCELLED' };
  }

  getDownloadTemplates(): any[] {
    return this.ALLOWED_ENTITIES.map(e => ({
      entity_type: e,
      template_url: '/api/v1/import/templates/' + e.toLowerCase() + '.xlsx',
      description: e + ' 导入模板',
    }));
  }
}
