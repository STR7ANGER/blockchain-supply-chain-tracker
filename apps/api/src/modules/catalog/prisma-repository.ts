import { createHash } from "node:crypto";
import { prisma } from "../../db.js";
import type { CatalogRepository } from "./service.js";

const canonical = (value: unknown) =>
  JSON.stringify(value, Object.keys(value as object).sort());
export class PrismaCatalogRepository implements CatalogRepository {
  createOrganization(
    input: Parameters<CatalogRepository["createOrganization"]>[0],
  ) {
    return prisma.organization.create({
      data: {
        ...input,
        memberships: { create: { email: "owner@example.com", role: "OWNER" } },
      },
    });
  }
  createFacility(input: Parameters<CatalogRepository["createFacility"]>[0]) {
    return prisma.facility.create({ data: input });
  }
  createSupplier(input: Parameters<CatalogRepository["createSupplier"]>[0]) {
    return prisma.supplier.create({ data: input });
  }
  createProduct(input: Parameters<CatalogRepository["createProduct"]>[0]) {
    return prisma.product.create({ data: input });
  }
  async createBatch(input: Parameters<CatalogRepository["createBatch"]>[0]) {
    const [product, facility] = await Promise.all([
      prisma.product.findFirst({
        where: { id: input.productId, organizationId: input.organizationId },
      }),
      prisma.facility.findFirst({
        where: { id: input.facilityId, organizationId: input.organizationId },
      }),
    ]);
    if (!product || !facility) return "TENANT_MISMATCH" as const;
    return prisma.batch.create({ data: input });
  }
  async createItem(input: Parameters<CatalogRepository["createItem"]>[0]) {
    const batch = await prisma.batch.findFirst({
      where: { id: input.batchId, organizationId: input.organizationId },
    });
    if (!batch) return "TENANT_MISMATCH" as const;
    const payload = { serial: input.serial, batchId: input.batchId };
    const payloadHash = createHash("sha256")
      .update(canonical(payload))
      .digest("hex");
    return prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          organizationId: input.organizationId,
          batchId: input.batchId,
          serial: input.serial,
          publicTokenHash: input.publicTokenHash,
          currentFacilityId: batch.facilityId,
        },
        select: { id: true, serial: true },
      });
      await tx.provenanceEvent.create({
        data: {
          externalEventId: input.externalEventId,
          organizationId: input.organizationId,
          itemId: item.id,
          kind: "ITEM_SERIALIZED",
          toFacilityId: batch.facilityId,
          payload,
          payloadHash,
          chainHash: createHash("sha256").update(payloadHash).digest("hex"),
          occurredAt: new Date(),
        },
      });
      return item;
    });
  }
  catalog(organizationId: string) {
    return prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        facilities: true,
        suppliers: true,
        products: { include: { batches: { include: { items: true } } } },
      },
    });
  }
  publicItem(tokenHash: string) {
    return prisma.item.findUnique({
      where: { publicTokenHash: tokenHash },
      select: {
        id: true,
        serial: true,
        createdAt: true,
        batch: {
          select: {
            lotCode: true,
            manufacturedAt: true,
            product: { select: { name: true, sku: true } },
            facility: { select: { name: true, countryCode: true } },
          },
        },
        events: {
          orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
          select: {
            kind: true,
            occurredAt: true,
            chainHash: true,
            payloadHash: true,
            fromFacility: { select: { name: true } },
            toFacility: { select: { name: true } },
          },
        },
        certificates: {
          select: {
            kind: true,
            filename: true,
            contentHash: true,
            verifiedAt: true,
          },
        },
        sustainability: {
          select: {
            event: true,
            weightGrams: true,
            carbonAvoidedGrams: true,
            occurredAt: true,
          },
        },
      },
    });
  }
}
