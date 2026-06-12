import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { SalesOrder } from '../../entities/sales-order.entity';
import { RecallCase } from '../../entities/recall-inventory.entity';

@Injectable()
export class BiService {
  private readonly logger = new Logger(BiService.name);

  constructor(
    @InjectRepository(SalesOrder) private readonly orderRepo: Repository<SalesOrder>,
    @InjectRepository(RecallCase) private readonly recallRepo: Repository<RecallCase>,
  ) {}

  async getCeoDashboard(): Promise<any> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayOrders, monthOrders, pendingApproval, activeRecalls] = await Promise.all([
      this.orderRepo.count({ where: { created_at: Between(todayStart, now) } }),
      this.orderRepo.count({ where: { created_at: Between(monthStart, now) } }),
      this.orderRepo.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.recallRepo.count({ where: { status: In(['APPROVED', 'IN_PROGRESS']) } }),
    ]);

    const approvedOrders = await this.orderRepo.find({ where: { status: In(['APPROVED', 'SHIPPED']) } });
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const overdueCount = approvedOrders.filter(o => new Date(o.created_at) < thirtyDaysAgo).length;

    const monthRevenue = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total_amount), 0)', 'revenue')
      .where('o.status IN (:...statuses)', { statuses: ['APPROVED', 'SHIPPED', 'COMPLETED', 'CLOSED'] })
      .andWhere('o.created_at >= :monthStart', { monthStart })
      .getRawOne();

    const monthCost = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total_cost), 0)', 'cost')
      .where('o.status IN (:...statuses)', { statuses: ['APPROVED', 'SHIPPED', 'COMPLETED', 'CLOSED'] })
      .andWhere('o.created_at >= :monthStart', { monthStart })
      .getRawOne();

    const revenue = Number(monthRevenue?.revenue || 0);
    const cost = Number(monthCost?.cost || 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';

    return {
      realtime: {
        today_orders: todayOrders,
        month_orders: monthOrders,
        pending_approval: pendingApproval,
        active_recalls: activeRecalls,
        overdue_ar_count: overdueCount,
      },
      t1: {
        month_revenue: revenue,
        month_cost: cost,
        month_gross_profit: profit,
        gross_margin_pct: margin,
      },
      risk_alerts: {
        overdue_ar: overdueCount > 5 ? 'HIGH' : overdueCount > 2 ? 'MEDIUM' : 'LOW',
        recall_active: activeRecalls > 3 ? 'HIGH' : activeRecalls > 0 ? 'MEDIUM' : 'NONE',
        pending_approval_backlog: pendingApproval > 10 ? 'HIGH' : 'NORMAL',
      },
      generated_at: now.toISOString(),
    };
  }

  async getOrderAnalytics(params: { start?: string; end?: string; groupBy?: string }): Promise<any> {
    const startDate = params.start ? new Date(params.start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.end ? new Date(params.end) : new Date();
    const groupBy = params.groupBy || 'day';

    const orders = await this.orderRepo.find({
      where: { created_at: Between(startDate, endDate), status: In(['APPROVED', 'SHIPPED', 'COMPLETED', 'CLOSED']) },
    });

    const grouped: Record<string, { count: number; amount: number }> = {};
    for (const o of orders) {
      const key = groupBy === 'month'
        ? new Date(o.created_at).toISOString().slice(0, 7)
        : new Date(o.created_at).toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = { count: 0, amount: 0 };
      grouped[key].count++;
      grouped[key].amount += Number(o.total_amount);
    }

    const series = Object.entries(grouped).map(([date, data]) => ({ date, orders: data.count, revenue: data.amount }));

    return { total_orders: orders.length, total_revenue: orders.reduce((s, o) => s + Number(o.total_amount), 0), series };
  }
}
