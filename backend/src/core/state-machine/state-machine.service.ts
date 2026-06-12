import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StateMachineDefinition, StateMachineLog } from './state-machine.entity';
import { v4 as uuidv4 } from 'uuid';

export interface TransitionRequest {
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  context?: Record<string, any>;
}

export interface TransitionResult {
  success: boolean;
  from_state: string;
  toState: string;
  eventsPublished: string[];
  error?: string;
}

@Injectable()
export class StateMachineService {
  private readonly logger = new Logger(StateMachineService.name);
  private definitionCache = new Map<string, StateMachineDefinition[]>();

  constructor(
    @InjectRepository(StateMachineDefinition)
    private readonly definitionRepo: Repository<StateMachineDefinition>,
    @InjectRepository(StateMachineLog)
    private readonly logRepo: Repository<StateMachineLog>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async transition(
    entityType: string,
    entityId: string,
    currentState: string,
    request: Omit<TransitionRequest, 'entityType' | 'entityId'>,
  ): Promise<TransitionResult> {
    const definition = await this.findDefinition(entityType, currentState, request.action);

    if (!definition) {
      return {
        success: false,
        from_state: currentState,
        toState: currentState,
        eventsPublished: [],
        error: `No transition defined: ${entityType}:${currentState} �� ${request.action}`,
      };
    }

    // Execute guards
    if (definition.guard_conditions) {
      const guardsOk = await this.executeGuards(definition.guard_conditions, request.context || {});
      if (!guardsOk) {
        return {
          success: false,
          from_state: currentState,
          toState: currentState,
          eventsPublished: [],
          error: 'Guard conditions not met',
        };
      }
    }

    const toState = definition.to_state;
    const eventsPublished: string[] = [];

    // Execute in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Log the transition
      await queryRunner.manager.insert(StateMachineLog, {
          id: uuidv4(),
        entity_type: entityType,
        entity_id: entityId,
        from_state: currentState,
        to_state: toState,
        action: request.action,
        user_id: request.userId,
        context: request.context || {},
      });

      await queryRunner.commitTransaction();

      // Emit side-effect events (after transaction commit)
      if (definition.side_effects) {
        const effects = definition.side_effects as { events?: string[] };
        if (effects.events) {
          for (const eventType of effects.events) {
            this.eventEmitter.emit(eventType, {
              entityType,
              entityId,
              from_state: currentState,
              toState,
              userId: request.userId,
              context: request.context,
              eventId: uuidv4(),
            });
            eventsPublished.push(eventType);
          }
        }
      }

      this.logger.log(`Transition: ${entityType}:${entityId} [${currentState}] �� [${toState}] by ${request.action}`);

      return { success: true, from_state: currentState, toState, eventsPublished };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transition failed: ${entityType}:${entityId}`, error);
      return { success: false, from_state: currentState, toState: currentState, eventsPublished: [], error: String(error) };
    } finally {
      await queryRunner.release();
    }
  }

  private async findDefinition(entityType: string, from_state: string, action: string): Promise<StateMachineDefinition | null> {
    const cacheKey = `${entityType}:${from_state}`;

    if (!this.definitionCache.has(cacheKey)) {
      const defs = await this.definitionRepo.find({
        where: { entity_type: entityType, from_state: from_state, is_active: true },
      });
      this.definitionCache.set(cacheKey, defs);
    }

    const defs = this.definitionCache.get(cacheKey) || [];
    return defs.find(d => d.action === action) || null;
  }

  private async executeGuards(guards: any, context: Record<string, any>): Promise<boolean> {
    if (guards.creditStatus && context.creditStatus !== guards.creditStatus) return false;
    if (guards.minAmount && context.amount < guards.minAmount) return false;
    if (guards.maxAmount && context.amount > guards.maxAmount) return false;
    if (guards.requireRole && !guards.requireRole.includes(context.userRole)) return false;
    if (guards.customCheck && typeof guards.customCheck === 'function') {
      return guards.customCheck(context);
    }
    return true;
  }

  async seedDefaults(): Promise<void> {
    const defaults = [
      // Sales Order
      { entity_type: 'SalesOrder', from_state: 'DRAFT', to_state: 'PENDING_APPROVAL', action: 'submit', guard_conditions: undefined, side_effects: { events: ['order.submitted'] } },
      { entity_type: 'SalesOrder', from_state: 'PENDING_APPROVAL', to_state: 'APPROVED', action: 'approve', guard_conditions: undefined, side_effects: { events: ['order.approved'] } },
      { entity_type: 'SalesOrder', from_state: 'PENDING_APPROVAL', to_state: 'REJECTED', action: 'reject', guard_conditions: undefined, side_effects: { events: ['order.rejected'] } },
      { entity_type: 'SalesOrder', from_state: 'REJECTED', to_state: 'DRAFT', action: 'revise', guard_conditions: undefined, side_effects: undefined },
      { entity_type: 'SalesOrder', from_state: 'REJECTED', to_state: 'REJECTED_LOCKED', action: 'lock', guard_conditions: { rejectCount: 3 }, side_effects: { events: ['order.locked'] } },
      { entity_type: 'SalesOrder', from_state: 'REJECTED_LOCKED', to_state: 'DRAFT', action: 'unlock', guard_conditions: { requireRole: ['SALES_DIRECTOR'] }, side_effects: { events: ['order.unlocked'] } },
      { entity_type: 'SalesOrder', from_state: 'APPROVED', to_state: 'SHIPPED', action: 'ship', guard_conditions: undefined, side_effects: { events: ['order.shipped'] } },
      { entity_type: 'SalesOrder', from_state: 'SHIPPED', to_state: 'COMPLETED', action: 'complete', guard_conditions: undefined, side_effects: { events: ['order.completed'] } },
      { entity_type: 'SalesOrder', from_state: 'DRAFT', to_state: 'CANCELLED', action: 'cancel', guard_conditions: undefined, side_effects: { events: ['order.cancelled'] } },
      // Recall Case
      { entity_type: 'RecallCase', from_state: 'DRAFT', to_state: 'PENDING_APPROVAL', action: 'submit', guard_conditions: undefined, side_effects: { events: ['recall.case_submitted'] } },
      { entity_type: 'RecallCase', from_state: 'PENDING_APPROVAL', to_state: 'APPROVED', action: 'approve', guard_conditions: undefined, side_effects: { events: ['recall.case_approved', 'recall.batch_locked'] } },
      { entity_type: 'RecallCase', from_state: 'PENDING_APPROVAL', to_state: 'REJECTED', action: 'reject', guard_conditions: undefined, side_effects: undefined },
      { entity_type: 'RecallCase', from_state: 'APPROVED', to_state: 'IN_PROGRESS', action: 'start', guard_conditions: undefined, side_effects: { events: ['recall.in_progress'] } },
      { entity_type: 'RecallCase', from_state: 'IN_PROGRESS', to_state: 'RESOLVED', action: 'resolve', guard_conditions: undefined, side_effects: { events: ['recall.resolved'] } },
      { entity_type: 'RecallCase', from_state: 'RESOLVED', to_state: 'CLOSED', action: 'close', guard_conditions: undefined, side_effects: { events: ['recall.case_closed'] } },
      { entity_type: 'RecallCase', from_state: 'CLOSED', to_state: 'PENDING_APPROVAL', action: 'reopen', guard_conditions: { requireRole: ['QA_DIRECTOR'] }, side_effects: { events: ['recall.case_reopened'] } },
      // Purchase Order
      { entity_type: 'PurchaseOrder', from_state: 'DRAFT', to_state: 'SUBMITTED', action: 'submit', guard_conditions: undefined, side_effects: undefined },
      { entity_type: 'PurchaseOrder', from_state: 'SUBMITTED', to_state: 'PENDING_APPROVAL', action: 'start_approval', guard_conditions: undefined, side_effects: undefined },
      { entity_type: 'PurchaseOrder', from_state: 'PENDING_APPROVAL', to_state: 'FINANCE_APPROVED', action: 'finance_approve', guard_conditions: undefined, side_effects: undefined },
      { entity_type: 'PurchaseOrder', from_state: 'FINANCE_APPROVED', to_state: 'GM_APPROVED', action: 'gm_approve', guard_conditions: { maxAmount: 100000 }, side_effects: undefined },
      { entity_type: 'PurchaseOrder', from_state: 'GM_APPROVED', to_state: 'APPROVED', action: 'ed_approve', guard_conditions: undefined, side_effects: { events: ['purchase.po_approved'] } },
      // Sample Request
      { entity_type: 'SampleRequest', from_state: 'DRAFT', to_state: 'PENDING_APPROVAL', action: 'submit', guard_conditions: undefined, side_effects: undefined },
      { entity_type: 'SampleRequest', from_state: 'PENDING_APPROVAL', to_state: 'APPROVED', action: 'approve', guard_conditions: undefined, side_effects: { events: ['sample.request_approved'] } },
      { entity_type: 'SampleRequest', from_state: 'APPROVED', to_state: 'SHIPPED', action: 'ship', guard_conditions: undefined, side_effects: { events: ['sample.shipped'] } },
      // Visit Record
      { entity_type: 'VisitRecord', from_state: 'PLANNED', to_state: 'CHECKED_IN', action: 'checkin', guard_conditions: undefined, side_effects: undefined },
      { entity_type: 'VisitRecord', from_state: 'CHECKED_IN', to_state: 'COMPLETED', action: 'complete', guard_conditions: undefined, side_effects: undefined },
      // Budget
      { entity_type: 'BudgetAdjustment', from_state: 'DRAFT', to_state: 'PENDING', action: 'submit', guard_conditions: undefined, side_effects: undefined },
      { entity_type: 'BudgetAdjustment', from_state: 'PENDING', to_state: 'APPROVED', action: 'approve', guard_conditions: undefined, side_effects: { events: ['financial.budget_adjusted'] } },
      { entity_type: 'BudgetAdjustment', from_state: 'PENDING', to_state: 'REJECTED', action: 'reject', guard_conditions: undefined, side_effects: undefined },
    ];

    for (const def of defaults) {
      const exists = await this.definitionRepo.findOne({
        where: { entity_type: def.entity_type, from_state: def.from_state, action: def.action },
      });
      if (!exists) {
        const entity = this.definitionRepo.create(def);
        entity.id = uuidv4();
        await this.definitionRepo.save(entity);
      }
    }
    this.definitionCache.clear();
    this.logger.log('State machine defaults seeded');
  }
}
