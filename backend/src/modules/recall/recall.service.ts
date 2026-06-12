import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { RecallCase, BatchMaster, InventoryLedger } from '../../entities/recall-inventory.entity';
import { SalesOrder, SalesOrderItem } from '../../entities/sales-order.entity';
import { Product } from '../../entities/product.entity';
import { StateMachineService } from '../../core/state-machine/state-machine.service';
import { CreateRecallDto, ReplaceBatchDto } from './dto/recall.dto';
import { PaginationDto, PaginatedResult } from '../../shared/dto/pagination.dto';

@Injectable()
export class RecallService {
  private readonly logger = new Logger(RecallService.name);

  constructor(
    @InjectRepository(RecallCase) private readonly recallRepo: Repository<RecallCase>,
    @InjectRepository(BatchMaster) private readonly batchRepo: Repository<BatchMaster>,
    @InjectRepository(InventoryLedger) private readonly ledgerRepo: Repository<InventoryLedger>,
    @InjectRepository(SalesOrder) private readonly orderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem) private readonly orderItemRepo: Repository<SalesOrderItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly stateMachine: StateMachineService,
  ) {}

  async findAll(query: PaginationDto & { status?: string; level?: string }): Promise<PaginatedResult<RecallCase>> {
    const { page = 1, page_size = 20, sort_by = 'created_at', sort_order = 'DESC', status, level } = query;
    const where: any = {};
    if (status) where.status = status;
    if (level) where.recall_level = level;

    const [items, total] = await this.recallRepo.findAndCount({
      where,
      order: { [sort_by]: sort_order },
      skip: (page - 1) * page_size,
      take: page_size,
    });
    return { items, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async findOne(id: string): Promise<any> {
    const recall = await this.recallRepo
      .createQueryBuilder("rc")
      .leftJoinAndSelect(Product, "p", "p.product_id = rc.product_id")
      .where("rc.recall_id = :id", { id })
      .getOne();
    if (!recall) throw new HttpException({ errorCode: "RECALL_001", message: "召回案件不存在" }, HttpStatus.NOT_FOUND);
    return recall;
  }

  async create(dto: CreateRecallDto, userId: string): Promise<RecallCase> {
    const product = await this.productRepo.findOne({ where: { product_id: dto.product_id } });
    if (!product) throw new HttpException({ errorCode: 'PROD_001', message: '产品不存在' }, HttpStatus.NOT_FOUND);

    // Check batch exists
    const batch = await this.batchRepo.findOne({
      where: { product_id: dto.product_id, batch_no: dto.batch_no },
    });
    if (!batch) throw new HttpException({ errorCode: 'INVENTORY_002', message: '批号不存在' }, HttpStatus.NOT_FOUND);

    const seq = await this.recallRepo.count();
    const recallNo = `RC${dto.recall_level}${String(seq + 1).padStart(6, '0')}`;

    const recall = this.recallRepo.create({
      recall_no: recallNo,
      recall_level: dto.recall_level,
      product_id: dto.product_id,
      batch_no: dto.batch_no,
      description: dto.description,
      discovery_date: dto.discovery_date ? new Date(dto.discovery_date) : new Date(),
      status: 'DRAFT',
      created_by: userId,
    });

    return this.recallRepo.save(recall);
  }

  async submit(id: string, userId: string): Promise<RecallCase> {
    const recall = await this.findOne(id);
    const result = await this.stateMachine.transition('RecallCase', recall.recall_id, recall.status, {
      action: 'submit',
      userId,
    });

    if (!result.success) {
      throw new HttpException({ errorCode: 'SYSTEM_001', message: result.error || '状态转换失败' }, HttpStatus.BAD_REQUEST);
    }

    recall.status = result.toState;
    return this.recallRepo.save(recall);
  }

  async approve(id: string, userId: string, userRole: string): Promise<any> {
    const recall = await this.findOne(id);
    const level = parseInt(recall.recall_level.replace('R', ''));

    // Role check for recall level
    const requiredRoles: Record<number, string[]> = {
      1: ['QA'],
      2: ['QA', 'QA_DIRECTOR'],
      3: ['QA_DIRECTOR', 'GM'],
      4: ['QA_DIRECTOR', 'GM', 'EXECUTIVE_DIRECTOR'],
    };
    const allowed = requiredRoles[level] || [];
    if (!allowed.includes(userRole)) {
      throw new HttpException({ errorCode: 'RECALL_002', message: '召回审批等级与权限不匹配' }, HttpStatus.FORBIDDEN);
    }

    const result = await this.stateMachine.transition('RecallCase', recall.recall_id, recall.status, {
      action: 'approve',
      userId,
      context: { userRole, recallLevel: level },
    });

    if (!result.success) {
      throw new HttpException({ errorCode: 'SYSTEM_001', message: result.error || '审批失败' }, HttpStatus.BAD_REQUEST);
    }

    // Auto-lock batches
    await this.lockBatches(recall.product_id, recall.batch_no, level);

    // Handle orders based on recall level
    await this.handleAffectedOrders(recall.product_id, recall.batch_no, level);

    recall.status = result.toState;
    return this.recallRepo.save(recall);
  }

  private async lockBatches(productId: string, batchNo: string, level: number): Promise<void> {
    const batch = await this.batchRepo.findOne({ where: { product_id: productId, batch_no: batchNo } });
    if (!batch) return;

    const newRecallStatus = level >= 3 ? 'RECALL_FROZEN' : level === 2 ? 'RECALL_RESTRICTED' : 'RECALL_OBSERVE';
    const newQaStatus = level >= 3 ? 'QA_FROZEN' : batch.qa_status;

    await this.batchRepo.update(batch.batch_id, {
      recall_status: newRecallStatus,
      qa_status: newQaStatus,
    });

    this.logger.log(`Batch ${batchNo} locked: recall=${newRecallStatus}, qa=${newQaStatus}`);
  }

  private async handleAffectedOrders(productId: string, batchNo: string, level: number): Promise<void> {
    // Find order items using this batch
    const orderItems = await this.orderItemRepo.find({
      where: { product_id: productId, allocated_batch_no: batchNo },
    });

    if (orderItems.length === 0) return;

    const orderIds = [...new Set(orderItems.map(i => i.order_id))];
    const orders = await this.orderRepo.find({ where: { order_id: In(orderIds), status: In(['APPROVED', 'SHIPPED', 'PENDING_APPROVAL']) } });

    for (const order of orders) {
      if (level === 1) {
        // R1: mark for observation, no status change
        continue;
      } else if (level === 2) {
        // R2: put on hold
        if (order.status === 'APPROVED' || order.status === 'PENDING_APPROVAL') {
          order.status = 'ON_HOLD_RECALL';
        }
      } else if (level === 3) {
        // R3: auto-replace batch (max 3 level recursion)
        await this.autoReplaceBatches(order.order_id, productId, batchNo, 0);
      } else if (level === 4) {
        // R4: force cancel
        order.status = 'CANCELLED';
      }
      await this.orderRepo.save(order);
    }

    this.logger.log(`Handled ${orders.length} orders affected by recall ${batchNo}`);
  }

  async replaceBatch(recallId: string, dto: ReplaceBatchDto, userId: string): Promise<any> {
    const recall = await this.findOne(recallId);

    const targetBatch = await this.batchRepo.findOne({
      where: { product_id: recall.product_id, batch_no: dto.target_batch_no, recall_status: 'NORMAL' },
    });
    if (!targetBatch) {
      throw new HttpException({ errorCode: 'RECALL_005', message: '无可替换批号' }, HttpStatus.BAD_REQUEST);
    }

    // Find affected orders and replace
    const orderItems = await this.orderItemRepo.find({
      where: { product_id: recall.product_id, allocated_batch_no: recall.batch_no },
    });

    let replaced = 0;
    for (const item of orderItems) {
      item.allocated_batch_no = dto.target_batch_no;
      await this.orderItemRepo.save(item);
      replaced++;
    }

    this.logger.log(`Batch replacement: ${recall.batch_no} → ${dto.target_batch_no} (${replaced} items)`);
    return { replaced_items: replaced, source_batch: recall.batch_no, target_batch: dto.target_batch_no };
  }

  private async autoReplaceBatches(orderId: string, productId: string, badBatchNo: string, depth: number): Promise<void> {
    if (depth >= 3) {
      this.logger.warn(`Batch replacement recursion limit reached for order ${orderId}`);
      return;
    }

    const items = await this.orderItemRepo.find({
      where: { order_id: orderId, product_id: productId, allocated_batch_no: badBatchNo },
    });

    if (items.length === 0) return;

    // Find best replacement: longest expiry, NORMAL status
    const replacement = await this.batchRepo.findOne({
      where: { product_id: productId, recall_status: 'NORMAL', qa_status: In(['PASSED', 'RELEASED']) },
      order: { expiry_date: 'DESC' },
    });

    if (!replacement) {
      // No replacement available - flag for manual intervention
      const order = await this.orderRepo.findOne({ where: { order_id: orderId } });
      if (order) {
        order.status = 'PENDING_RECALL_ACTION';
        await this.orderRepo.save(order);
      }
      return;
    }

    for (const item of items) {
      item.allocated_batch_no = replacement.batch_no;
      await this.orderItemRepo.save(item);
    }

    // Check if the replacement batch itself is also being recalled (recursive)
    const replacementRecall = await this.recallRepo.findOne({
      where: { product_id: productId, batch_no: replacement.batch_no, status: In(['APPROVED', 'IN_PROGRESS', 'RESOLVED']) },
    });

    if (replacementRecall) {
      await this.autoReplaceBatches(orderId, productId, replacement.batch_no, depth + 1);
    }
  }


  async start(id: string, userId: string): Promise<RecallCase> {
    const recall = await this.findOne(id);
    const result = await this.stateMachine.transition('RecallCase', recall.recall_id, recall.status, {
      action: 'start',
      userId,
    });

    if (!result.success) {
      throw new HttpException({ errorCode: 'SYSTEM_001', message: result.error || '啟動失敗' }, HttpStatus.BAD_REQUEST);
    }

    recall.status = result.toState;
    return this.recallRepo.save(recall);
  }

  async resolve(id: string, userId: string): Promise<RecallCase> {
    const recall = await this.findOne(id);
    const result = await this.stateMachine.transition('RecallCase', recall.recall_id, recall.status, {
      action: 'resolve',
      userId,
    });

    if (!result.success) {
      throw new HttpException({ errorCode: 'SYSTEM_001', message: result.error || '解決失敗' }, HttpStatus.BAD_REQUEST);
    }

    recall.status = result.toState;
    return this.recallRepo.save(recall);
  }

  async reject(id: string, userId: string): Promise<RecallCase> {
    const recall = await this.findOne(id);
    const result = await this.stateMachine.transition('RecallCase', recall.recall_id, recall.status, {
      action: 'reject',
      userId,
    });

    if (!result.success) {
      throw new HttpException({ errorCode: 'SYSTEM_001', message: result.error || '退回失敗' }, HttpStatus.BAD_REQUEST);
    }

    recall.status = result.toState;
    return this.recallRepo.save(recall);
  }

  async close(id: string, userId: string, userRole: string): Promise<RecallCase> {
    const recall = await this.findOne(id);
    if (userRole !== 'QA_DIRECTOR' && userRole !== 'ADMIN') {
      throw new HttpException({ errorCode: 'AUTH_003', message: '权限不足' }, HttpStatus.FORBIDDEN);
    }

    const result = await this.stateMachine.transition('RecallCase', recall.recall_id, recall.status, {
      action: 'close',
      userId,
    });

    if (!result.success) {
      throw new HttpException({ errorCode: 'SYSTEM_001', message: result.error || '关闭失败' }, HttpStatus.BAD_REQUEST);
    }

    recall.status = result.toState;
    recall.closed_at = new Date();
    return this.recallRepo.save(recall);
  }

  async reopen(id: string, userId: string, reason: string): Promise<RecallCase> {
    const recall = await this.findOne(id);

    const result = await this.stateMachine.transition('RecallCase', recall.recall_id, recall.status, {
      action: 'reopen',
      userId,
      context: { reason },
    });

    if (!result.success) {
      throw new HttpException({ errorCode: 'RECALL_006', message: '召回案件已关闭，无法重新开启（需品保总监）' }, HttpStatus.FORBIDDEN);
    }

    recall.status = result.toState;
    recall.closed_at = null as any;
    return this.recallRepo.save(recall);
  }

  async trace(batchNo: string): Promise<any> {
    const batch = await this.batchRepo.findOne({ where: { batch_no: batchNo } });
    if (!batch) throw new HttpException({ errorCode: 'INVENTORY_002', message: '批号不存在' }, HttpStatus.NOT_FOUND);

    const product = await this.productRepo.findOne({ where: { product_id: batch.product_id } });
    const recallCases = await this.recallRepo.find({ where: { batch_no: batchNo }, order: { created_at: 'DESC' } });
    const orderItems = await this.orderItemRepo.find({ where: { allocated_batch_no: batchNo } });
    const ledgerEntries = await this.ledgerRepo.find({ where: { batch_id: batch.batch_id }, order: { created_at: 'DESC' }, take: 50 });

    // Calculate current inventory
    const currentQty = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('SUM(l.balance_after)', 'total')
      .where('l.batch_id = :batchId', { batchId: batch.batch_id })
      .orderBy('l.created_at', 'DESC')
      .limit(1)
      .getRawOne();

    return {
      batch: {
        batch_no: batch.batch_no,
        product_name: product?.product_name,
        product_code: product?.product_code,
        expiry_date: batch.expiry_date,
        qa_status: batch.qa_status,
        recall_status: batch.recall_status,
        manufacturer: batch.manufacturer,
        current_quantity: currentQty?.total || 0,
      },
      recall_cases: recallCases.map(r => ({
        recall_no: r.recall_no,
        level: r.recall_level,
        status: r.status,
        description: r.description,
        created_at: r.created_at,
      })),
      order_count: orderItems.length,
      recent_ledger: ledgerEntries.slice(0, 10),
    };
  }
}
