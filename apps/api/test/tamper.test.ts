import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  type ChainEvent,
  calculateChainHash,
  verifyChain,
} from "../src/modules/provenance/integrity.js";

const event = (
  previous: string,
  kind: string,
  payload: string,
  occurredAt: string,
): ChainEvent => {
  const payloadHash = createHash("sha256").update(payload).digest("hex");
  return {
    kind,
    payloadHash,
    occurredAt,
    chainHash: calculateChainHash(previous, { kind, payloadHash, occurredAt }),
  };
};
describe("tamper evidence", () => {
  it("accepts the canonical event chain and detects every changed field", () => {
    const first = event(
      "",
      "ITEM_SERIALIZED",
      "identity",
      "2030-01-01T00:00:00Z",
    );
    const second = event(
      first.chainHash,
      "SHIPPED",
      "shipment",
      "2030-01-02T00:00:00Z",
    );
    expect(verifyChain([first, second])).toBe(true);
    for (const changed of [
      { ...second, payloadHash: "0".repeat(64) },
      { ...second, kind: "RECEIVED" },
      { ...second, occurredAt: "2030-01-03T00:00:00Z" },
      { ...second, chainHash: "f".repeat(64) },
    ])
      expect(verifyChain([first, changed])).toBe(false);
  });
  it("detects deletion and reordering", () => {
    const first = event(
      "",
      "ITEM_SERIALIZED",
      "identity",
      "2030-01-01T00:00:00Z",
    );
    const second = event(
      first.chainHash,
      "SHIPPED",
      "shipment",
      "2030-01-02T00:00:00Z",
    );
    const third = event(
      second.chainHash,
      "RECEIVED",
      "receipt",
      "2030-01-03T00:00:00Z",
    );
    expect(verifyChain([first, third])).toBe(false);
    expect(verifyChain([second, first, third])).toBe(false);
  });
});
