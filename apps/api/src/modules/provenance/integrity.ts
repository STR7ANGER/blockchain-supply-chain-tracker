import { createHash } from "node:crypto";
export type ChainEvent = {
  kind: string;
  occurredAt: string | Date;
  payloadHash: string;
  chainHash: string;
};
export const calculateChainHash = (
  previous: string,
  event: Omit<ChainEvent, "chainHash">,
) =>
  createHash("sha256")
    .update(
      `${previous}:${event.payloadHash}:${event.kind}:${new Date(event.occurredAt).toISOString()}`,
    )
    .digest("hex");
export function verifyChain(events: ChainEvent[]) {
  let previous = "";
  for (const event of events) {
    if (event.chainHash !== calculateChainHash(previous, event)) return false;
    previous = event.chainHash;
  }
  return true;
}
