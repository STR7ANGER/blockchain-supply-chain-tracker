import { describe, expect, it } from "vitest";
import {
  type CertificateRepository,
  CertificateService,
  type CertificateStore,
} from "../src/modules/certificates/service.js";

class Store implements CertificateStore {
  deleted: string[] = [];
  put() {
    return Promise.resolve("mongo-1");
  }
  delete(id: string) {
    this.deleted.push(id);
    return Promise.resolve();
  }
}
class Repository implements CertificateRepository {
  anchored = false;
  anchor() {
    this.anchored = true;
    return Promise.resolve({ id: "certificate", contentHash: "hash" });
  }
  verify() {
    return Promise.resolve(true);
  }
}
const pdf = Buffer.from("%PDF-1.7 synthetic").toString("base64");
describe("certificate anchoring", () => {
  it("rejects spoofed media before storage", async () => {
    const repository = new Repository();
    const service = new CertificateService(new Store(), repository);
    await expect(
      service.upload({
        organizationId: "org",
        itemId: "item",
        kind: "ORIGIN",
        filename: "fake.pdf",
        mediaType: "application/pdf",
        contentBase64: Buffer.from("not-pdf").toString("base64"),
      }),
    ).rejects.toMatchObject({ code: "UNTRUSTED_CERTIFICATE_FILE" });
    expect(repository.anchored).toBe(false);
  });
  it("anchors trusted file hashes and verifies exact bytes", async () => {
    const service = new CertificateService(new Store(), new Repository());
    await expect(
      service.upload({
        organizationId: "org",
        itemId: "item",
        kind: "ORIGIN",
        filename: "origin.pdf",
        mediaType: "application/pdf",
        contentBase64: pdf,
      }),
    ).resolves.toMatchObject({ id: "certificate" });
    await expect(
      service.verify({
        organizationId: "org",
        itemId: "item",
        contentBase64: pdf,
      }),
    ).resolves.toMatchObject({ verified: true });
  });
});
