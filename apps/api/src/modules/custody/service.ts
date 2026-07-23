import { createHmac, timingSafeEqual } from "node:crypto";
import { custodyCommand } from "@provenance/contracts";
import { DomainError } from "../catalog/service.js";
export interface CustodyRepository {
  append(input: {
    eventId: string;
    organizationId: string;
    itemId: string;
    fromFacilityId?: string | undefined;
    toFacilityId: string;
    kind: "TRANSFERRED" | "SHIPPED" | "RECEIVED" | "CONDITION_RECORDED";
    occurredAt: Date;
    condition?:
      | { temperatureC?: number | undefined; note?: string | undefined }
      | undefined;
  }): Promise<
    | { replayed: boolean; event: unknown }
    | "TENANT_MISMATCH"
    | "CUSTODY_CONFLICT"
    | "OUT_OF_ORDER"
  >;
}
export class CustodyService {
  constructor(
    private repository: CustodyRepository,
    private secret: string,
    private telemetry: { record(event: Record<string, unknown>): void } = {
      record: () => undefined,
    },
  ) {}
  signature(rawBody: string) {
    return createHmac("sha256", this.secret).update(rawBody).digest("hex");
  }
  verify(rawBody: string, supplied?: string) {
    if (!supplied) return false;
    const expected = Buffer.from(this.signature(rawBody));
    const received = Buffer.from(supplied);
    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }
  async command(rawBody: string, supplied?: string) {
    if (!this.verify(rawBody, supplied))
      throw new DomainError("INVALID_COMMAND_SIGNATURE", 401);
    let raw: unknown;
    try {
      raw = JSON.parse(rawBody);
    } catch {
      throw new DomainError("INVALID_COMMAND");
    }
    const input = custodyCommand.parse(raw);
    const result = await this.repository.append({
      eventId: input.eventId,
      organizationId: input.organizationId,
      itemId: input.itemId,
      ...(input.fromFacilityId ? { fromFacilityId: input.fromFacilityId } : {}),
      toFacilityId: input.toFacilityId,
      kind: input.kind,
      occurredAt: new Date(input.occurredAt),
      ...(input.condition ? { condition: input.condition } : {}),
    });
    if (result === "TENANT_MISMATCH") throw new DomainError("TENANT_MISMATCH");
    if (result === "CUSTODY_CONFLICT")
      throw new DomainError("CUSTODY_CONFLICT", 409);
    if (result === "OUT_OF_ORDER")
      throw new DomainError("OUT_OF_ORDER_EVENT", 409);
    this.telemetry.record({
      event: result.replayed
        ? "custody.command_replayed"
        : "custody.command_applied",
      organizationId: input.organizationId,
      kind: input.kind,
    });
    return result;
  }
}
