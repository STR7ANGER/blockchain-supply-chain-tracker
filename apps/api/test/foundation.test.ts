import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { parseEnvironment } from "../src/env.js";
import { Metrics } from "../src/metrics.js";

const env = {
  WEB_URL: "http://localhost:3000",
  API_URL: "http://localhost:3001",
  DATABASE_URL: "postgresql://user:pass@localhost/db",
  MONGODB_URI: "mongodb://localhost:27017/db",
  REDIS_URL: "redis://localhost:6379",
  SESSION_SECRET: "s".repeat(32),
  ADMIN_API_KEY: "a".repeat(32),
  COMMAND_SIGNING_SECRET: "c".repeat(32),
  OPERATOR_METRICS_TOKEN: "o".repeat(32),
};
describe("foundation", () => {
  it("validates every server secret", () => {
    expect(parseEnvironment(env).PORT).toBe(3001);
    expect(() =>
      parseEnvironment({ ...env, COMMAND_SIGNING_SECRET: "short" }),
    ).toThrow();
  });
  it("exposes bounded health and protected metrics", async () => {
    const metrics = new Metrics();
    metrics.increment("test_total", { result: "ok" });
    const app = createApp({ metrics, operatorToken: "o".repeat(32) });
    await expect((await app.request("/health")).json()).resolves.toMatchObject({
      status: "ok",
      eventContract: "v1",
    });
    expect((await app.request("/internal/metrics")).status).toBe(403);
    expect(
      await (
        await app.request("/internal/metrics", {
          headers: { authorization: `Bearer ${"o".repeat(32)}` },
        })
      ).text(),
    ).toContain("provenance_test_total");
  });
});
