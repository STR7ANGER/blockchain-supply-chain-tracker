import { describe, expect, it } from "vitest";
import {
  type CustodyRepository,
  CustodyService,
} from "../src/modules/custody/service.js";

class Memory implements CustodyRepository {
  events = new Map<string, unknown>();
  append(input: Parameters<CustodyRepository["append"]>[0]) {
    const existing = this.events.get(input.eventId);
    if (existing) return Promise.resolve({ replayed: true, event: existing });
    const event = { kind: input.kind, itemId: input.itemId };
    this.events.set(input.eventId, event);
    return Promise.resolve({ replayed: false, event });
  }
}
const secret = "command-secret-that-is-at-least-32-bytes";
const body = JSON.stringify({
  eventId: "event-1",
  organizationId: "org",
  itemId: "item",
  fromFacilityId: "factory",
  toFacilityId: "warehouse",
  kind: "SHIPPED",
  occurredAt: "2030-01-02T10:00:00Z",
  condition: { temperatureC: 4 },
});
describe("signed custody commands", () => {
  it("rejects unsigned commands and replays exact event IDs", async () => {
    const service = new CustodyService(new Memory(), secret);
    await expect(service.command(body, "bad")).rejects.toMatchObject({
      code: "INVALID_COMMAND_SIGNATURE",
    });
    const signature = service.signature(body);
    await expect(service.command(body, signature)).resolves.toMatchObject({
      replayed: false,
    });
    await expect(service.command(body, signature)).resolves.toMatchObject({
      replayed: true,
    });
  });
  it("does not log signed payload content", async () => {
    const events: Record<string, unknown>[] = [];
    const service = new CustodyService(new Memory(), secret, {
      record: (event) => events.push(event),
    });
    await service.command(body, service.signature(body));
    expect(JSON.stringify(events)).not.toContain("temperatureC");
    expect(JSON.stringify(events)).not.toContain(secret);
  });
});
