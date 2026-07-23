import { createHash } from "node:crypto";
import { prisma } from "../../db.js";
import type { RecallRepository } from "./service.js";

const hashEvent = (
  previous: string | null,
  payloadHash: string,
  kind: string,
  occurredAt: Date,
) =>
  createHash("sha256")
    .update(
      `${previous ?? ""}:${payloadHash}:${kind}:${occurredAt.toISOString()}`,
    )
    .digest("hex");
export class PrismaRecallRepository implements RecallRepository {
  async create(input: Parameters<RecallRepository["create"]>[0]) {
    return prisma.$transaction(async (tx) => {
      if (
        input.batchId &&
        !(await tx.batch.findFirst({
          where: { id: input.batchId, organizationId: input.organizationId },
        }))
      )
        return "TENANT_MISMATCH" as const;
      if (
        input.productId &&
        !(await tx.product.findFirst({
          where: { id: input.productId, organizationId: input.organizationId },
        }))
      )
        return "TENANT_MISMATCH" as const;
      const items = await tx.item.findMany({
        where: {
          organizationId: input.organizationId,
          batch: {
            ...(input.batchId ? { id: input.batchId } : {}),
            ...(input.productId ? { productId: input.productId } : {}),
          },
        },
        select: { id: true, currentFacilityId: true },
      });
      if (!items.length) return "NO_IMPACTED_ITEMS" as const;
      const recall = await tx.recall.create({
        data: input,
        select: { id: true },
      });
      const facilities = [
        ...new Set(
          items.flatMap((item) =>
            item.currentFacilityId ? [item.currentFacilityId] : [],
          ),
        ),
      ];
      if (facilities.length)
        await tx.notificationJob.createMany({
          data: facilities.map((facilityId) => ({
            organizationId: input.organizationId,
            recallId: recall.id,
            facilityId,
          })),
          skipDuplicates: true,
        });
      for (const item of items) {
        const previous = await tx.provenanceEvent.findFirst({
          where: { itemId: item.id },
          orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        });
        const occurredAt = new Date();
        const payload = {
          recallId: recall.id,
          severity: input.severity,
          reason: input.reason,
        };
        const payloadHash = createHash("sha256")
          .update(JSON.stringify(payload))
          .digest("hex");
        await tx.provenanceEvent.create({
          data: {
            externalEventId: `recall:${recall.id}:${item.id}`,
            organizationId: input.organizationId,
            itemId: item.id,
            kind: "RECALLED",
            payload,
            payloadHash,
            previousHash: previous?.chainHash ?? null,
            chainHash: hashEvent(
              previous?.chainHash ?? null,
              payloadHash,
              "RECALLED",
              occurredAt,
            ),
            occurredAt,
          },
        });
      }
      return {
        id: recall.id,
        impactedItems: items.length,
        notifiedFacilities: facilities.length,
      };
    });
  }
  async acknowledge(
    recallId: string,
    input: Parameters<RecallRepository["acknowledge"]>[1],
  ) {
    return prisma.$transaction(async (tx) => {
      const recall = await tx.recall.findUnique({
        where: { id: recallId },
        select: {
          id: true,
          organizationId: true,
          batchId: true,
          productId: true,
        },
      });
      const facility = recall
        ? await tx.facility.findFirst({
            where: {
              id: input.facilityId,
              organizationId: recall.organizationId,
            },
          })
        : null;
      if (!recall || !facility) return "TENANT_MISMATCH" as const;
      const existing = await tx.recallAcknowledgment.findUnique({
        where: {
          recallId_facilityId: { recallId, facilityId: input.facilityId },
        },
      });
      if (existing) return { replayed: true };
      await tx.recallAcknowledgment.create({ data: { recallId, ...input } });
      const items = await tx.item.findMany({
        where: {
          organizationId: recall.organizationId,
          currentFacilityId: input.facilityId,
          batch: {
            ...(recall.batchId ? { id: recall.batchId } : {}),
            ...(recall.productId ? { productId: recall.productId } : {}),
          },
        },
        select: { id: true },
      });
      for (const item of items) {
        const previous = await tx.provenanceEvent.findFirst({
          where: { itemId: item.id },
          orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        });
        const occurredAt = new Date();
        const payload = {
          recallId,
          facilityId: input.facilityId,
          note: input.note ?? null,
        };
        const payloadHash = createHash("sha256")
          .update(JSON.stringify(payload))
          .digest("hex");
        await tx.provenanceEvent.create({
          data: {
            externalEventId: `recall-ack:${recallId}:${input.facilityId}:${item.id}`,
            organizationId: recall.organizationId,
            itemId: item.id,
            kind: "RECALL_ACKNOWLEDGED",
            toFacilityId: input.facilityId,
            payload,
            payloadHash,
            previousHash: previous?.chainHash ?? null,
            chainHash: hashEvent(
              previous?.chainHash ?? null,
              payloadHash,
              "RECALL_ACKNOWLEDGED",
              occurredAt,
            ),
            occurredAt,
          },
        });
      }
      return { replayed: false };
    });
  }
  list(organizationId: string) {
    return prisma.recall.findMany({
      where: { organizationId },
      include: {
        product: { select: { name: true } },
        batch: { select: { lotCode: true } },
        acknowledgments: { include: { facility: { select: { name: true } } } },
        _count: { select: { notificationJobs: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  claimJobs(limit: number) {
    const now = new Date();
    return prisma.$queryRaw`UPDATE "NotificationJob" SET status = 'PROCESSING', attempts = attempts + 1, "updatedAt" = ${now} WHERE id IN (SELECT id FROM "NotificationJob" WHERE status = 'PENDING' AND "scheduledAt" <= ${now} ORDER BY "scheduledAt" FOR UPDATE SKIP LOCKED LIMIT ${limit}) RETURNING id, "recallId", "facilityId", attempts`;
  }
  async completeJob(id: string, succeeded: boolean, errorCode?: string) {
    const job = await prisma.notificationJob.findUnique({
      where: { id },
      select: { attempts: true },
    });
    if (!job) return;
    const failed = !succeeded && job.attempts >= 5;
    await prisma.notificationJob.update({
      where: { id },
      data: succeeded
        ? { status: "SENT", lastError: null }
        : {
            status: failed ? "FAILED" : "PENDING",
            lastError: errorCode ?? "PROVIDER_ERROR",
            scheduledAt: new Date(
              Date.now() + Math.min(60, 2 ** job.attempts) * 60_000,
            ),
          },
    });
  }
}
