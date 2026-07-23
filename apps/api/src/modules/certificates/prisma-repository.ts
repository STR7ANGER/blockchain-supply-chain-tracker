import { createHash } from "node:crypto";
import { prisma } from "../../db.js";
import type { CertificateRepository } from "./service.js";
export class PrismaCertificateRepository implements CertificateRepository {
  async anchor(input: Parameters<CertificateRepository["anchor"]>[0]) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.item.findFirst({
        where: { id: input.itemId, organizationId: input.organizationId },
      });
      if (!item) return "TENANT_MISMATCH" as const;
      const existing = await tx.certificate.findUnique({
        where: {
          itemId_contentHash: {
            itemId: input.itemId,
            contentHash: input.contentHash,
          },
        },
        select: { id: true, contentHash: true },
      });
      if (existing) return existing;
      const previous = await tx.provenanceEvent.findFirst({
        where: { itemId: input.itemId },
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      });
      const occurredAt = new Date();
      const chainHash = createHash("sha256")
        .update(
          `${previous?.chainHash ?? ""}:${input.contentHash}:CERTIFICATE_ANCHORED:${occurredAt.toISOString()}`,
        )
        .digest("hex");
      const certificate = await tx.certificate.create({
        data: input,
        select: { id: true, contentHash: true },
      });
      await tx.provenanceEvent.create({
        data: {
          externalEventId: `certificate:${input.itemId}:${input.contentHash}`,
          organizationId: input.organizationId,
          itemId: input.itemId,
          kind: "CERTIFICATE_ANCHORED",
          payload: { certificateId: certificate.id, kind: input.kind },
          payloadHash: input.contentHash,
          previousHash: previous?.chainHash ?? null,
          chainHash,
          occurredAt,
        },
      });
      return certificate;
    });
  }
  async verify(input: Parameters<CertificateRepository["verify"]>[0]) {
    const certificate = await prisma.certificate.findFirst({ where: input });
    if (!certificate) return false;
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { verifiedAt: new Date() },
    });
    return true;
  }
}
