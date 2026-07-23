import { describe, expect, it } from "vitest";
import {
  type CatalogRepository,
  CatalogService,
} from "../src/modules/catalog/service.js";

class Memory implements CatalogRepository {
  createOrganization(input: unknown) {
    return Promise.resolve(input);
  }
  createFacility(input: unknown) {
    return Promise.resolve(input);
  }
  createSupplier(input: unknown) {
    return Promise.resolve(input);
  }
  createProduct(input: unknown) {
    return Promise.resolve(input);
  }
  createBatch(input: { productId: string }) {
    return Promise.resolve(
      input.productId === "other" ? ("TENANT_MISMATCH" as const) : input,
    );
  }
  createItem(input: { batchId: string; serial: string }) {
    return Promise.resolve(
      input.batchId === "other"
        ? ("TENANT_MISMATCH" as const)
        : { id: "item", serial: input.serial },
    );
  }
  catalog() {
    return Promise.resolve({ products: [] });
  }
  publicItem(tokenHash: string) {
    return Promise.resolve(
      tokenHash.length === 64 ? { serial: "SERIAL-1" } : null,
    );
  }
}
describe("tenant catalog and public identity", () => {
  const service = new CatalogService(new Memory(), "http://localhost:3000");
  it("rejects cross-tenant batch references", async () => {
    await expect(
      service.createBatch({
        organizationId: "org",
        productId: "other",
        facilityId: "facility",
        lotCode: "LOT-1",
        manufacturedAt: "2030-01-02T10:00:00Z",
      }),
    ).rejects.toMatchObject({ code: "TENANT_MISMATCH" });
  });
  it("creates an opaque public QR without exposing its stored hash", async () => {
    const result = await service.createItem({
      organizationId: "org",
      batchId: "batch",
      serial: "SERIAL-1",
    });
    expect(result.verifyUrl).toMatch(
      /^http:\/\/localhost:3000\/verify\/[A-Za-z0-9_-]+$/,
    );
    expect(result.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(JSON.stringify(result)).not.toContain("publicTokenHash");
  });
  it("normalizes supplier emails", async () => {
    await expect(
      service.createSupplier({
        organizationId: "org",
        name: "Supplier",
        externalRef: "SUP-1",
        contactEmail: "ADA@EXAMPLE.COM",
      }),
    ).resolves.toMatchObject({ contactEmail: "ada@example.com" });
  });
});
