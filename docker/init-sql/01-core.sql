-- ============================================
-- 企业治理作业系统 - 完整数据库初始化脚本
-- 版本: V5.0 | 日期: 2026-06-06
-- 数据库: PostgreSQL 16
-- ============================================

-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. 公司表
-- ============================================
CREATE TABLE company (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_code VARCHAR(20) NOT NULL UNIQUE,
    company_name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 员工表
-- ============================================
CREATE TABLE employee_master (
    employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_no VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    region_code VARCHAR(20),
    tenant_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sos_status VARCHAR(20) DEFAULT 'NORMAL',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_employee_no ON employee_master(employee_no);
CREATE INDEX idx_employee_role ON employee_master(role_code);
CREATE INDEX idx_employee_region ON employee_master(region_code);
CREATE INDEX idx_employee_tenant ON employee_master(tenant_id);

-- ============================================
-- 3. 角色表
-- ============================================
CREATE TABLE role (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 权限表
-- ============================================
CREATE TABLE permission (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 角色权限关联表
-- ============================================
CREATE TABLE role_permission (
    role_id UUID NOT NULL REFERENCES role(role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permission(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================
-- 6. 字段级权限策略
-- ============================================
CREATE TABLE field_policy (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    access_level VARCHAR(20) NOT NULL DEFAULT 'READ',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_code, entity_type, field_name)
);

-- ============================================
-- 7. 数据隔离规则
-- ============================================
CREATE TABLE data_policy (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    condition_json JSONB NOT NULL,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. 设备绑定表
-- ============================================
CREATE TABLE device_binding (
    binding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee_master(employee_id),
    device_id VARCHAR(200) NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(20),
    platform VARCHAR(20),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, device_id)
);

CREATE INDEX idx_device_employee ON device_binding(employee_id);

-- ============================================
-- 9. 刷新令牌表
-- ============================================
CREATE TABLE refresh_token (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee_master(employee_id),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_id VARCHAR(200),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_token_employee ON refresh_token(employee_id);
CREATE INDEX idx_refresh_token_hash ON refresh_token(token_hash);

