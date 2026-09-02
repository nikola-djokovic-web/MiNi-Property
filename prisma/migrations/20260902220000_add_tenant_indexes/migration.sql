-- Add indexes on tenantId (and common compound filters) for multi-tenant tables.
-- These columns are filtered on in virtually every query; without indexes,
-- Postgres falls back to sequential scans as each tenant's data grows.

CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS "User_tenantId_role_idx" ON "User"("tenantId", "role");

CREATE INDEX IF NOT EXISTS "Property_tenantId_idx" ON "Property"("tenantId");
CREATE INDEX IF NOT EXISTS "Property_tenantId_assignedWorkerId_idx" ON "Property"("tenantId", "assignedWorkerId");

CREATE INDEX IF NOT EXISTS "MaintenanceRequest_tenantId_idx" ON "MaintenanceRequest"("tenantId");
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_tenantId_assignedWorkerId_idx" ON "MaintenanceRequest"("tenantId", "assignedWorkerId");

CREATE INDEX IF NOT EXISTS "Unit_tenantId_idx" ON "Unit"("tenantId");

CREATE INDEX IF NOT EXISTS "Lease_tenantId_idx" ON "Lease"("tenantId");

CREATE INDEX IF NOT EXISTS "Invite_tenantId_idx" ON "Invite"("tenantId");
CREATE INDEX IF NOT EXISTS "Invite_tenantId_userId_idx" ON "Invite"("tenantId", "userId");

CREATE INDEX IF NOT EXISTS "Notification_tenantId_idx" ON "Notification"("tenantId");
CREATE INDEX IF NOT EXISTS "Notification_tenantId_userId_idx" ON "Notification"("tenantId", "userId");

CREATE INDEX IF NOT EXISTS "NotificationWebhook_tenantId_idx" ON "NotificationWebhook"("tenantId");
