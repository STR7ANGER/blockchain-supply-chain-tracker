import { sustainabilityInput } from "@provenance/contracts";
import type { Metrics } from "../../metrics.js";
import { DomainError } from "../catalog/service.js";
export interface SustainabilityRepository {
  record(input: {
    eventId: string;
    organizationId: string;
    itemId: string;
    event: "RECYCLED" | "REUSED" | "DISPOSED";
    weightGrams: number;
    carbonAvoidedGrams: number;
    occurredAt: Date;
  }): Promise<
    { replayed: boolean; id: string } | "TENANT_MISMATCH" | "OUT_OF_ORDER"
  >;
  summary(organizationId: string): Promise<
    Array<{
      event: string;
      weightGrams: number;
      carbonAvoidedGrams: number;
      count: number;
    }>
  >;
}
export class SustainabilityService {
  constructor(
    private repository: SustainabilityRepository,
    private metrics: Metrics,
  ) {}
  async record(raw: unknown) {
    const input = sustainabilityInput.parse(raw);
    const result = await this.repository.record({
      ...input,
      occurredAt: new Date(input.occurredAt),
    });
    if (result === "TENANT_MISMATCH") throw new DomainError("TENANT_MISMATCH");
    if (result === "OUT_OF_ORDER")
      throw new DomainError("OUT_OF_ORDER_EVENT", 409);
    this.metrics.increment("end_of_life_total", {
      event: input.event.toLowerCase(),
    });
    return result;
  }
  summary(organizationId?: string) {
    if (!organizationId) throw new DomainError("ORGANIZATION_REQUIRED");
    return this.repository.summary(organizationId);
  }
  async csv(organizationId?: string) {
    const rows = await this.summary(organizationId);
    return `${[
      "event,count,weight_grams,carbon_avoided_grams",
      ...rows.map(
        (row) =>
          `${row.event},${row.count},${row.weightGrams},${row.carbonAvoidedGrams}`,
      ),
    ].join("\n")}\n`;
  }
}
