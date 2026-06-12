import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { NotificationService } from "./notification.service";
import { SendNotificationDto } from "./dto/notification.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getMine(@CurrentUser("employee_id") userId: string, @Query("unread") unread?: string) {
    return this.notificationService.getForUser(userId, unread === "true");
  }

  @Get("unread-count")
  getUnreadCount(@CurrentUser("employee_id") userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Put(":id/read")
  markRead(@Param("id") id: string, @CurrentUser("employee_id") userId: string) {
    return this.notificationService.markRead(id, userId);
  }

  @Put("read-all")
  markAllRead(@CurrentUser("employee_id") userId: string) {
    return this.notificationService.markAllRead(userId);
  }

  @Post()
  send(@Body() dto: SendNotificationDto) {
    return this.notificationService.send(dto);
  }
}