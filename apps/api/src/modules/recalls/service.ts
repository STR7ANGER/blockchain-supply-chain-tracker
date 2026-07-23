import { recallAcknowledge, recallInput } from "@provenance/contracts";
import type { Metrics } from "../../metrics.js";
import { DomainError } from "../catalog/service.js";
export interface RecallRepository {
  create(input: {
    organizationId: string;
    batchId?: string;
    productId?: string;
    reason: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }): Promise<
    | { id: string; impactedItems: number; notifiedFacilities: number }
    | "TENANT_MISMATCH"
    | "NO_IMPACTED_ITEMS"
  >;
  acknowledge(
    recallId: string,
    input: { facilityId: string; note?: string },
  ): Promise<{ replayed: boolean } | "TENANT_MISMATCH">;
  list(organizationId: string): Promise<unknown>;
  claimJobs(limit: number): Promise<unknown>;
  completeJob(
    id: string,
    succeeded: boolean,
    errorCode?: string,
  ): Promise<void>;
}
export class RecallService {
  constructor(
    private repository: RecallRepository,
    private metrics: Metrics,
  ) {}
  async create(raw: unknown) {
    const input = recallInput.parse(raw);
    const result = await this.repository.create({
      organizationId: input.organizationId,
      reason: input.reason,
      severity: input.severity,
      ...(input.batchId ? { batchId: input.batchId } : {}),
      ...(input.productId ? { productId: input.productId } : {}),
    });
    if (result === "TENANT_MISMATCH") throw new DomainError("TENANT_MISMATCH");
    if (result === "NO_IMPACTED_ITEMS")
      throw new DomainError("NO_IMPACTED_ITEMS", 409);
    this.metrics.increment("recalls_total", {
      severity: input.severity.toLowerCase(),
    });
    return result;
  }
  async acknowledge(recallId: string, raw: unknown) {
    const input = recallAcknowledge.parse(raw);
    const result = await this.repository.acknowledge(recallId, {
      facilityId: input.facilityId,
      ...(input.note ? { note: input.note } : {}),
    });
    if (result === "TENANT_MISMATCH") throw new DomainError("TENANT_MISMATCH");
    return result;
  }
  list(organizationId?: string) {
    if (!organizationId) throw new DomainError("ORGANIZATION_REQUIRED");
    return this.repository.list(organizationId);
  }
  claimJobs(limit: number) {
    return this.repository.claimJobs(Math.max(1, Math.min(100, limit)));
  }
  async completeJob(id: string, succeeded: boolean, errorCode?: string) {
    await this.repository.completeJob(id, succeeded, errorCode);
    return { completed: true };
  }
}
