import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async onModuleInit() {
    await this.runMigrations();
  }

  private async runMigrations() {
    const migrations = [
      // system_param
      `CREATE TABLE IF NOT EXISTS system_param (
        param_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        param_key VARCHAR(100) NOT NULL,
        param_value JSONB NOT NULL,
        param_type VARCHAR(20) DEFAULT 'STRING',
        description TEXT,
        is_editable BOOLEAN DEFAULT true,
        updated_by UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // customer_consignment_ledger
      `CREATE TABLE IF NOT EXISTS customer_consignment_ledger (
        ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL,
        product_id UUID NOT NULL,
        source_sales_order_id UUID NOT NULL,
        remaining_qty INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        last_release_date DATE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // ar_detail
      `CREATE TABLE IF NOT EXISTS ar_detail (
        ar_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        tenant_id UUID NOT NULL,
        amount NUMERIC NOT NULL,
        paid_amount NUMERIC DEFAULT 0,
        due_date DATE NOT NULL,
        snapshot_payment_terms VARCHAR(20),
        snapshot_closing_day INTEGER,
        snapshot_invoice_date INTEGER,
        snapshot_credit_days INTEGER,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_by UUID,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // purchase_order
      `CREATE TABLE IF NOT EXISTS purchase_order (
        po_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_no VARCHAR(30) NOT NULL,
        supplier_id UUID NOT NULL,
        order_date DATE NOT NULL,
        total_amount NUMERIC NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        is_emergency BOOLEAN DEFAULT false,
        approval_instance_id UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      )`,
      // purchase_order_item
      `CREATE TABLE IF NOT EXISTS purchase_order_item (
        item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC NOT NULL,
        received_quantity INTEGER DEFAULT 0,
        return_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // purchase_return
      `CREATE TABLE IF NOT EXISTS purchase_return (
        return_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_id UUID NOT NULL,
        receipt_id UUID,
        return_no VARCHAR(30) NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // goods_receipt
      `CREATE TABLE IF NOT EXISTS goods_receipt (
        receipt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_id UUID NOT NULL,
        receipt_no VARCHAR(30) NOT NULL,
        receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
        warehouse_staff_id UUID,
        qa_staff_id UUID,
        status VARCHAR(20) DEFAULT 'PENDING',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // account_applications
      `CREATE TABLE IF NOT EXISTS account_applications (
        application_id UUID PRIMARY KEY,
        applicant_name VARCHAR(100) NOT NULL,
        applicant_email VARCHAR(200) NOT NULL,
        applicant_phone VARCHAR(30),
        company_name VARCHAR(200),
        department VARCHAR(100),
        reason TEXT,
        status VARCHAR(20) DEFAULT 'PENDING',
        reviewer_id UUID,
        review_comment TEXT,
        created_employee_id UUID,
        tenant_id VARCHAR(50) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // device_binding
      `CREATE TABLE IF NOT EXISTS device_binding (
        binding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL,
        device_id VARCHAR(200) NOT NULL,
        device_name VARCHAR(100),
        device_type VARCHAR(20),
        platform VARCHAR(20),
        last_login_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // budget_plan
      `CREATE TABLE IF NOT EXISTS budget_plan (
        budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        budget_year INTEGER NOT NULL,
        budget_month INTEGER,
        department VARCHAR(100),
        project_id UUID,
        expense_type VARCHAR(50),
        planned_amount NUMERIC NOT NULL,
        committed_amount NUMERIC DEFAULT 0,
        spent_amount NUMERIC DEFAULT 0,
        overrun_policy VARCHAR(20) DEFAULT 'BLOCK',
        tenant_id VARCHAR(50) DEFAULT '00000000-0000-0000-0000-000000000001',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // budget_adjustment
      `CREATE TABLE IF NOT EXISTS budget_adjustment (
        adjust_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        budget_id UUID NOT NULL,
        from_po_id UUID,
        amount NUMERIC NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_by UUID,
        approved_by UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // payment_record
      `CREATE TABLE IF NOT EXISTS payment_record (
        payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ar_id UUID NOT NULL,
        amount NUMERIC NOT NULL,
        reference_no VARCHAR(50),
        paid_by UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // department
      `CREATE TABLE IF NOT EXISTS department (
        department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        department_code VARCHAR(20) NOT NULL,
        department_name VARCHAR(100) NOT NULL,
        department_type VARCHAR(20) NOT NULL,
        parent_department_id UUID,
        company_id UUID NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      )`,
      // delegation
      `CREATE TABLE IF NOT EXISTS delegation (
        delegation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        delegator_id UUID NOT NULL,
        delegate_id UUID NOT NULL,
        role_code VARCHAR(50) NOT NULL,
        scope_type VARCHAR(20),
        scope_value VARCHAR(100),
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        reason TEXT,
        granted_by UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // sos_event
      `CREATE TABLE IF NOT EXISTS sos_event (
        event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL,
        gps_latitude DOUBLE PRECISION,
        gps_longitude DOUBLE PRECISION,
        triggered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        resolved_by UUID,
        resolved_at TIMESTAMPTZ,
        notes TEXT
      )`,
      // domain_events
      `CREATE TABLE IF NOT EXISTS domain_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(64) NOT NULL,
        event_type VARCHAR(128) NOT NULL,
        aggregate_id VARCHAR(64) NOT NULL,
        aggregate_type VARCHAR(64) NOT NULL,
        data JSONB NOT NULL,
        metadata JSONB,
        status VARCHAR(20) DEFAULT 'PENDING',
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMPTZ
      )`,
      // enum_value
      `CREATE TABLE IF NOT EXISTS enum_value (
        enum_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enum_type VARCHAR(50) NOT NULL,
        enum_code VARCHAR(50) NOT NULL,
        enum_label VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // petty_cash
      `CREATE TABLE IF NOT EXISTS petty_cash (
        pc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME','EXPENSE')),
        amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        category VARCHAR(30) NOT NULL DEFAULT '雜項',
        description TEXT,
        running_balance NUMERIC(12,2) DEFAULT 0,
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // bank_statement
      `CREATE TABLE IF NOT EXISTS bank_statement (
        statement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_date DATE NOT NULL,
        description TEXT,
        bank_reference VARCHAR(100),
        type VARCHAR(10) NOT NULL CHECK (type IN ('DEPOSIT','WITHDRAWAL')),
        amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        is_reconciled BOOLEAN DEFAULT false,
        matched_entry_id UUID,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      // reservation
      `CREATE TABLE IF NOT EXISTS reservation (
        reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL,
        order_id UUID NOT NULL,
        order_item_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        expiry_time TIMESTAMP NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const sql of migrations) {
      try {
        await this.em.query(sql);
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || "unknown";
        this.logger.log(`Table ensured: ${tableName}`);
      } catch (e: any) {
        this.logger.error(`Migration failed: ${e.message}`);
      }
    }

    // Add missing columns
    const columns = [
      `ALTER TABLE visit ADD COLUMN IF NOT EXISTS scheduled_time TIME`,
      `ALTER TABLE visit ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMPTZ`,
      `ALTER TABLE visit ADD COLUMN IF NOT EXISTS checkout_time TIMESTAMPTZ`,
      `ALTER TABLE visit ADD COLUMN IF NOT EXISTS gps_latitude DOUBLE PRECISION`,
      `ALTER TABLE visit ADD COLUMN IF NOT EXISTS gps_longitude DOUBLE PRECISION`,
    ];

    for (const sql of columns) {
      try {
        await this.em.query(sql);
        this.logger.log(`Column ensured: ${sql.substring(0, 60)}...`);
      } catch (e: any) {
        this.logger.error(`Column migration failed: ${e.message}`);
      }
    }

    
    // Fix UUID vs VARCHAR type mismatches
    const typeFixes = [
      // Convert product_master.product_id from VARCHAR to UUID
      `ALTER TABLE product_master ALTER COLUMN product_id TYPE UUID USING product_id::UUID`,
      // Convert employee_master.employee_id from VARCHAR to UUID  
      `ALTER TABLE employee_master ALTER COLUMN employee_id TYPE UUID USING employee_id::UUID`,
      // Convert customer_master.customer_id if needed
      `ALTER TABLE customer_master ALTER COLUMN customer_id TYPE UUID USING customer_id::UUID`,
      // Convert supplier_master.supplier_id if needed
      `ALTER TABLE supplier_master ALTER COLUMN supplier_id TYPE UUID USING supplier_id::UUID`,
      // Convert batch_master.product_id if needed
      `ALTER TABLE batch_master ALTER COLUMN product_id TYPE UUID USING product_id::UUID`,
      // Convert sales_order.customer_id if needed
      `ALTER TABLE sales_order ALTER COLUMN customer_id TYPE UUID USING customer_id::UUID`,

    // Add customer address recipient fields
    `ALTER TABLE customer_master ADD COLUMN IF NOT EXISTS shipping_address TEXT`,
    `ALTER TABLE customer_master ADD COLUMN IF NOT EXISTS shipping_recipient VARCHAR(50)`,
    `ALTER TABLE customer_master ADD COLUMN IF NOT EXISTS shipping_recipient_phone VARCHAR(30)`,
    `ALTER TABLE customer_master ADD COLUMN IF NOT EXISTS billing_address TEXT`,
    `ALTER TABLE customer_master ADD COLUMN IF NOT EXISTS billing_recipient VARCHAR(50)`,
    `ALTER TABLE customer_master ADD COLUMN IF NOT EXISTS billing_recipient_phone VARCHAR(30)`,
    `ALTER TABLE customer_master ADD COLUMN IF NOT EXISTS invoice_remark TEXT`,
      // Convert device_binding.employee_id if needed
      `ALTER TABLE device_binding ALTER COLUMN employee_id TYPE UUID USING employee_id::UUID`,
    ];

    for (const sql of typeFixes) {
      try {
        await this.em.query(sql);
        this.logger.log(`Type fix applied`);
      } catch (e: any) {
        // Already correct type or conversion failed - not fatal
        this.logger.warn(`Type fix skipped (may already be correct): ${e.message?.substring(0, 80)}`);
      }
    }
    
    // Seed system params
    const seeds = [
      `INSERT INTO system_param (param_key, param_value, param_type, description) 
       VALUES ('consignment_stale_days', '"90"', 'NUMBER', '寄庫產品過期天數警示閾值')
       ON CONFLICT (param_key) DO NOTHING`,
    ];

    for (const sql of seeds) {
      try {
        await this.em.query(sql);
        this.logger.log("Seed data inserted");
      } catch (e: any) {
        this.logger.warn("Seed skipped: " + e.message?.substring(0, 80));
      }
    }

    
    // Ensure audit_log table
    try {
      await this.em.query(`CREATE TABLE IF NOT EXISTS audit_log (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action VARCHAR(100),
        entity_type VARCHAR(50),
        entity_id UUID,
        old_value JSONB,
        new_value JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`);
      this.logger.log("audit_log table ensured");
    } catch (e: any) {
      this.logger.warn("audit_log table skipped: " + e.message?.substring(0, 80));
    }
    this.logger.log("All migrations completed");
  }
}