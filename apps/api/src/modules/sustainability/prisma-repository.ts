import { createHash } from "node:crypto";
import { prisma } from "../../db.js";
import type { SustainabilityRepository } from "./service.js";
export class PrismaSustainabilityRepository
  implements SustainabilityRepository
{
  async record(input: Parameters<SustainabilityRepository["record"]>[0]) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.sustainabilityMetric.findUnique({
        where: { externalEventId: input.eventId },
      });
      if (existing) return { replayed: true, id: existing.id };
      const item = await tx.item.findFirst({
        where: { id: input.itemId, organizationId: input.organizationId },
      });
      if (!item) return "TENANT_MISMATCH" as const;
      const previous = await tx.provenanceEvent.findFirst({
        where: { itemId: input.itemId },
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      });
      if (previous && input.occurredAt < previous.occurredAt)
        return "OUT_OF_ORDER" as const;
      const payload = {
        event: input.event,
        weightGrams: input.weightGrams,
        carbonAvoidedGrams: input.carbonAvoidedGrams,
      };
      const payloadHash = createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");
      const chainHash = createHash("sha256")
        .update(
          `${previous?.chainHash ?? ""}:${payloadHash}:${input.event}:${input.occurredAt.toISOString()}`,
        )
        .digest("hex");
      const metric = await tx.sustainabilityMetric.create({
        data: {
          externalEventId: input.eventId,
          organizationId: input.organizationId,
          itemId: input.itemId,
          event: input.event,
          weightGrams: input.weightGrams,
          carbonAvoidedGrams: input.carbonAvoidedGrams,
          occurredAt: input.occurredAt,
        },
      });
      await tx.provenanceEvent.create({
        data: {
          externalEventId: input.eventId,
          organizationId: input.organizationId,
          itemId: input.itemId,
          kind: input.event,
          payload,
          payloadHash,
          previousHash: previous?.chainHash ?? null,
          chainHash,
          occurredAt: input.occurredAt,
        },
      });
      return { replayed: false, id: metric.id };
    });
  }
  async summary(organizationId: string) {
    const groups = await prisma.sustainabilityMetric.groupBy({
      by: ["event"],
      where: { organizationId },
      _sum: { weightGrams: true, carbonAvoidedGrams: true },
      _count: { _all: true },
    });
    return groups.map((row) => ({
      event: row.event,
      weightGrams: row._sum.weightGrams ?? 0,
      carbonAvoidedGrams: row._sum.carbonAvoidedGrams ?? 0,
      count: row._count._all,
    }));
  }
}
