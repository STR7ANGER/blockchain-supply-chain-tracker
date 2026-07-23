import { createHash } from "node:crypto";
import { certificateInput } from "@provenance/contracts";
import { DomainError } from "../catalog/service.js";
export interface CertificateStore {
  put(input: {
    organizationId: string;
    itemId: string;
    kind: string;
    filename: string;
    mediaType: string;
    content: Buffer;
    contentHash: string;
  }): Promise<string>;
  delete(id: string): Promise<void>;
}
export interface CertificateRepository {
  anchor(input: {
    organizationId: string;
    itemId: string;
    kind: string;
    filename: string;
    mediaType: string;
    contentHash: string;
    mongoDocumentId: string;
  }): Promise<{ id: string; contentHash: string } | "TENANT_MISMATCH">;
  verify(input: {
    organizationId: string;
    itemId: string;
    contentHash: string;
  }): Promise<boolean>;
}
const validMagic = (content: Buffer, mediaType: string) =>
  mediaType === "application/pdf"
    ? content.subarray(0, 4).toString() === "%PDF"
    : mediaType === "image/png"
      ? content
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : content.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
export class CertificateService {
  constructor(
    private store: CertificateStore,
    private repository: CertificateRepository,
    private telemetry: { record(event: Record<string, unknown>): void } = {
      record: () => undefined,
    },
  ) {}
  async upload(raw: unknown) {
    const input = certificateInput.parse(raw);
    const content = Buffer.from(input.contentBase64, "base64");
    if (
      !content.length ||
      content.length > 5_000_000 ||
      !validMagic(content, input.mediaType)
    )
      throw new DomainError("UNTRUSTED_CERTIFICATE_FILE", 422);
    const contentHash = createHash("sha256").update(content).digest("hex");
    const mongoDocumentId = await this.store.put({
      organizationId: input.organizationId,
      itemId: input.itemId,
      kind: input.kind,
      filename: input.filename,
      mediaType: input.mediaType,
      content,
      contentHash,
    });
    try {
      const certificate = await this.repository.anchor({
        organizationId: input.organizationId,
        itemId: input.itemId,
        kind: input.kind,
        filename: input.filename,
        mediaType: input.mediaType,
        contentHash,
        mongoDocumentId,
      });
      if (certificate === "TENANT_MISMATCH")
        throw new DomainError("TENANT_MISMATCH");
      this.telemetry.record({
        event: "certificate.anchored",
        organizationId: input.organizationId,
        kind: input.kind,
      });
      return certificate;
    } catch (error) {
      await this.store.delete(mongoDocumentId);
      throw error;
    }
  }
  async verify(raw: unknown) {
    const input = certificateInput
      .pick({ organizationId: true, itemId: true, contentBase64: true })
      .parse(raw);
    const contentHash = createHash("sha256")
      .update(Buffer.from(input.contentBase64, "base64"))
      .digest("hex");
    return {
      verified: await this.repository.verify({
        organizationId: input.organizationId,
        itemId: input.itemId,
        contentHash,
      }),
      contentHash,
    };
  }
}
