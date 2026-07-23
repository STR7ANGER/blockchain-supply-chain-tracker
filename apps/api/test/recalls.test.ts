import { describe, expect, it } from "vitest";
import { Metrics } from "../src/metrics.js";
import {
  type RecallRepository,
  RecallService,
} from "../src/modules/recalls/service.js";

class RecallMemory implements RecallRepository {
  acknowledged = false;
  create(input: { batchId?: string }) {
    return Promise.resolve(
      input.batchId === "missing"
        ? ("NO_IMPACTED_ITEMS" as const)
        : { id: "recall", impactedItems: 4, notifiedFacilities: 2 },
    );
  }
  acknowledge() {
    if (this.acknowledged) return Promise.resolve({ replayed: true });
    this.acknowledged = true;
    return Promise.resolve({ replayed: false });
  }
  list() {
    return Promise.resolve([]);
  }
  claimJobs() {
    return Promise.resolve([{ id: "job" }]);
  }
  completeJob() {
    return Promise.resolve();
  }
}
describe("recall impact and acknowledgment", () => {
  it("rejects empty impact and counts notification targets", async () => {
    const service = new RecallService(new RecallMemory(), new Metrics());
    await expect(
      service.create({
        organizationId: "org",
        batchId: "missing",
        reason: "Confirmed contamination in batch.",
        severity: "CRITICAL",
      }),
    ).rejects.toMatchObject({ code: "NO_IMPACTED_ITEMS" });
    await expect(
      service.create({
        organizationId: "org",
        batchId: "batch",
        reason: "Confirmed contamination in batch.",
        severity: "CRITICAL",
      }),
    ).resolves.toMatchObject({ impactedItems: 4, notifiedFacilities: 2 });
  });
  it("makes facility acknowledgments idempotent", async () => {
    const service = new RecallService(new RecallMemory(), new Metrics());
    await expect(
      service.acknowledge("recall", { facilityId: "facility" }),
    ).resolves.toEqual({ replayed: false });
    await expect(
      service.acknowledge("recall", { facilityId: "facility" }),
    ).resolves.toEqual({ replayed: true });
  });
});
