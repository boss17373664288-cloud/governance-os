﻿import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CreateVisitDto, ScheduleVisitDto, CheckinDto } from "./dto/visit.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class VisitService {
  private readonly logger = new Logger(VisitService.name);

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByCustomer(customerId: string) {
    return this.em.query(
      "SELECT v.*, cm.customer_name FROM visit v LEFT JOIN customer_master cm ON cm.customer_id = v.customer_id WHERE v.customer_id = $1 ORDER BY v.visit_date DESC, v.scheduled_time ASC LIMIT 50",
      [customerId]
    );
  }

  async getMyVisits(userId: string) {
    return this.em.query(
      "SELECT v.*, cm.customer_name FROM visit v LEFT JOIN customer_master cm ON cm.customer_id = v.customer_id WHERE v.employee_id = $1 ORDER BY v.visit_date DESC, v.scheduled_time ASC LIMIT 50",
      [userId]
    );
  }

  async getTodaySchedule(userId: string) {
    return this.em.query(
      "SELECT v.*, cm.customer_name FROM visit v LEFT JOIN customer_master cm ON cm.customer_id = v.customer_id WHERE v.employee_id = $1 AND v.visit_date = CURRENT_DATE ORDER BY v.scheduled_time ASC",
      [userId]
    );
  }

  async schedule(dto: ScheduleVisitDto, userId: string) {
    // Parse datetime-local: "2026-06-07T14:00"
    const parts = dto.scheduled_time.split("T");
    const visitDate = parts[0]; // "2026-06-07"
    const visitTime = parts[1]?.substring(0, 5) || null; // "14:00"

    // Check for existing schedule on same date AND same time
    const existing = await this.em.query(
      "SELECT * FROM visit WHERE employee_id = $1 AND visit_date = $2::date AND scheduled_time = $3 AND status = 'PLANNED' LIMIT 1",
      [userId, visitDate, visitTime]
    );
    if (existing.length > 0) throw new HttpException({ errorCode: "VISIT_001", message: "該時段已有行程，請選擇其他時間" }, HttpStatus.CONFLICT);

    return this.em.query(
      "INSERT INTO visit (visit_id, customer_id, visit_date, scheduled_time, visit_type, visit_purpose, employee_id, status) VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8) RETURNING *",
      [uuidv4(), dto.customer_id, visitDate, visitTime, dto.visit_type, dto.visit_type, userId, "PLANNED"]
    );
  }

  async checkin(dto: CheckinDto, userId: string) {
    const visits = await this.em.query("SELECT * FROM visit WHERE visit_id = $1", [dto.visit_id]);
    if (visits.length === 0) throw new HttpException({ errorCode: "VISIT_002", message: "拜訪記錄不存在" }, HttpStatus.NOT_FOUND);
    return this.em.query(
      "UPDATE visit SET checkin_time = NOW(), checkin_gps_lat = $1, checkin_gps_lng = $2, status = 'CHECKED_IN' WHERE visit_id = $3 RETURNING *",
      [dto.gps_latitude, dto.gps_longitude, dto.visit_id]
    );
  }

  async checkout(visitId: string, _userId: string) {
    const visits = await this.em.query("SELECT * FROM visit WHERE visit_id = $1", [visitId]);
    if (visits.length === 0) throw new HttpException({ errorCode: "VISIT_002", message: "拜訪記錄不存在" }, HttpStatus.NOT_FOUND);
    const visit = visits[0];
    const duration = visit.checkin_time ? Math.round((+new Date() - +new Date(visit.checkin_time)) / 60000) : 0;
    return this.em.query(
      "UPDATE visit SET checkout_time = NOW(), duration_minutes = $1, status = 'COMPLETED' WHERE visit_id = $2 RETURNING *",
      [duration, visitId]
    );
  }

  async createRecord(dto: CreateVisitDto, userId: string) {
    const nextDate = (dto as any).next_followup_date || null;
    const saved = await this.em.query(
      "INSERT INTO visit (visit_id, customer_id, visit_date, visit_type, visit_purpose, result_code, notes, next_action, next_followup_date, employee_id, status, checkin_time) VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *",
      [uuidv4(), dto.customer_id, dto.visit_date, dto.visit_type, dto.visit_purpose, dto.result_code || null, dto.notes || null, dto.next_action || null, nextDate, userId, "COMPLETED"]
    );
    this.eventEmitter.emit("visit.completed", { ...saved[0], userId });
    this.logger.log("Visit record created for customer: " + dto.customer_id);
    return saved[0];
  }
}