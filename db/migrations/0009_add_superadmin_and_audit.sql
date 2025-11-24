-- Migration: Add Superadmin Role and Audit Logging
-- Description: Adds superadmin flag to users and comprehensive audit logging

-- Add superadmin columns to users table
ALTER TABLE users
ADD COLUMN is_superadmin BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN superadmin_granted_at TIMESTAMP,
ADD COLUMN superadmin_granted_by VARCHAR(26) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for superadmin lookups
CREATE INDEX users_is_superadmin_idx ON users(is_superadmin) WHERE is_superadmin = true;

-- Create superadmin_audit_logs table
CREATE TABLE superadmin_audit_logs (
    id VARCHAR(26) PRIMARY KEY,
    user_id VARCHAR(26) NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    performed_at TIMESTAMP DEFAULT NOW() NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(26) NOT NULL,
    bypassed_restrictions JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_metadata JSONB,
    data_before JSONB,
    data_after JSONB,
    justification TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for audit log queries (performance)
CREATE INDEX superadmin_audit_user_idx ON superadmin_audit_logs(user_id);
CREATE INDEX superadmin_audit_resource_idx ON superadmin_audit_logs(resource_type, resource_id);
CREATE INDEX superadmin_audit_time_idx ON superadmin_audit_logs(performed_at);
CREATE INDEX superadmin_audit_action_idx ON superadmin_audit_logs(action);

-- Update visibility enum for spatial_data (add new options)
ALTER TABLE spatial_data
DROP CONSTRAINT IF EXISTS spatial_data_visibility_check;

ALTER TABLE spatial_data
ADD CONSTRAINT spatial_data_visibility_check
CHECK (visibility IN ('public', 'private', 'organization', 'organization_tree', 'organization_parent'));

-- Update visibility column length
ALTER TABLE spatial_data
ALTER COLUMN visibility TYPE VARCHAR(20);

-- Update visibility enum for spatial_layers
ALTER TABLE spatial_layers
DROP CONSTRAINT IF EXISTS spatial_layers_visibility_check;

ALTER TABLE spatial_layers
ADD CONSTRAINT spatial_layers_visibility_check
CHECK (visibility IN ('public', 'private', 'organization', 'organization_tree', 'organization_parent'));

ALTER TABLE spatial_layers
ALTER COLUMN visibility TYPE VARCHAR(20);

-- Update visibility enum for spatial_maps
ALTER TABLE spatial_maps
DROP CONSTRAINT IF EXISTS spatial_maps_visibility_check;

ALTER TABLE spatial_maps
ADD CONSTRAINT spatial_maps_visibility_check
CHECK (visibility IN ('public', 'private', 'organization', 'organization_tree', 'organization_parent'));

ALTER TABLE spatial_maps
ALTER COLUMN visibility TYPE VARCHAR(20);
