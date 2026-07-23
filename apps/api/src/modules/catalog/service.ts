import { createHash, randomBytes } from "node:crypto";
import {
  batchInput,
  facilityInput,
  itemInput,
  organizationInput,
  productInput,
  supplierInput,
} from "@provenance/contracts";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import QRCode from "qrcode";
export class DomainError extends Error {
  constructor(
    readonly code: string,
    readonly status: ContentfulStatusCode = 400,
  ) {
    super(code);
  }
}
export interface CatalogRepository {
  createOrganization(input: { name: string; slug: string }): Promise<unknown>;
  createFacility(input: {
    organizationId: string;
    name: string;
    code: string;
    countryCode: string;
  }): Promise<unknown | "TENANT_MISMATCH">;
  createSupplier(input: {
    organizationId: string;
    name: string;
    externalRef: string;
    contactEmail: string;
  }): Promise<unknown>;
  createProduct(input: {
    organizationId: string;
    name: string;
    sku: string;
    description?: string;
  }): Promise<unknown>;
  createBatch(input: {
    organizationId: string;
    productId: string;
    facilityId: string;
    lotCode: string;
    manufacturedAt: Date;
  }): Promise<unknown | "TENANT_MISMATCH">;
  createItem(input: {
    organizationId: string;
    batchId: string;
    serial: string;
    publicTokenHash: string;
    externalEventId: string;
  }): Promise<{ id: string; serial: string } | "TENANT_MISMATCH">;
  catalog(organizationId: string): Promise<unknown>;
  publicItem(tokenHash: string): Promise<unknown | null>;
}
export class CatalogService {
  constructor(
    private repository: CatalogRepository,
    private publicBaseUrl: string,
    private telemetry: { record(event: Record<string, unknown>): void } = {
      record: () => undefined,
    },
  ) {}
  createOrganization(raw: unknown) {
    return this.repository.createOrganization(organizationInput.parse(raw));
  }
  createFacility(raw: unknown) {
    return this.checked(
      this.repository.createFacility(facilityInput.parse(raw)),
    );
  }
  createSupplier(raw: unknown) {
    const input = supplierInput.parse(raw);
    return this.repository.createSupplier({
      ...input,
      contactEmail: input.contactEmail.toLowerCase(),
    });
  }
  createProduct(raw: unknown) {
    const input = productInput.parse(raw);
    return this.repository.createProduct({
      organizationId: input.organizationId,
      name: input.name,
      sku: input.sku,
      ...(input.description ? { description: input.description } : {}),
    });
  }
  createBatch(raw: unknown) {
    const input = batchInput.parse(raw);
    return this.checked(
      this.repository.createBatch({
        ...input,
        manufacturedAt: new Date(input.manufacturedAt),
      }),
    );
  }
  async createItem(raw: unknown) {
    const input = itemInput.parse(raw);
    const token = randomBytes(24).toString("base64url");
    const item = await this.checked(
      this.repository.createItem({
        ...input,
        publicTokenHash: createHash("sha256").update(token).digest("hex"),
        externalEventId: `identity:${input.serial}`,
      }),
    );
    const verifyUrl = `${this.publicBaseUrl}/verify/${token}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 360,
    });
    this.telemetry.record({
      event: "item.serialized",
      organizationId: input.organizationId,
    });
    return { item, verifyUrl, qrDataUrl };
  }
  catalog(organizationId?: string) {
    if (!organizationId) throw new DomainError("ORGANIZATION_REQUIRED");
    return this.repository.catalog(organizationId);
  }
  async publicItem(token: string) {
    if (token.length < 20 || token.length > 100)
      throw new DomainError("INVALID_PUBLIC_TOKEN", 404);
    const item = await this.repository.publicItem(
      createHash("sha256").update(token).digest("hex"),
    );
    if (!item) throw new DomainError("ITEM_NOT_FOUND", 404);
    return item;
  }
  private async checked<T>(value: Promise<T | "TENANT_MISMATCH">) {
    const result = await value;
    if (result === "TENANT_MISMATCH")
      throw new DomainError("TENANT_MISMATCH", 400);
    return result;
  }
}
