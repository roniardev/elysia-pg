# 🏢 Organization Hierarchy + CMS Workflow + Superadmin Implementation

Implementasi lengkap untuk:
1. **Organization Hierarchy** - Struktur hierarki organisasi (Company → Division → Department → Team)
2. **Checker-Maker-Signer (CMS) Workflow** - Approval workflow untuk spatial data
3. **Superadmin System** - Role superadmin dengan audit logging

---

## 📋 Table of Contents

- [Organization Hierarchy](#organization-hierarchy)
- [CMS Workflow](#cms-workflow)
- [Superadmin System](#superadmin-system)
- [Visibility System](#visibility-system)
- [Security & Access Control](#security--access-control)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)

---

## 🏢 Organization Hierarchy

### Overview

Mendukung struktur organisasi multi-level dengan parent-child relationship.

### Contoh Struktur

```
ACME (Company)
├── FINANCE (Division)
│   └── TREASURY (Department)
└── RND (Division)
    ├── R&D LAB (Sub-division)
    └── INNOVATION (Sub-division)
```

### Database Fields

**Table: `organizations`**
- `parent_organization_id` - ID parent organization
- `organization_path` - Path materialized (e.g., "/ACME/FINANCE/TREASURY")
- `level` - Depth level (0 = root, 1 = division, etc.)
- `inherit_permissions` - Boolean untuk inherit permissions dari parent
- `isolated_data` - Boolean untuk isolasi data dari parent

### Utility Functions

```typescript
// Get all ancestor organizations (child → parent → grandparent)
await getAncestorOrganizations(organizationId: string): Promise<string[]>

// Get all descendant organizations (parent → children → grandchildren)
await getDescendantOrganizations(organizationId: string): Promise<string[]>

// Get full organization tree
await getOrganizationTree(rootId: string): Promise<OrganizationTree>

// Check if org A is ancestor of org B
await isAncestorOf(ancestorId: string, descendantId: string): Promise<boolean>
```

---

## 🔄 CMS Workflow (Checker-Maker-Signer)

### Workflow States

```
draft → pending_check → pending_sign → approved
  ↓           ↓              ↓
revision ←----+------←-------+
  ↓
rejected
```

### Approval Status

| Status | Description | Who Can Edit | Next Action |
|--------|-------------|--------------|-------------|
| `draft` | Dibuat oleh Maker | Maker | Submit for check |
| `pending_check` | Menunggu Checker | Checker | Approve/Reject |
| `pending_sign` | Menunggu Signer | Signer | Sign/Reject |
| `approved` | Fully approved | - | Final state |
| `rejected` | Ditolak | - | Final state |
| `revision` | Perlu revisi | Maker | Back to draft |

### Roles & Permissions

| Role | Can Do | Constraints |
|------|--------|-------------|
| **Maker** | Create, Submit | Cannot approve own data |
| **Checker** | Review, Approve to Sign | Cannot be the Maker |
| **Signer** | Final Approval | Cannot be Maker or Checker |

### Database Fields

**Table: `spatial_data`**
- `approval_status` - Current workflow status
- `maker_id` - Who created
- `checker_id` - Who checked
- `signer_id` - Who signed
- `checked_at`, `signed_at`, `approved_at` - Timestamps
- `rejection_reason` - Why rejected
- `rejected_by`, `rejected_at` - Rejection tracking

**Table: `spatial_data_approvals`** (Audit Trail)
- `spatial_data_id` - Data reference
- `action` - What action (submit, check, sign, reject)
- `performed_by` - Who performed
- `from_status` → `to_status` - State transition
- `comments` - Optional comments
- `metadata` - Additional data

### API Workflow

#### 1. Maker: Submit for Check

```bash
POST /spatial-data/:id/submit-for-check
Headers: { Authorization: "Bearer <token>" }

# Response
{
  "status": true,
  "message": "Submitted for check"
}
```

#### 2. Checker: Review Data

```bash
POST /spatial-data/:id/check
Headers: { Authorization: "Bearer <token>" }
Body: {
  "approved": true,
  "comments": "Data verified, looks good"
}

# Response
{
  "status": true,
  "message": "Data checked and forwarded for signing"
}
```

#### 3. Signer: Final Approval

```bash
POST /spatial-data/:id/sign
Headers: { Authorization: "Bearer <token>" }
Body: {
  "approved": true,
  "comments": "Approved for production"
}

# Response
{
  "status": true,
  "message": "Data signed and approved"
}
```

### Workflow Validations

**4-Eyes Principle:**
- ✅ Checker ≠ Maker
- ✅ Signer ≠ Maker
- ✅ Signer ≠ Checker

**Status Validation:**
- ✅ Can only submit from `draft`
- ✅ Can only check from `pending_check`
- ✅ Can only sign from `pending_sign`

**Permission Validation:**
- ✅ Requires `check:spatial-data` permission
- ✅ Requires `sign:spatial-data` permission

---

## 👑 Superadmin System

### Overview

Superadmin dapat bypass semua restrictions dengan full audit logging.

### Database Fields

**Table: `users`**
- `is_superadmin` - Boolean superadmin flag
- `superadmin_granted_at` - When granted
- `superadmin_granted_by` - Who granted (another superadmin)

**Table: `superadmin_audit_logs`**
- `user_id` - Superadmin yang melakukan action
- `action` - Action performed
- `resource_type`, `resource_id` - What resource
- `bypassed_restrictions` - List of restrictions bypassed
- `data_before`, `data_after` - State changes
- `justification` - Why bypass was needed
- `ip_address`, `user_agent` - Request metadata

### Superadmin Capabilities

| Action | Bypass | Audited | Justification Required |
|--------|--------|---------|------------------------|
| View all data | ✅ | ✅ | ❌ |
| Edit any data | ✅ | ✅ | ✅ |
| Delete any data | ✅ | ✅ | ✅ |
| Force approve | ✅ | ✅ | ✅ |
| Grant/Revoke superadmin | ✅ | ✅✅ | ✅ |

### Superadmin Operations

```typescript
// Force approve (bypass CMS workflow)
await superadminForceApprove(
  spatialDataId: string,
  superadminId: string,
  justification: string
)

// Grant superadmin to user
await grantSuperadmin(
  targetUserId: string,
  grantedBy: string,
  justification: string
)

// Revoke superadmin
await revokeSuperadmin(
  targetUserId: string,
  revokedBy: string,
  justification: string
)
```

### Audit Logging

Every superadmin action is logged:

```typescript
await logSuperadminAction({
  userId: "01HXE8K9...",
  action: "superadmin_force_approve",
  resourceType: "spatial_data",
  resourceId: "01HXE8K9...",
  bypassedRestrictions: ["cms_workflow", "4_eyes_principle"],
  dataBefore: { approvalStatus: "draft" },
  dataAfter: { approvalStatus: "approved" },
  justification: "Emergency production fix #1234",
})
```

---

## 🔐 Visibility System

### Visibility Levels

| Level | Description | Example Use Case |
|-------|-------------|------------------|
| `public` | Visible to ALL users | Tourist attractions, public landmarks |
| `private` | Only creator can see | Personal locations |
| `organization` | Current organization only | Department-specific data |
| `organization_tree` | Org + all child orgs | Company-wide data visible to divisions |
| `organization_parent` | Org + all parent orgs | Division data visible to company |

### Example Scenarios

```typescript
// Scenario 1: Company-wide announcement
{
  name: "ACME HQ Location",
  organizationId: "ACME",
  visibility: "organization_tree" // All divisions can see
}

// Scenario 2: Finance division only
{
  name: "Finance Office",
  organizationId: "FINANCE",
  visibility: "organization" // Only FINANCE members
}

// Scenario 3: Treasury inherits from Finance
{
  name: "Finance Budget Data",
  organizationId: "FINANCE",
  visibility: "organization_tree" // TREASURY can see (child of FINANCE)
}
```

---

## 🛡️ Security & Access Control

### Access Control Flow

```typescript
// 1. Check if superadmin (bypass all)
if (isSuperadmin) {
  logSuperadminAction(...)
  return ALLOW
}

// 2. Check ownership (for private data)
if (isOwner && visibility === "private") {
  return ALLOW
}

// 3. Check public access
if (visibility === "public" && action === "read") {
  return ALLOW
}

// 4. Check organization hierarchy
if (visibility === "organization") {
  if (userOrgIds.includes(dataOrgId)) {
    if (approvalStatus === "approved" || isInWorkflow || isAdmin) {
      return ALLOW
    }
  }
}

// 5. Check organization tree
if (visibility === "organization_tree") {
  const treeOrgIds = await getDescendantOrganizations(dataOrgId)
  if (userOrgIds.some(id => treeOrgIds.includes(id))) {
    // ... check approval status
    return ALLOW
  }
}

// 6. Check organization parent
if (visibility === "organization_parent") {
  const ancestors = await getAncestorOrganizations(dataOrgId)
  if (userOrgIds.some(id => ancestors.includes(id) || id === dataOrgId)) {
    // ... check approval status
    return ALLOW
  }
}

// 7. Default: DENY
return DENY
```

### Approval Status Visibility

- ✅ **approved** data: Visible to all members (based on visibility level)
- ⚠️ **pending** data: Only visible to Maker, Checker, Signer, and Org Admins
- ❌ **draft/revision** data: Only visible to Maker and Org Admins

---

## 📡 API Endpoints

### CMS Workflow Endpoints

```bash
# Submit for check (Maker)
POST /spatial-data/:id/submit-for-check

# Check data (Checker)
POST /spatial-data/:id/check
Body: { approved: boolean, comments?: string }

# Sign data (Signer)
POST /spatial-data/:id/sign
Body: { approved: boolean, comments?: string }
```

### Organization Hierarchy

Utility functions (tidak ada API endpoints langsung):
- `getAncestorOrganizations(orgId)`
- `getDescendantOrganizations(orgId)`
- `getOrganizationTree(rootId)`
- `isAncestorOf(ancestorId, descendantId)`

### Superadmin Operations

```bash
# Force approve data (bypass workflow)
POST /admin/superadmin/spatial-data/:id/force-approve
Body: { justification: string }

# Grant superadmin
POST /admin/superadmin/users/:userId/grant
Body: { justification: string }

# Revoke superadmin
POST /admin/superadmin/users/:userId/revoke
Body: { justification: string }

# View audit logs
GET /admin/superadmin/audit-logs
Query: { userId?, action?, startDate?, endDate? }
```

---

## 🗄️ Database Schema

### New Tables

1. **`spatial_data_approvals`** - Audit trail for CMS workflow
2. **`superadmin_audit_logs`** - Audit trail for superadmin actions

### Modified Tables

1. **`organizations`**
   - Added: `parent_organization_id`, `organization_path`, `level`, `inherit_permissions`, `isolated_data`

2. **`users`**
   - Added: `is_superadmin`, `superadmin_granted_at`, `superadmin_granted_by`

3. **`spatial_data`**, **`spatial_layers`**, **`spatial_maps`**
   - Updated `visibility` enum: added `organization_tree`, `organization_parent`
   - Added CMS fields: `approval_status`, `maker_id`, `checker_id`, `signer_id`, timestamps, rejection fields

### Migrations

- `0007_add_organization_hierarchy.sql`
- `0008_add_cms_workflow.sql`
- `0009_add_superadmin_and_audit.sql`

---

## 🧪 Testing

### CMS Workflow Tests

```typescript
// Test 4-eyes principle
it("should reject if checker is the maker", async () => {
  // ... create data with userId as maker
  // ... attempt to check with same userId
  // ... expect rejection
})

// Test workflow states
it("should transition from draft → pending_check → pending_sign → approved", async () => {
  // ... submit as maker
  // ... check as different user
  // ... sign as third user
  // ... verify approved
})
```

### Hierarchy Tests

```typescript
// Test ancestor retrieval
it("should get all ancestors for TREASURY", async () => {
  const ancestors = await getAncestorOrganizations(treasuryId)
  expect(ancestors).toContain(financeId)
  expect(ancestors).toContain(acmeId)
})
```

### Superadmin Tests

```typescript
// Test force approve
it("should allow superadmin to force approve draft data", async () => {
  const result = await superadminForceApprove(draftDataId, superadminId, "Emergency fix")
  expect(result.success).toBe(true)

  // Verify audit log created
  const logs = await getSuperadminAuditLogs({ userId: superadminId })
  expect(logs).toHaveLength(1)
})
```

---

## 📊 Use Cases

### Use Case 1: Multi-Level Company Structure

```typescript
// ACME company creates location data visible to all divisions
await createSpatialData({
  name: "ACME HQ",
  organizationId: acmeId,
  visibility: "organization_tree", // All child orgs can see
  approvalStatus: "draft",
  makerId: ceoId,
})

// Submit → Check → Sign
await submitForCheck(dataId, ceoId)
await checkData(dataId, cfoId, true)
await signData(dataId, cooId, true)

// Now all divisions (FINANCE, RND) can see the approved data
```

### Use Case 2: Department-Specific Data

```typescript
// TREASURY creates confidential data
await createSpatialData({
  name: "Treasury Vault Location",
  organizationId: treasuryId,
  visibility: "organization", // Only TREASURY members
  approvalStatus: "draft",
  makerId: treasuryManagerId,
})

// FINANCE division CANNOT see this data
// ACME company CANNOT see this data (unless superadmin bypass)
```

### Use Case 3: Emergency Superadmin Intervention

```typescript
// Production data stuck in workflow, needs immediate approval
await superadminForceApprove(
  dataId,
  superadminId,
  "Critical production issue #5678 - customer-facing map broken"
)

// Bypasses:
// - 4-eyes principle
// - CMS workflow states
// - All permissions
//
// But:
// - Fully audited
// - Justification required
// - Security team notified
```

---

## 🔒 Security Checklist

- ✅ 4-Eyes principle enforced (Checker ≠ Maker)
- ✅ Segregation of duties (Signer ≠ Maker ≠ Checker)
- ✅ Audit trail for all approvals
- ✅ Audit trail for all superadmin actions
- ✅ Multi-tenant isolation
- ✅ Hierarchy-based data sharing
- ✅ Approval status visibility control
- ✅ Permission-based access
- ✅ Justification required for sensitive operations
- ✅ No nested IF statements (clean code)
- ✅ No ELSE-IF chains (clean code)
- ✅ No nested functions (clean code)

---

## 🚀 Getting Started

### 1. Run Migrations

```bash
# Apply migrations
bun run db:migrate

# Or manually run SQL files in order:
# - 0007_add_organization_hierarchy.sql
# - 0008_add_cms_workflow.sql
# - 0009_add_superadmin_and_audit.sql
```

### 2. Seed Test Data

```typescript
// Create organization hierarchy
const acme = await createOrg({ name: "ACME", slug: "acme", parentOrganizationId: null })
const finance = await createOrg({ name: "FINANCE", slug: "acme-finance", parentOrganizationId: acme.id })
const treasury = await createOrg({ name: "TREASURY", slug: "acme-finance-treasury", parentOrganizationId: finance.id })
```

### 3. Grant First Superadmin

```sql
-- Manually grant first superadmin via SQL
UPDATE users
SET is_superadmin = true,
    superadmin_granted_at = NOW(),
    superadmin_granted_by = id -- self-granted for bootstrap
WHERE email = 'admin@acme.com';
```

### 4. Test Workflow

```bash
# Create spatial data (becomes draft with makerId)
POST /spatial-data
Body: { name: "Test Location", ... }

# Submit for check
POST /spatial-data/:id/submit-for-check

# Check (as different user with check permission)
POST /spatial-data/:id/check
Body: { approved: true, comments: "Looks good" }

# Sign (as third user with sign permission)
POST /spatial-data/:id/sign
Body: { approved: true, comments: "Approved" }

# Data is now approved and visible based on visibility level
```

---

**Implementation Complete! ✅**

All features implemented with:
- ✅ No nested IF statements
- ✅ No ELSE-IF chains
- ✅ No nested functions
- ✅ Clean, maintainable code
- ✅ Comprehensive security
- ✅ Full audit trails
