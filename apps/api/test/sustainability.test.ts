import { describe, expect, it } from "vitest";
import { Metrics } from "../src/metrics.js";
import {
  type SustainabilityRepository,
  SustainabilityService,
} from "../src/modules/sustainability/service.js";

class SustainabilityMemory implements SustainabilityRepository {
  events = new Set<string>();
  record(input: Parameters<SustainabilityRepository["record"]>[0]) {
    if (this.events.has(input.eventId))
      return Promise.resolve({ replayed: true, id: "metric" });
    this.events.add(input.eventId);
    return Promise.resolve({ replayed: false, id: "metric" });
  }
  summary() {
    return Promise.resolve([
      {
        event: "RECYCLED",
        count: 2,
        weightGrams: 3000,
        carbonAvoidedGrams: 900,
      },
    ]);
  }
}
describe("end-of-life sustainability", () => {
  it("replays events and exports deterministic CSV", async () => {
    const service = new SustainabilityService(
      new SustainabilityMemory(),
      new Metrics(),
    );
    const input = {
      eventId: "eol-1",
      organizationId: "org",
      itemId: "item",
      event: "RECYCLED",
      weightGrams: 1500,
      carbonAvoidedGrams: 450,
      occurredAt: "2030-02-01T10:00:00Z",
    };
    await expect(service.record(input)).resolves.toMatchObject({
      replayed: false,
    });
    await expect(service.record(input)).resolves.toMatchObject({
      replayed: true,
    });
    expect(await service.csv("org")).toBe(
      "event,count,weight_grams,carbon_avoided_grams\nRECYCLED,2,3000,900\n",
    );
  });
  it("rejects unbounded metric values", async () => {
    const service = new SustainabilityService(
      new SustainabilityMemory(),
      new Metrics(),
    );
    await expect(
      service.record({
        eventId: "bad",
        organizationId: "org",
        itemId: "item",
        event: "RECYCLED",
        weightGrams: -1,
        carbonAvoidedGrams: 0,
        occurredAt: "2030-02-01T10:00:00Z",
      }),
    ).rejects.toBeDefined();
  });
});
