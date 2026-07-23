import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import type { CustodyRepository } from "./service.js";

const stable = (value: unknown): string =>
  value === null || typeof value !== "object"
    ? JSON.stringify(value)
    : Array.isArray(value)
      ? `[${value.map(stable).join(",")}]`
      : `{${Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
          .join(",")}}`;
export class PrismaCustodyRepository implements CustodyRepository {
  async append(input: Parameters<CustodyRepository["append"]>[0]) {
    return prisma.$transaction(
      async (tx) => {
        const existing = await tx.provenanceEvent.findUnique({
          where: { externalEventId: input.eventId },
        });
        if (existing) return { replayed: true, event: existing };
        const item = await tx.item.findFirst({
          where: { id: input.itemId, organizationId: input.organizationId },
          select: { id: true, currentFacilityId: true },
        });
        const to = await tx.facility.findFirst({
          where: {
            id: input.toFacilityId,
            organizationId: input.organizationId,
          },
          select: { id: true },
        });
        if (!item || !to) return "TENANT_MISMATCH" as const;
        if (
          input.fromFacilityId &&
          item.currentFacilityId !== input.fromFacilityId
        )
          return "CUSTODY_CONFLICT" as const;
        const previous = await tx.provenanceEvent.findFirst({
          where: { itemId: item.id },
          orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        });
        if (previous && input.occurredAt < previous.occurredAt)
          return "OUT_OF_ORDER" as const;
        const payload = {
          kind: input.kind,
          fromFacilityId: input.fromFacilityId ?? null,
          toFacilityId: input.toFacilityId,
          condition: input.condition ?? {},
        };
        const payloadHash = createHash("sha256")
          .update(stable(payload))
          .digest("hex");
        const chainHash = createHash("sha256")
          .update(
            `${previous?.chainHash ?? ""}:${payloadHash}:${input.kind}:${input.occurredAt.toISOString()}`,
          )
          .digest("hex");
        const event = await tx.provenanceEvent.create({
          data: {
            externalEventId: input.eventId,
            organizationId: input.organizationId,
            itemId: input.itemId,
            kind: input.kind,
            fromFacilityId: input.fromFacilityId ?? null,
            toFacilityId: input.toFacilityId,
            payload,
            payloadHash,
            previousHash: previous?.chainHash ?? null,
            chainHash,
            occurredAt: input.occurredAt,
          },
        });
        if (input.kind === "SHIPPED")
          await tx.shipment.create({
            data: {
              externalEventId: input.eventId,
              organizationId: input.organizationId,
              itemId: input.itemId,
              fromFacilityId: input.fromFacilityId ?? null,
              toFacilityId: input.toFacilityId,
              status: "IN_TRANSIT",
              condition: input.condition ?? {},
              departedAt: input.occurredAt,
            },
          });
        if (input.kind === "RECEIVED") {
          const shipment = await tx.shipment.findFirst({
            where: {
              itemId: input.itemId,
              toFacilityId: input.toFacilityId,
              status: "IN_TRANSIT",
            },
            orderBy: { departedAt: "desc" },
          });
          if (shipment)
            await tx.shipment.update({
              where: { id: shipment.id },
              data: { status: "RECEIVED", receivedAt: input.occurredAt },
            });
        }
        if (input.kind !== "CONDITION_RECORDED")
          await tx.item.update({
            where: { id: input.itemId },
            data: {
              currentFacilityId:
                input.kind === "SHIPPED" ? null : input.toFacilityId,
            },
          });
        return { replayed: false, event };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
