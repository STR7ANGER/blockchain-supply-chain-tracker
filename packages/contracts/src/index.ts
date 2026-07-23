import { z } from "zod";
export const id = z.string().trim().min(1).max(100);
export const name = z.string().trim().min(2).max(120);
export const organizationInput = z.object({
  name,
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
});
export const facilityInput = z.object({
  organizationId: id,
  name,
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{2,30}$/),
  countryCode: z
    .string()
    .length(2)
    .transform((value) => value.toUpperCase()),
});
export const supplierInput = z.object({
  organizationId: id,
  name,
  externalRef: z.string().trim().min(1).max(80),
  contactEmail: z.email(),
});
export const productInput = z.object({
  organizationId: id,
  name,
  sku: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
});
export const batchInput = z.object({
  organizationId: id,
  productId: id,
  facilityId: id,
  lotCode: z.string().trim().min(1).max(80),
  manufacturedAt: z.iso.datetime({ offset: true }),
});
export const itemInput = z.object({
  organizationId: id,
  batchId: id,
  serial: z.string().trim().min(4).max(120),
});
export const custodyCommand = z.object({
  eventId: id,
  organizationId: id,
  itemId: id,
  fromFacilityId: id.optional(),
  toFacilityId: id,
  kind: z.enum(["TRANSFERRED", "SHIPPED", "RECEIVED", "CONDITION_RECORDED"]),
  occurredAt: z.iso.datetime({ offset: true }),
  condition: z
    .object({
      temperatureC: z.number().min(-100).max(200).optional(),
      note: z.string().trim().max(240).optional(),
    })
    .optional(),
});
export const certificateInput = z.object({
  organizationId: id,
  itemId: id,
  kind: z.enum(["ORIGIN", "QUALITY", "COMPLIANCE", "SUSTAINABILITY"]),
  filename: z.string().trim().min(1).max(160),
  mediaType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
  contentBase64: z.string().min(4).max(10_000_000),
});
export const recallInput = z
  .object({
    organizationId: id,
    batchId: id.optional(),
    productId: id.optional(),
    reason: z.string().trim().min(10).max(500),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  })
  .refine(
    (value) => value.batchId || value.productId,
    "batchId or productId required",
  );
export const recallAcknowledge = z.object({
  facilityId: id,
  note: z.string().trim().max(240).optional(),
});
export const sustainabilityInput = z.object({
  organizationId: id,
  itemId: id,
  event: z.enum(["RECYCLED", "REUSED", "DISPOSED"]),
  weightGrams: z.number().int().min(0).max(100_000_000),
  carbonAvoidedGrams: z.number().int().min(0).max(100_000_000),
  occurredAt: z.iso.datetime({ offset: true }),
});
export const eventKinds = [
  "PRODUCT_CREATED",
  "BATCH_CREATED",
  "ITEM_SERIALIZED",
  "TRANSFERRED",
  "SHIPPED",
  "RECEIVED",
  "CONDITION_RECORDED",
  "CERTIFICATE_ANCHORED",
  "RECALLED",
  "RECALL_ACKNOWLEDGED",
  "RECYCLED",
  "REUSED",
  "DISPOSED",
] as const;
