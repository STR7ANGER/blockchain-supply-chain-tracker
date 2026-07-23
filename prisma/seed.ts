import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const organization = await prisma.organization.upsert({
  where: { slug: "demo-chain" },
  update: {},
  create: {
    slug: "demo-chain",
    name: "TraceProof Demo",
    memberships: { create: { email: "owner@example.com", role: "OWNER" } },
  },
});
const factory = await prisma.facility.upsert({
  where: {
    organizationId_code: {
      organizationId: organization.id,
      code: "BLR-FACTORY",
    },
  },
  update: {},
  create: {
    organizationId: organization.id,
    name: "Bengaluru Factory",
    code: "BLR-FACTORY",
    countryCode: "IN",
  },
});
await prisma.supplier.upsert({
  where: {
    organizationId_externalRef: {
      organizationId: organization.id,
      externalRef: "SUP-DEMO",
    },
  },
  update: {},
  create: {
    organizationId: organization.id,
    name: "Demo Materials",
    externalRef: "SUP-DEMO",
    contactEmail: "supplier@example.com",
  },
});
const product = await prisma.product.upsert({
  where: {
    organizationId_sku: { organizationId: organization.id, sku: "TRACE-100" },
  },
  update: {},
  create: {
    organizationId: organization.id,
    name: "Traceable Component",
    sku: "TRACE-100",
    description: "Synthetic release-demo product",
  },
});
const batch = await prisma.batch.upsert({
  where: {
    organizationId_lotCode: {
      organizationId: organization.id,
      lotCode: "LOT-2030-001",
    },
  },
  update: {},
  create: {
    organizationId: organization.id,
    productId: product.id,
    facilityId: factory.id,
    lotCode: "LOT-2030-001",
    manufacturedAt: new Date("2030-01-01T08:00:00Z"),
  },
});
const token = "demo-public-token-keep-out-of-production";
const existingItem = await prisma.item.findUnique({
  where: { serial: "SERIAL-DEMO-001" },
});
let item = existingItem;
if (!item) {
  const occurredAt = new Date("2030-01-01T08:05:00Z");
  const payloadHash = createHash("sha256")
    .update(JSON.stringify({ batchId: batch.id, serial: "SERIAL-DEMO-001" }))
    .digest("hex");
  const chainHash = createHash("sha256")
    .update(`:${payloadHash}:ITEM_SERIALIZED:${occurredAt.toISOString()}`)
    .digest("hex");
  item = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        organizationId: organization.id,
        batchId: batch.id,
        serial: "SERIAL-DEMO-001",
        publicTokenHash: createHash("sha256").update(token).digest("hex"),
        currentFacilityId: factory.id,
      },
    });
    await tx.provenanceEvent.create({
      data: {
        externalEventId: "seed:identity:SERIAL-DEMO-001",
        organizationId: organization.id,
        itemId: created.id,
        kind: "ITEM_SERIALIZED",
        toFacilityId: factory.id,
        payload: { batchId: batch.id, serial: created.serial },
        payloadHash,
        chainHash,
        occurredAt,
      },
    });
    return created;
  });
}
console.info(
  JSON.stringify({
    organizationId: organization.id,
    facilityId: factory.id,
    productId: product.id,
    batchId: batch.id,
    itemId: item.id,
    publicToken: token,
  }),
);
await prisma.$disconnect();
