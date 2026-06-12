import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'SYSTEM_001';
    let message = '系统内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === 'string' ? res : res.message || exception.message;
      if (res.errorCode) errorCode = res.errorCode;
    }

    this.logger.error(`${request.method} ${request.url} → ${status} ${errorCode}: ${message}`);

    response.status(status).json({
      success: false,
      trace_id: (request as any).traceId || '',
      error_code: errorCode,
      message: Array.isArray(message) ? message.join('; ') : message,
      timestamp: new Date().toISOString(),
    });
  }
}
