-- AlterTable
ALTER TABLE "MaintenanceRequest" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "MaintenanceRequest_tenantId_deletedAt_idx" ON "MaintenanceRequest"("tenantId", "deletedAt");
