import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SosTriggerDto } from './dto/sos.dto';

@Injectable()
export class SosService {
  private readonly logger = new Logger(SosService.name);
  private sosEvents = new Map<string, any>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async trigger(employeeId: string, dto: SosTriggerDto): Promise<any> {
    const sosId = 'SOS-' + Date.now();
    const event = {
      sos_id: sosId,
      employee_id: employeeId,
      trigger_method: dto.trigger_method,
      gps_latitude: dto.gps_latitude,
      gps_longitude: dto.gps_longitude,
      device_info: dto.device_info,
      status: 'ACTIVE',
      triggered_at: new Date(),
    };

    this.sosEvents.set(sosId, event);
    this.eventEmitter.emit('sos.triggered', { sosId, employeeId, ...dto });
    this.logger.warn('SOS TRIGGERED: employee=' + employeeId + ' method=' + dto.trigger_method);

    return {
      sos_id: sosId,
      message: '已通知安全管理員，請保持冷靜',
      status: 'ACTIVE',
    };
  }

  async getActiveEvents(): Promise<any[]> {
    const events: any[] = [];
    this.sosEvents.forEach((v, k) => { if (v.status === 'ACTIVE') events.push(v); });
    return events;
  }

  async resolve(sosId: string, userId: string, note: string): Promise<any> {
    const event = this.sosEvents.get(sosId);
    if (!event) throw new HttpException({ errorCode: 'SYSTEM_001', message: 'SOS事件不存在' }, HttpStatus.NOT_FOUND);

    event.status = 'RESOLVED';
    event.resolved_by = userId;
    event.resolved_at = new Date();
    event.resolution_note = note;
    this.sosEvents.set(sosId, event);

    this.eventEmitter.emit('sos.resolved', { sosId, resolvedBy: userId, note });
    this.logger.log('SOS resolved: ' + sosId);

    return { sos_id: sosId, status: 'RESOLVED', resolved_at: event.resolved_at };
  }

  async checkSosStatus(employeeId: string): Promise<{ sos_active: boolean }> {
    let active = false;
    this.sosEvents.forEach(v => { if (v.employee_id === employeeId && v.status === 'ACTIVE') active = true; });
    return { sos_active: active };
  }
}