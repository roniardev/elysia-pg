-- Migration: Add Organization Hierarchy Support
-- Description: Adds parent-child relationship, path tracking, and hierarchy controls

-- Add hierarchy columns to organizations table
ALTER TABLE organizations
ADD COLUMN parent_organization_id VARCHAR(26) REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN organization_path VARCHAR(500),
ADD COLUMN level INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN inherit_permissions BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN isolated_data BOOLEAN DEFAULT false NOT NULL;

-- Add index for parent lookup (performance)
CREATE INDEX org_parent_idx ON organizations(parent_organization_id);

-- Add index for path-based queries (performance)
CREATE INDEX org_path_idx ON organizations(organization_path);

-- Add index for level-based queries
CREATE INDEX org_level_idx ON organizations(level);

-- Add constraint: organization cannot be its own parent
ALTER TABLE organizations
ADD CONSTRAINT org_not_self_parent
CHECK (id != parent_organization_id);
