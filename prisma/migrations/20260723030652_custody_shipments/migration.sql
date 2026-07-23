-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fromFacilityId" TEXT,
    "toFacilityId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "departedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_externalEventId_key" ON "Shipment"("externalEventId");

-- CreateIndex
CREATE INDEX "Shipment_organizationId_status_departedAt_idx" ON "Shipment"("organizationId", "status", "departedAt");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
