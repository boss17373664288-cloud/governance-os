-- ============================================
-- 主数据域: 客户 / 产品 / 供应商 / 仓库
-- ============================================

-- 10. 品牌系列表
CREATE TABLE product_brand_series (
    series_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name VARCHAR(100) NOT NULL,
    series_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_name, series_name)
);

-- 11. 产品主资料表
CREATE TABLE product_master (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    product_short_name VARCHAR(100),
    product_barcode VARCHAR(50),
    product_uid_code VARCHAR(100),
    product_category VARCHAR(30) NOT NULL,
    product_series VARCHAR(50),
    product_specification VARCHAR(100),
    medical_device_flag BOOLEAN DEFAULT FALSE,
    medical_device_class VARCHAR(10),
    medical_registration_no VARCHAR(100),
    registration_expiry_date DATE,
    recall_level VARCHAR(5) NOT NULL DEFAULT 'R1',
    qa_review_required BOOLEAN DEFAULT TRUE,
    expiration_days INT,
    base_price DECIMAL(18,2),
    minimum_price DECIMAL(18,2),
    brand_series_id UUID REFERENCES product_brand_series(series_id),
    import_source VARCHAR(50),
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_product_code ON product_master(product_code);
CREATE INDEX idx_product_barcode ON product_master(product_barcode);
CREATE INDEX idx_product_category ON product_master(product_category);
CREATE INDEX idx_product_tenant ON product_master(tenant_id);
CREATE INDEX idx_product_import ON product_master(import_source);

-- 12. 客户主资料表
CREATE TABLE customer_master (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(20) NOT NULL UNIQUE,
    old_erp_customer_code VARCHAR(20),
    customer_name VARCHAR(200) NOT NULL,
    customer_short_name VARCHAR(100) NOT NULL,
    customer_type VARCHAR(50) NOT NULL,
    customer_source VARCHAR(50),
    industry_type VARCHAR(50),
    unified_business_no VARCHAR(20),
    medical_institution_code VARCHAR(20),
    contact_person VARCHAR(50),
    contact_position VARCHAR(50),
    mobile_phone VARCHAR(20),
    contact_email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    website VARCHAR(200),
    email VARCHAR(100),
    company_zip_code VARCHAR(10) NOT NULL,
    company_address TEXT NOT NULL,
    business_hours_start TIME,
    business_hours_end TIME,
    payment_terms VARCHAR(20),
    closing_day INT,
    invoice_date INT,
    credit_days INT,
    credit_limit DECIMAL(18,2),
    credit_status VARCHAR(20) DEFAULT 'NORMAL',
    outstanding_ar DECIMAL(18,2) DEFAULT 0,
    consignment_balance INT DEFAULT 0,
    contract_signed BOOLEAN DEFAULT FALSE,
    allow_transaction BOOLEAN DEFAULT TRUE,
    pause_start_date DATE,
    owning_employee_id UUID REFERENCES employee_master(employee_id),
    region_code VARCHAR(20),
    customer_status VARCHAR(20) DEFAULT 'LEAD',
    total_sample_count INT DEFAULT 0,
    import_source VARCHAR(50),
    company_id UUID NOT NULL REFERENCES company(company_id),
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_customer_code ON customer_master(customer_code);
CREATE INDEX idx_customer_owner ON customer_master(owning_employee_id);
CREATE INDEX idx_customer_region ON customer_master(region_code);
CREATE INDEX idx_customer_status ON customer_master(customer_status);
CREATE INDEX idx_customer_company ON customer_master(company_id);
CREATE INDEX idx_customer_tenant ON customer_master(tenant_id);

-- 13. 客户联络人子表
CREATE TABLE customer_contact (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id) ON DELETE CASCADE,
    contact_name VARCHAR(50) NOT NULL,
    position VARCHAR(50),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    email VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_contact_customer ON customer_contact(customer_id);
CREATE INDEX idx_contact_primary ON customer_contact(customer_id, is_primary)
    WHERE is_primary = TRUE AND deleted_at IS NULL;

-- 14. 标签主表
CREATE TABLE tag_master (
    tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name VARCHAR(50) NOT NULL UNIQUE,
    tag_category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. 客户标签关联表
CREATE TABLE customer_tag (
    customer_id UUID REFERENCES customer_master(customer_id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tag_master(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (customer_id, tag_id)
);

-- 16. 仓库主表
CREATE TABLE warehouse_master (
    warehouse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_code VARCHAR(20) NOT NULL UNIQUE,
    warehouse_name VARCHAR(100) NOT NULL,
    warehouse_type VARCHAR(20) DEFAULT 'MAIN',
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 17. 供应商主表
CREATE TABLE supplier_master (
    supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(20) NOT NULL UNIQUE,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_short_name VARCHAR(100),
    tax_id VARCHAR(20),
    contact_person VARCHAR(50),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address TEXT,
    payment_terms VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_supplier_code ON supplier_master(supplier_code);
CREATE INDEX idx_supplier_active ON supplier_master(is_active);

