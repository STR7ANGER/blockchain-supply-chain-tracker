import { type Context, Hono } from "hono";
import { ZodError } from "zod";
import { DomainError } from "../catalog/service.js";
import type { CustodyService } from "./service.js";
export const createCustodyRoutes = (service: CustodyService) => {
  const routes = new Hono();
  routes.post("/commands", async (context) =>
    respond(context, () =>
      context.req
        .text()
        .then((body) =>
          service.command(body, context.req.header("x-command-signature")),
        ),
    ),
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
