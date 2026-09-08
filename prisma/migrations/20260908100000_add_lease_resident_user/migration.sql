-- AlterTable
ALTER TABLE "Lease" ADD COLUMN "residentUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_residentUserId_fkey" FOREIGN KEY ("residentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
