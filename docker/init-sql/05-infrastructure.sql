-- ============================================
-- 基础设施域: 打印 / 导入 / 通知 / 系统参数
-- ============================================

-- 42. 打印模板表
CREATE TABLE print_template (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    template_code VARCHAR(50) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    paper_format_id UUID,
    html_content TEXT NOT NULL,
    is_multi_part BOOLEAN DEFAULT FALSE,
    part_total INT DEFAULT 1,
    part_index INT DEFAULT 1,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, template_code, part_index)
);

-- 43. 纸张格式表
CREATE TABLE paper_format (
    paper_format_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    format_code VARCHAR(50) NOT NULL UNIQUE,
    format_name VARCHAR(100) NOT NULL,
    width_mm DECIMAL(10,2) NOT NULL,
    height_mm DECIMAL(10,2) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 44. 打印任务表
CREATE TABLE print_job (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES print_template(template_id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    output_url TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    error_message TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_print_entity ON print_job(entity_type, entity_id);

-- 45. 导入任务表
CREATE TABLE import_task (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(200) NOT NULL,
    file_url TEXT,
    import_mode VARCHAR(20) DEFAULT 'INSERT',
    error_strategy VARCHAR(20) DEFAULT 'SKIP',
    status VARCHAR(20) DEFAULT 'PENDING',
    total_rows INT DEFAULT 0,
    success_rows INT DEFAULT 0,
    failed_rows INT DEFAULT 0,
    error_report_url TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_import_entity ON import_task(entity_type);
CREATE INDEX idx_import_status ON import_task(status);
CREATE INDEX idx_import_uploader ON import_task(uploaded_by);

-- 46. 系统参数表
CREATE TABLE system_param (
    param_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    param_key VARCHAR(100) NOT NULL UNIQUE,
    param_value JSONB NOT NULL,
    param_type VARCHAR(20) DEFAULT 'STRING',
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 47. 动态枚举表
CREATE TABLE enum_value (
    enum_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enum_type VARCHAR(50) NOT NULL,
    enum_code VARCHAR(50) NOT NULL,
    enum_label VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enum_type, enum_code)
);

CREATE INDEX idx_enum_type ON enum_value(enum_type);

-- 48. 站内通知表
CREATE TABLE notification (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES employee_master(employee_id),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    link_url VARCHAR(500),
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_recipient ON notification(recipient_id, is_read);
CREATE INDEX idx_notif_created ON notification(created_at);

-- 49. 推播设备令牌表
CREATE TABLE push_token (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee_master(employee_id),
    device_token VARCHAR(500) NOT NULL,
    platform VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, device_token)
);

CREATE INDEX idx_push_employee ON push_token(employee_id);

-- 50. 客户价格等级表
CREATE TABLE customer_price_level (
    price_level_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_status VARCHAR(20) NOT NULL,
    product_id UUID NOT NULL REFERENCES product_master(product_id),
    price DECIMAL(18,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_status, product_id)
);

-- ============================================
-- 创建分区表默认分区 (按月)
-- ============================================
CREATE TABLE inventory_ledger_default PARTITION OF inventory_ledger DEFAULT;
CREATE TABLE audit_log_default PARTITION OF audit_log DEFAULT;
CREATE TABLE timeline_default PARTITION OF timeline DEFAULT;

