-- ============================================
-- 业务操作域: 库存 / 订单 / 寄库 / 采购 / 召回
-- ============================================

-- 18. 批次主表
CREATE TABLE batch_master (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_no VARCHAR(50) NOT NULL,
    product_id UUID NOT NULL REFERENCES product_master(product_id),
    production_date DATE,
    expiry_date DATE NOT NULL,
    manufacturer VARCHAR(200),
    qa_status VARCHAR(20) DEFAULT 'PENDING',
    recall_status VARCHAR(20) DEFAULT 'NORMAL',
    total_quantity INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, batch_no)
);

CREATE INDEX idx_batch_product ON batch_master(product_id);
CREATE INDEX idx_batch_expiry ON batch_master(expiry_date);
CREATE INDEX idx_batch_qa ON batch_master(qa_status);
CREATE INDEX idx_batch_recall ON batch_master(recall_status);

-- 19. 库存帐本表 (分区表)
CREATE TABLE inventory_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES product_master(product_id),
    batch_id UUID REFERENCES batch_master(batch_id),
    warehouse_id UUID NOT NULL REFERENCES warehouse_master(warehouse_id),
    event_type VARCHAR(30) NOT NULL,
    quantity_delta INT NOT NULL,
    balance_after INT NOT NULL,
    source_type VARCHAR(50),
    source_id UUID,
    trace_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_ledger_product ON inventory_ledger(product_id);
CREATE INDEX idx_ledger_batch ON inventory_ledger(batch_id);
CREATE INDEX idx_ledger_created ON inventory_ledger(created_at);
CREATE INDEX idx_ledger_trace ON inventory_ledger(trace_id);

-- 20. 库存预留表
CREATE TABLE reservation (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batch_master(batch_id),
    order_id UUID NOT NULL,
    order_item_id UUID NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expiry_time TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservation_batch ON reservation(batch_id);
CREATE INDEX idx_reservation_order ON reservation(order_id);
CREATE INDEX idx_reservation_status ON reservation(status);
CREATE INDEX idx_reservation_expiry ON reservation(expiry_time) WHERE status = 'ACTIVE';

-- 21. 销售订单表
CREATE TABLE sales_order (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(30) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id),
    order_date DATE NOT NULL,
    total_amount DECIMAL(18,2) NOT NULL,
    total_cost DECIMAL(18,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    reject_count INT DEFAULT 0,
    approval_instance_id UUID,
    is_historical BOOLEAN DEFAULT FALSE,
    original_order_no VARCHAR(50),
    internal_order_no VARCHAR(50),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_so_customer ON sales_order(customer_id);
CREATE INDEX idx_so_status ON sales_order(status);
CREATE INDEX idx_so_date ON sales_order(order_date);

-- 22. 销售订单明细表
CREATE TABLE sales_order_item (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES sales_order(order_id),
    product_id UUID NOT NULL REFERENCES product_master(product_id),
    quantity INT NOT NULL,
    immediate_ship_quantity INT NOT NULL DEFAULT 0,
    consignment_quantity INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(18,2) NOT NULL,
    allocated_batch_no VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_soi_order ON sales_order_item(order_id);
CREATE INDEX idx_soi_product ON sales_order_item(product_id);

-- 23. 寄库台帐表
CREATE TABLE customer_consignment_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id),
    product_id UUID NOT NULL REFERENCES product_master(product_id),
    source_sales_order_id UUID NOT NULL,
    remaining_qty INT NOT NULL CHECK (remaining_qty >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_release_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consignment_customer ON customer_consignment_ledger(customer_id);
CREATE INDEX idx_consignment_product ON customer_consignment_ledger(product_id);
CREATE INDEX idx_consignment_status ON customer_consignment_ledger(status);

-- 24. 应收明细表
CREATE TABLE ar_detail (
    ar_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES sales_order(order_id),
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id),
    tenant_id UUID NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    paid_amount DECIMAL(18,2) DEFAULT 0,
    due_date DATE NOT NULL,
    snapshot_payment_terms VARCHAR(20),
    snapshot_closing_day INT,
    snapshot_invoice_date INT,
    snapshot_credit_days INT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ar_customer ON ar_detail(customer_id);
CREATE INDEX idx_ar_order ON ar_detail(order_id);
CREATE INDEX idx_ar_due_date ON ar_detail(due_date) WHERE status != 'PAID';
CREATE INDEX idx_ar_status ON ar_detail(status);

-- 25. 采购订单表
CREATE TABLE purchase_order (
    po_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_no VARCHAR(30) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES supplier_master(supplier_id),
    order_date DATE NOT NULL,
    total_amount DECIMAL(18,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    is_emergency BOOLEAN DEFAULT FALSE,
    approval_instance_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_po_supplier ON purchase_order(supplier_id);
CREATE INDEX idx_po_status ON purchase_order(status);

-- 26. 采购订单明细表
CREATE TABLE purchase_order_item (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_order(po_id),
    product_id UUID NOT NULL REFERENCES product_master(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    received_quantity INT DEFAULT 0,
    return_quantity INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_poi_order ON purchase_order_item(po_id);

-- 27. 召回案件表
CREATE TABLE recall_case (
    recall_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recall_no VARCHAR(30) NOT NULL UNIQUE,
    recall_level VARCHAR(5) NOT NULL,
    product_id UUID NOT NULL REFERENCES product_master(product_id),
    batch_no VARCHAR(50) NOT NULL,
    description TEXT,
    discovery_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    approval_instance_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ
);

CREATE INDEX idx_recall_product ON recall_case(product_id);
CREATE INDEX idx_recall_status ON recall_case(status);

-- 28. 打板申请表
CREATE TABLE sample_request (
    sample_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_no VARCHAR(30) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id),
    product_id UUID NOT NULL REFERENCES product_master(product_id),
    quantity INT NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    feedback_result VARCHAR(20),
    feedback_date DATE,
    convert_to_order BOOLEAN DEFAULT FALSE,
    previous_customer_status VARCHAR(20),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sample_customer ON sample_request(customer_id);
CREATE INDEX idx_sample_status ON sample_request(status);

