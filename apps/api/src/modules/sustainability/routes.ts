import { type Context, Hono } from "hono";
import { ZodError } from "zod";
import { DomainError } from "../catalog/service.js";
import type { SustainabilityService } from "./service.js";
export const createSustainabilityRoutes = (
  service: SustainabilityService,
  adminKey: string,
) => {
  const routes = new Hono();
  const admin = (context: Context, action: () => Promise<unknown>) =>
    context.req.header("x-admin-key") !== adminKey
      ? context.json({ error: { code: "FORBIDDEN" } }, 403)
      : respond(context, action);
  routes.post("/events", (c) => admin(c, () => service.record(c.req.json())));
  routes.get("/summary", (c) =>
    admin(c, () => service.summary(c.req.query("organizationId"))),
  );
  routes.get("/export.csv", async (c) => {
    if (c.req.header("x-admin-key") !== adminKey)
      return c.json({ error: { code: "FORBIDDEN" } }, 403);
    c.header("content-type", "text/csv");
    return c.body(await service.csv(c.req.query("organizationId")));
  });
  return routes;
};
async function respond(context: Context, action: () => Promise<unknown>) {
  try {
    return context.json(await action());
  } catch (error) {
    if (error instanceof DomainError)
      return context.json({ error: { code: error.code } }, error.status);
    if (error instanceof ZodError)
      return context.json(
        { error: { code: "INVALID_REQUEST", issues: error.issues } },
        400,
      );
    throw error;
  }
}
