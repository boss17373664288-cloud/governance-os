-- ============================================
-- 治理域: 审计 / 事件 / 状态机 / 审批 / 预算 / 打印 / OCR / SOS
-- ============================================

-- 29. 审计日志表 (分区)
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID,
    user_id UUID NOT NULL,
    user_name VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- 30. 时间轴表 (分区)
CREATE TABLE timeline (
    timeline_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    operator VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_timeline_entity ON timeline(entity_type, entity_id);
CREATE INDEX idx_timeline_created ON timeline(created_at);

-- 31. 领域事件表
CREATE TABLE domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(64) NOT NULL UNIQUE,
    event_type VARCHAR(128) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_events_status ON domain_events(status);
CREATE INDEX idx_events_aggregate ON domain_events(aggregate_type, aggregate_id);

-- 32. 状态机定义表
CREATE TABLE state_machine_definition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(64) NOT NULL,
    from_state VARCHAR(64) NOT NULL,
    to_state VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    guard_conditions JSONB,
    side_effects JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(entity_type, from_state, action)
);

-- 33. 状态机日志表
CREATE TABLE state_machine_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    from_state VARCHAR(64),
    to_state VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    user_id UUID NOT NULL,
    context JSONB,
    occurred_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sml_entity ON state_machine_log(entity_type, entity_id);

-- 34. 审批实例表
CREATE TABLE approval_instance (
    instance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    workflow_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    current_step_index INT DEFAULT 0,
    total_steps INT NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approval_entity ON approval_instance(entity_type, entity_id);

-- 35. 审批步骤表
CREATE TABLE approval_step (
    step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES approval_instance(instance_id),
    step_index INT NOT NULL,
    approver_role VARCHAR(50) NOT NULL,
    approver_id UUID,
    status VARCHAR(20) DEFAULT 'PENDING',
    comment TEXT,
    decided_at TIMESTAMPTZ,
    escalated_at TIMESTAMPTZ,
    timeout_hours INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instance_id, step_index)
);

CREATE INDEX idx_step_instance ON approval_step(instance_id);

-- 36. 审批工作流定义表
CREATE TABLE workflow_definition (
    workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code VARCHAR(50) NOT NULL UNIQUE,
    workflow_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    steps JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 37. 预算计划表
CREATE TABLE budget_plan (
    budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_year INT NOT NULL,
    budget_month INT,
    department VARCHAR(100),
    project_id UUID,
    expense_type VARCHAR(50),
    planned_amount DECIMAL(18,2) NOT NULL,
    committed_amount DECIMAL(18,2) DEFAULT 0,
    spent_amount DECIMAL(18,2) DEFAULT 0,
    overrun_policy VARCHAR(20) DEFAULT 'BLOCK',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budget_year ON budget_plan(budget_year);
CREATE INDEX idx_budget_dept ON budget_plan(department);

-- 38. 预算调整申请表
CREATE TABLE budget_adjustment (
    adjustment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budget_plan(budget_id),
    adjustment_type VARCHAR(20) NOT NULL,
    adjustment_amount DECIMAL(18,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    approval_instance_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 39. OCR记录表
CREATE TABLE ocr_record (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type VARCHAR(50) NOT NULL,
    source_image_url TEXT,
    raw_ocr_result JSONB,
    structured_data JSONB,
    created_draft_id VARCHAR(100),
    created_by UUID,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 40. SOS事件表
CREATE TABLE sos_event (
    sos_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee_master(employee_id),
    trigger_method VARCHAR(20) NOT NULL,
    gps_latitude DECIMAL(10,7),
    gps_longitude DECIMAL(10,7),
    device_info JSONB,
    ip_address VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sos_employee ON sos_event(employee_id);
CREATE INDEX idx_sos_status ON sos_event(status);

-- 41. 拜访记录表
CREATE TABLE visit_record (
    visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id),
    employee_id UUID NOT NULL REFERENCES employee_master(employee_id),
    visit_date DATE NOT NULL,
    visit_type VARCHAR(30),
    visit_purpose VARCHAR(50),
    checkin_time TIMESTAMPTZ,
    checkout_time TIMESTAMPTZ,
    checkin_gps_lat DECIMAL(10,7),
    checkin_gps_lng DECIMAL(10,7),
    result_code VARCHAR(30),
    notes TEXT,
    supervisor_feedback TEXT,
    next_action VARCHAR(100),
    next_followup_date DATE,
    is_supplement BOOLEAN DEFAULT FALSE,
    supplement_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visit_customer ON visit_record(customer_id);
CREATE INDEX idx_visit_employee ON visit_record(employee_id);
CREATE INDEX idx_visit_date ON visit_record(visit_date);

