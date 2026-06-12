-- Add new columns to employee_master
DO \$\$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS display_name VARCHAR(50);
EXCEPTION WHEN duplicate_column THEN NULL;
END \$\$;

DO \$\$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
EXCEPTION WHEN duplicate_column THEN NULL;
END \$\$;

DO \$\$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS job_title VARCHAR(50);
EXCEPTION WHEN duplicate_column THEN NULL;
END \$\$;

DO \$\$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS permission_version INT DEFAULT 1;
EXCEPTION WHEN duplicate_column THEN NULL;
END \$\$;

DO \$\$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END \$\$;

DO \$\$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS last_login_ip INET;
EXCEPTION WHEN duplicate_column THEN NULL;
END \$\$;

DO \$\$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS created_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END \$\$;

DO \$\$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS updated_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END \$\$;

DO \$\$ BEGIN
    ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
EXCEPTION WHEN duplicate_column THEN NULL;
END \$\$;

-- Create delegation table if not exists
CREATE TABLE IF NOT EXISTS delegation (
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
);
