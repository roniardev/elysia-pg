-- Migration: Add Checker-Maker-Signer (CMS) Workflow
-- Description: Adds approval workflow, tracking, and audit trail for spatial data

-- Add CMS workflow columns to spatial_data table
ALTER TABLE spatial_data
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'draft' NOT NULL,
ADD COLUMN maker_id VARCHAR(26),
ADD COLUMN checker_id VARCHAR(26),
ADD COLUMN signer_id VARCHAR(26),
ADD COLUMN checked_at TIMESTAMP,
ADD COLUMN signed_at TIMESTAMP,
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN rejected_by VARCHAR(26),
ADD COLUMN rejected_at TIMESTAMP;

-- Add approval status enum constraint
ALTER TABLE spatial_data
ADD CONSTRAINT spatial_data_approval_status_check
CHECK (approval_status IN ('draft', 'pending_check', 'pending_sign', 'approved', 'rejected', 'revision'));

-- Add foreign key constraints
ALTER TABLE spatial_data
ADD CONSTRAINT spatial_data_maker_fk FOREIGN KEY (maker_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT spatial_data_checker_fk FOREIGN KEY (checker_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT spatial_data_signer_fk FOREIGN KEY (signer_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT spatial_data_rejected_by_fk FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for workflow queries (performance)
CREATE INDEX spatial_data_approval_status_idx ON spatial_data(approval_status);
CREATE INDEX spatial_data_maker_idx ON spatial_data(maker_id);
CREATE INDEX spatial_data_checker_idx ON spatial_data(checker_id);
CREATE INDEX spatial_data_signer_idx ON spatial_data(signer_id);

-- Create spatial_data_approvals table for audit trail
CREATE TABLE spatial_data_approvals (
    id VARCHAR(26) PRIMARY KEY,
    spatial_data_id VARCHAR(26) NOT NULL REFERENCES spatial_data(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL,
    performed_by VARCHAR(26) NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    comments TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add action enum constraint
ALTER TABLE spatial_data_approvals
ADD CONSTRAINT spatial_data_approvals_action_check
CHECK (action IN ('create', 'update', 'delete', 'submit', 'check', 'sign', 'reject', 'revise', 'superadmin_force_approve'));

-- Add indexes for approval history queries
CREATE INDEX spatial_data_approvals_data_idx ON spatial_data_approvals(spatial_data_id);
CREATE INDEX spatial_data_approvals_performer_idx ON spatial_data_approvals(performed_by);
CREATE INDEX spatial_data_approvals_created_idx ON spatial_data_approvals(created_at);
CREATE INDEX spatial_data_approvals_action_idx ON spatial_data_approvals(action);

-- Add same columns to spatial_layers table
ALTER TABLE spatial_layers
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'draft' NOT NULL,
ADD COLUMN maker_id VARCHAR(26),
ADD COLUMN checker_id VARCHAR(26),
ADD COLUMN signer_id VARCHAR(26),
ADD COLUMN checked_at TIMESTAMP,
ADD COLUMN signed_at TIMESTAMP,
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN rejected_by VARCHAR(26),
ADD COLUMN rejected_at TIMESTAMP;

ALTER TABLE spatial_layers
ADD CONSTRAINT spatial_layers_approval_status_check
CHECK (approval_status IN ('draft', 'pending_check', 'pending_sign', 'approved', 'rejected', 'revision'));

ALTER TABLE spatial_layers
ADD CONSTRAINT spatial_layers_maker_fk FOREIGN KEY (maker_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT spatial_layers_checker_fk FOREIGN KEY (checker_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT spatial_layers_signer_fk FOREIGN KEY (signer_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT spatial_layers_rejected_by_fk FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX spatial_layers_approval_status_idx ON spatial_layers(approval_status);

-- Add same columns to spatial_maps table
ALTER TABLE spatial_maps
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'draft' NOT NULL,
ADD COLUMN maker_id VARCHAR(26),
ADD COLUMN checker_id VARCHAR(26),
ADD COLUMN signer_id VARCHAR(26),
ADD COLUMN checked_at TIMESTAMP,
ADD COLUMN signed_at TIMESTAMP,
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN rejected_by VARCHAR(26),
ADD COLUMN rejected_at TIMESTAMP;

ALTER TABLE spatial_maps
ADD CONSTRAINT spatial_maps_approval_status_check
CHECK (approval_status IN ('draft', 'pending_check', 'pending_sign', 'approved', 'rejected', 'revision'));

ALTER TABLE spatial_maps
ADD CONSTRAINT spatial_maps_maker_fk FOREIGN KEY (maker_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT spatial_maps_checker_fk FOREIGN KEY (checker_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT spatial_maps_signer_fk FOREIGN KEY (signer_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT spatial_maps_rejected_by_fk FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX spatial_maps_approval_status_idx ON spatial_maps(approval_status);
