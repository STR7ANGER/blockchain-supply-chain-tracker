import { type Context, Hono } from "hono";
import { ZodError } from "zod";
import { DomainError } from "../catalog/service.js";
import type { CertificateService } from "./service.js";
export const createCertificateRoutes = (
  service: CertificateService,
  adminKey: string,
) => {
  const routes = new Hono();
  const admin = (context: Context, action: () => Promise<unknown>) =>
    context.req.header("x-admin-key") !== adminKey
      ? context.json({ error: { code: "FORBIDDEN" } }, 403)
      : respond(context, action);
  routes.post("/", (c) => admin(c, () => service.upload(c.req.json())));
  routes.post("/verify", (c) => admin(c, () => service.verify(c.req.json())));
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
