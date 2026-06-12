import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { OnEvent } from "@nestjs/event-emitter";
import { SendNotificationDto } from "./dto/notification.dto";

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(@InjectEntityManager() private readonly em: EntityManager) {}
  async onModuleInit() {
    await this.ensureTable();
  }

  private async ensureTable() {
    try {
      await this.em.query(`
        CREATE TABLE IF NOT EXISTS notification (
          notification_id UUID PRIMARY KEY,
          recipient_id UUID NOT NULL,
          notification_type VARCHAR(50) DEFAULT 'SYSTEM',
          title VARCHAR(255) NOT NULL,
          body TEXT,
          link_url VARCHAR(500),
          entity_type VARCHAR(50),
          entity_id UUID,
          is_read BOOLEAN DEFAULT false,
          read_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);
      this.logger.log("notification table ensured");
    } catch (e: any) {
      this.logger.error("Failed to ensure notification table: " + e.message);
    }
  }


  /** Send notification to specific users or broadcast to all */
  async send(dto: SendNotificationDto): Promise<any> {
    const recipients = dto.recipient_ids && dto.recipient_ids.length > 0
      ? dto.recipient_ids
      : (await this.em.query("SELECT employee_id FROM employee_master WHERE deleted_at IS NULL AND is_active = true")).map((e: any) => e.employee_id);

    for (const rid of recipients) {
      await this.em.query(
        `INSERT INTO notification (notification_id, recipient_id, notification_type, title, body, link_url, entity_type, entity_id, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,
        [uuidv4(), rid, dto.notification_type || "SYSTEM", dto.title, dto.body, dto.link_url, dto.entity_type, dto.entity_id]
      );
    }
    this.logger.log(`Sent ${recipients.length} notifications: ${dto.title}`);
    return { sent: recipients.length };
  }

  /** Send to users with specific role(s) */
  private async sendToRole(roleCodes: string[], dto: Omit<SendNotificationDto, "recipient_ids">) {
    const users = await this.em.query(
      "SELECT employee_id FROM employee_master WHERE role_code = ANY($1) AND deleted_at IS NULL AND is_active = true",
      [roleCodes]
    );
    if (users.length > 0) {
      await this.send({ ...dto, recipient_ids: users.map((u: any) => u.employee_id) });
    }
  }

  /** Send to a specific user */
  private async sendToUser(userId: string, dto: Omit<SendNotificationDto, "recipient_ids">) {
    await this.send({ ...dto, recipient_ids: [userId] });
  }

  /** Get notifications for the current user */
  async getForUser(userId: string, unreadOnly?: boolean) {
    let where = "WHERE recipient_id = $1";
    const params: any[] = [userId];
    if (unreadOnly) where += " AND is_read = false";
    const items = await this.em.query(
      `SELECT * FROM notification ${where} ORDER BY created_at DESC LIMIT 100`, params
    );
    const unreadCount = await this.em.query(
      "SELECT COUNT(*) as cnt FROM notification WHERE recipient_id = $1 AND is_read = false", [userId]
    );
    return { items, unread_count: parseInt(unreadCount[0].cnt) };
  }

  async markRead(notificationId: string, userId: string) {
    await this.em.query(
      "UPDATE notification SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE notification_id = $1 AND recipient_id = $2",
      [notificationId, userId]
    );
    return { notification_id: notificationId, is_read: true };
  }

  async markAllRead(userId: string) {
    await this.em.query(
      "UPDATE notification SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE recipient_id = $1 AND is_read = false",
      [userId]
    );
    return { marked: true };
  }

  async getUnreadCount(userId: string) {
    const r = await this.em.query(
      "SELECT COUNT(*) as cnt FROM notification WHERE recipient_id = $1 AND is_read = false", [userId]
    );
    return { count: parseInt(r[0].cnt) };
  }

  // ============================================================
  // 審批事件監聽 — 自動產生審批通知
  // ============================================================

  /** 訂單提交審批 → 通知 GM、財務 */
  @OnEvent("order.submitted")
  async onOrderSubmitted(event: any) {
    this.logger.log(`Order submitted: ${event.entityId}`);
    await this.sendToRole(["GM", "FINANCE", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "待審批：銷售訂單 " + (event.order_no || event.entityId),
      body: "一筆新的銷售訂單已提交審批，金額 NT$ " + (event.amount ? Number(event.amount).toLocaleString() : "—") + "，請盡速審核。",
      link_url: "/orders",
      entity_type: "ORDER",
      entity_id: event.entityId,
    });
  }

  /** 訂單審批通過 → 通知建立者 */
  @OnEvent("order.approved")
  async onOrderApproved(event: any) {
    if (event.userId) {
      await this.sendToUser(event.userId, {
        notification_type: "APPROVAL",
        title: "已核准：銷售訂單 " + (event.order_no || event.entityId),
        body: "您的銷售訂單已審批通過，系統將自動進行後續出貨作業。",
        link_url: "/orders",
        entity_type: "ORDER",
        entity_id: event.entityId,
      });
    }
  }

  /** 訂單駁回 → 通知建立者 */
  @OnEvent("order.rejected")
  async onOrderRejected(event: any) {
    if (event.userId) {
      await this.sendToUser(event.userId, {
        notification_type: "APPROVAL",
        title: "已駁回：銷售訂單 " + (event.order_no || event.entityId),
        body: "您的銷售訂單已被駁回，原因：" + (event.reason || "未提供") + "。請修改後重新提交。",
        link_url: "/orders",
        entity_type: "ORDER",
        entity_id: event.entityId,
      });
    }
  }

  /** 訂單連續駁回鎖定 → 通知 SALES_DIRECTOR */
  @OnEvent("order.locked")
  async onOrderLocked(event: any) {
    await this.sendToRole(["SALES_DIRECTOR", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "訂單鎖定：" + (event.order_no || event.entityId),
      body: "銷售訂單因連續駁回已達上限，已被系統鎖定。需業務總監或系統管理員解鎖。",
      link_url: "/orders",
      entity_type: "ORDER",
      entity_id: event.entityId,
    });
  }

  /** 採購單審批通過 → 通知採購 */
  @OnEvent("purchase.po_approved")
  async onPurchaseApproved(event: any) {
    await this.sendToRole(["PURCHASE", "WAREHOUSE", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "已核准：採購單 " + (event.po_no || event.entityId),
      body: "採購單已審批通過，請倉管準備收貨作業。",
      link_url: "/purchase",
      entity_type: "PURCHASE",
      entity_id: event.entityId,
    });
  }

  /** 採購單建立 → 通知財務、GM */
  @OnEvent("purchase.po_created")
  async onPurchaseCreated(event: any) {
    await this.sendToRole(["GM", "FINANCE", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "待審批：採購單 " + (event.poNo || event.entityId),
      body: "新採購單 " + (event.poNo || "") + " 金額 NT$ " + (event.totalAmount ? Number(event.totalAmount).toLocaleString() : "—") + "，供應商：" + (event.supplierId || ""),
      link_url: "/purchase",
      entity_type: "PURCHASE",
      entity_id: event.entityId,
    });
  }

  /** 召回案件提交 → 通知 QA */
  @OnEvent("recall.case_submitted")
  async onRecallSubmitted(event: any) {
    await this.sendToRole(["QA", "QA_SUPERVISOR", "QA_DIRECTOR", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "待審批：召回案件 " + (event.entityId || ""),
      body: "新的召回案件已提交，請品保部門進行審核。",
      link_url: "/recall",
      entity_type: "RECALL",
      entity_id: event.entityId,
    });
  }

  /** 召回案件審批通過 → 批次鎖定 + 通知倉管 */
  @OnEvent("recall.case_approved")
  async onRecallApproved(event: any) {
    await this.sendToRole(["WAREHOUSE", "QA", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "已核准：召回案件 " + (event.entityId || ""),
      body: "召回案件已審批通過，相關批次已自動凍結。請倉管進行庫存隔離作業。",
      link_url: "/recall",
      entity_type: "RECALL",
      entity_id: event.entityId,
    });
  }

  /** 批次鎖定 → 通知倉管 */
  @OnEvent("recall.batch_locked")
  async onBatchLocked(event: any) {
    await this.sendToRole(["WAREHOUSE", "ADMIN"], {
      notification_type: "RECALL",
      title: "批次已鎖定",
      body: "批次 " + (event.batchNo || event.entityId) + " 因召回已被系統鎖定，禁止出庫。",
      link_url: "/inventory",
      entity_type: "RECALL",
      entity_id: event.entityId,
    });
  }

  /** 打板申請審批通過 → 通知申請人 */
  @OnEvent("sample.request_approved")
  async onSampleApproved(event: any) {
    if (event.userId) {
      await this.sendToUser(event.userId, {
        notification_type: "APPROVAL",
        title: "已核准：打板申請",
        body: "您的打板申請已審批通過，系統將安排出貨。",
        link_url: "/samples",
        entity_type: "SAMPLE",
        entity_id: event.entityId,
      });
    }
    await this.sendToRole(["WAREHOUSE", "ADMIN"], {
      notification_type: "SAMPLE",
      title: "打板待出貨",
      body: "打板申請已通過品保放行，請安排樣品出貨。",
      link_url: "/samples",
      entity_type: "SAMPLE",
      entity_id: event.entityId,
    });
  }

  /** 打板出貨 → 通知申請人 */
  @OnEvent("sample.shipped")
  async onSampleShipped(event: any) {
    if (event.userId) {
      await this.sendToUser(event.userId, {
        notification_type: "SAMPLE",
        title: "打板已出貨",
        body: "您的打板樣品已出貨，請留意收貨並提交反饋。",
        link_url: "/samples",
        entity_type: "SAMPLE",
        entity_id: event.entityId,
      });
    }
  }

  /** 預算調整審批通過 → 通知財務 */
  @OnEvent("financial.budget_adjusted")
  async onBudgetAdjusted(event: any) {
    await this.sendToRole(["FINANCE", "FINANCE_DIRECTOR", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "預算調整已核准",
      body: "一筆預算調整已審批通過，請財務部門更新預算報表。",
      link_url: "/finance",
      entity_type: "BUDGET",
      entity_id: event.entityId,
    });
  }

  /** SOS 觸發 → 通知管理層 */
  @OnEvent("sos.triggered")
  async onSosTriggered(event: any) {
    await this.sendToRole(["GM", "ADMIN", "EXECUTIVE_DIRECTOR"], {
      notification_type: "SOS",
      title: "SOS 緊急警報",
      body: "員工 " + (event.employeeNo || event.employeeId || "") + " 觸發 SOS！位置：經度 " + (event.gps_longitude || "") + "，緯度 " + (event.gps_latitude || "") + "，請立即處理。",
      link_url: "/sos",
      entity_type: "SOS",
      entity_id: event.entityId,
    });
  }

  // ============================================================
  // 寄庫審批事件監聽
  // ============================================================

  /** 寄庫出庫提交審批 → 通知 QA */
  @OnEvent("consignment.release_submitted")
  async onConsignmentReleaseSubmitted(event: any) {
    await this.sendToRole(["QA", "QA_SUPERVISOR", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "待審批：寄庫出庫 " + (event.release_no || event.entityId),
      body: "寄庫出庫單 " + (event.release_no || "") + " 已提交，數量：" + (event.quantity || "") + "，請QA品保放行。",
      link_url: "/consignment",
      entity_type: "CONSIGNMENT_RELEASE",
      entity_id: event.entityId,
    });
  }

  /** 寄庫出庫 QA 放行 → 通知倉管 */
  @OnEvent("consignment.release_qa_approved")
  async onConsignmentReleaseQaApproved(event: any) {
    await this.sendToRole(["WAREHOUSE", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "待出貨：寄庫出庫 " + (event.release_no || event.entityId),
      body: "寄庫出庫單 " + (event.release_no || "") + " 已通過QA放行，請倉管確認出貨。",
      link_url: "/consignment",
      entity_type: "CONSIGNMENT_RELEASE",
      entity_id: event.entityId,
    });
  }

  /** 寄庫出庫完成 → 通知業務 */
  @OnEvent("consignment.release_shipped")
  async onConsignmentReleaseShipped(event: any) {
    await this.sendToRole(["SALES", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "已出貨：寄庫出庫 " + (event.release_no || event.entityId),
      body: "寄庫出庫單 " + (event.release_no || "") + " 已完成出貨。",
      link_url: "/consignment",
      entity_type: "CONSIGNMENT_RELEASE",
      entity_id: event.entityId,
    });
  }

  /** 寄庫換貨提交審批 → 通知 QA */
  @OnEvent("consignment.exchange_submitted")
  async onConsignmentExchangeSubmitted(event: any) {
    await this.sendToRole(["QA", "QA_SUPERVISOR", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "待審批：寄庫換貨 " + (event.exchange_no || event.entityId),
      body: "寄庫換貨單 " + (event.exchange_no || "") + " 已提交，數量：" + (event.quantity || "") + "，請QA品保放行。",
      link_url: "/consignment",
      entity_type: "CONSIGNMENT_EXCHANGE",
      entity_id: event.entityId,
    });
  }

  /** 寄庫換貨 QA 放行 → 通知倉管 */
  @OnEvent("consignment.exchange_qa_approved")
  async onConsignmentExchangeQaApproved(event: any) {
    await this.sendToRole(["WAREHOUSE", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "待出貨：寄庫換貨 " + (event.exchange_no || event.entityId),
      body: "寄庫換貨單 " + (event.exchange_no || "") + " 已通過QA放行，請倉管確認出貨。",
      link_url: "/consignment",
      entity_type: "CONSIGNMENT_EXCHANGE",
      entity_id: event.entityId,
    });
  }

  /** 寄庫換貨完成 → 通知業務 */
  @OnEvent("consignment.exchange_shipped")
  async onConsignmentExchangeShipped(event: any) {
    await this.sendToRole(["SALES", "ADMIN"], {
      notification_type: "APPROVAL",
      title: "已出貨：寄庫換貨 " + (event.exchange_no || event.entityId),
      body: "寄庫換貨單 " + (event.exchange_no || "") + " 已完成換貨出貨。",
      link_url: "/consignment",
      entity_type: "CONSIGNMENT_EXCHANGE",
      entity_id: event.entityId,
    });
  }}
