-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "SustainabilityMetric" ADD COLUMN "externalEventId" TEXT;
UPDATE "SustainabilityMetric"
SET "externalEventId" = 'legacy:' || "id"
WHERE "externalEventId" IS NULL;
ALTER TABLE "SustainabilityMetric" ALTER COLUMN "externalEventId" SET NOT NULL;

-- CreateTable
CREATE TABLE "NotificationJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recallId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationJob_status_scheduledAt_idx"
ON "NotificationJob"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationJob_recallId_facilityId_key"
ON "NotificationJob"("recallId", "facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "SustainabilityMetric_externalEventId_key"
ON "SustainabilityMetric"("externalEventId");

-- AddForeignKey
ALTER TABLE "NotificationJob"
ADD CONSTRAINT "NotificationJob_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationJob"
ADD CONSTRAINT "NotificationJob_recallId_fkey"
FOREIGN KEY ("recallId") REFERENCES "Recall"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationJob"
ADD CONSTRAINT "NotificationJob_facilityId_fkey"
FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
