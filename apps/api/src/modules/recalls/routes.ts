import { type Context, Hono } from "hono";
import { ZodError, z } from "zod";
import { DomainError } from "../catalog/service.js";
import type { RecallService } from "./service.js";

const completion = z.object({
  succeeded: z.boolean(),
  errorCode: z.string().max(80).optional(),
});
export const createRecallRoutes = (
  service: RecallService,
  adminKey: string,
) => {
  const routes = new Hono();
  const admin = (context: Context, action: () => Promise<unknown>) =>
    context.req.header("x-admin-key") !== adminKey
      ? context.json({ error: { code: "FORBIDDEN" } }, 403)
      : respond(context, action);
  routes.post("/", (c) => admin(c, () => service.create(c.req.json())));
  routes.get("/", (c) =>
    admin(c, () => service.list(c.req.query("organizationId"))),
  );
  routes.post("/:id/acknowledge", (c) =>
    admin(c, () => service.acknowledge(c.req.param("id"), c.req.json())),
  );
  routes.post("/notifications/claim", (c) =>
    admin(c, () => service.claimJobs(Number(c.req.query("limit") ?? 25))),
  );
  routes.post("/notifications/:id/complete", (c) =>
    admin(c, async () => {
      const input = completion.parse(await c.req.json());
      return service.completeJob(
        c.req.param("id"),
        input.succeeded,
        input.errorCode,
      );
    }),
  );
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
