-- Department table
CREATE TABLE IF NOT EXISTS department (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(20) NOT NULL UNIQUE,
    department_name VARCHAR(100) NOT NULL,
    department_type VARCHAR(20) NOT NULL,
    parent_department_id UUID REFERENCES department(department_id),
    company_id UUID NOT NULL REFERENCES company(company_id),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Role table
CREATE TABLE IF NOT EXISTS role (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Permission table
CREATE TABLE IF NOT EXISTS permission (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(50) NOT NULL UNIQUE,
    permission_name VARCHAR(100) NOT NULL,
    resource_code VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS role_permission (
    role_id UUID REFERENCES role(role_id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permission(permission_id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- User-Role mapping
CREATE TABLE IF NOT EXISTS user_role (
    user_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    scope_type VARCHAR(20),
    scope_value VARCHAR(100),
    granted_by UUID,
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_code)
);

-- Employee-Position mapping
CREATE TABLE IF NOT EXISTS employee_position (
    employee_id UUID REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    position_code VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (employee_id, position_code)
);

-- Delegation table
CREATE TABLE IF NOT EXISTS delegation (
    delegation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_id UUID NOT NULL,
    delegate_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    scope_type VARCHAR(20),
    scope_value VARCHAR(100),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT ''ACTIVE'',
    reason TEXT,
    granted_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to employee_master (IF NOT EXISTS pattern for PG)
DO $$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS display_name VARCHAR(50);
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS job_title VARCHAR(50);
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS permission_version INT DEFAULT 1;
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS last_login_ip INET;
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS created_by UUID;
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS updated_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Ensure status column exists
DO $$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT ''ACTIVE'';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Migrate is_active to status if status is empty
UPDATE employee_master SET status = CASE WHEN is_active THEN ''ACTIVE'' ELSE ''TERMINATED'' END WHERE status IS NULL OR status = '''';
