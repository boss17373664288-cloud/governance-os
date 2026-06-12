
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class FieldPolicyInterceptor implements NestInterceptor {
  private cache = new Map<string, Map<string, string>>();
  private cacheTime = 0;

  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async getPolicies(): Promise<Map<string, Map<string, string>>> {
    if (Date.now() - this.cacheTime < 60000 && this.cache.size > 0) return this.cache;
    
    const rows = await this.em.query("SELECT role_code, entity_type, field_name, access_level FROM field_policy");
    const map = new Map<string, Map<string, string>>();
    for (const r of rows) {
      const key = r.role_code + ":" + r.entity_type;
      if (!map.has(key)) map.set(key, new Map());
      map.get(key)!.set(r.field_name, r.access_level);
    }
    this.cache = map;
    this.cacheTime = Date.now();
    return map;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.role_code) return next.handle();

    const entityType = this.detectEntityType(context);
    if (!entityType) return next.handle();

    return next.handle().pipe(
      switchMap(async (data) => {
        const policies = await this.getPolicies();
        const key = user.role_code + ":" + entityType;
        const fieldRules = policies.get(key);
        if (!fieldRules || fieldRules.size === 0) return data;
        return this.applyPolicies(data, fieldRules);
      })
    );
  }

  private detectEntityType(context: ExecutionContext): string | null {
    const path = context.switchToHttp().getRequest().path;
    // Skip export, print, and system endpoints
    if (path.includes('/export/') || path.includes('/print/')) return null;
    if (path.includes('/customers')) return 'customer';
    if (path.includes('/products')) return 'product';
    if (path.includes('/suppliers')) return 'supplier';
    if (path.includes('/sales-orders') || path.includes('/orders')) return 'sales_order';
    if (path.includes('/purchase')) return 'purchase_order';
    if (path.includes('/inventory') || path.includes('/batch')) return 'inventory';
    if (path.includes('/consignment')) return 'consignment';
    if (path.includes('/recall')) return 'recall';
    if (path.includes('/samples')) return 'sample';
    if (path.includes('/visits')) return 'visit';
    if (path.includes('/finance') || path.includes('/ar')) return 'finance';
    if (path.includes('/employees')) return 'employee';
    return null;
  }

  private applyPolicies(data: any, rules: Map<string, string>): any {
    if (!data || typeof data !== 'object') return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.applyPolicies(item, rules));
    }
    
    if (data.data && typeof data.data === 'object') {
      return { ...data, data: this.applyPolicies(data.data, rules) };
    }
    
    if (data.items && Array.isArray(data.items)) {
      return { ...data, items: this.applyPolicies(data.items, rules) };
    }
    
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      const accessLevel = rules.get(key);
      if (accessLevel === 'HIDDEN') continue;
      result[key] = value;
    }
    return result;
  }
}
