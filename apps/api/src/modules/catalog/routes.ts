import { type Context, Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";
import { type CatalogService, DomainError } from "./service.js";
export const createCatalogRoutes = (
  service: CatalogService,
  adminKey: string,
) => {
  const routes = new Hono();
  const admin = async (context: Context, action: () => Promise<unknown>) =>
    context.req.header("x-admin-key") !== adminKey
      ? context.json({ error: { code: "FORBIDDEN" } }, 403)
      : respond(context, action, 201);
  routes.post("/organizations", (c) =>
    admin(c, () => service.createOrganization(c.req.json())),
  );
  routes.post("/facilities", (c) =>
    admin(c, () => service.createFacility(c.req.json())),
  );
  routes.post("/suppliers", (c) =>
    admin(c, () => service.createSupplier(c.req.json())),
  );
  routes.post("/products", (c) =>
    admin(c, () => service.createProduct(c.req.json())),
  );
  routes.post("/batches", (c) =>
    admin(c, () => service.createBatch(c.req.json())),
  );
  routes.post("/items", (c) =>
    admin(c, () => service.createItem(c.req.json())),
  );
  routes.get("/catalog", (c) =>
    c.req.header("x-admin-key") !== adminKey
      ? c.json({ error: { code: "FORBIDDEN" } }, 403)
      : respond(c, () => service.catalog(c.req.query("organizationId"))),
  );
  return routes;
};
export const createPublicRoutes = (service: CatalogService) => {
  const routes = new Hono();
  routes.get("/items/:token", (c) =>
    respond(c, () => service.publicItem(c.req.param("token"))),
  );
  return routes;
};
async function respond(
  context: Context,
  action: () => Promise<unknown>,
  status: ContentfulStatusCode = 200,
) {
  try {
    return context.json(await action(), status);
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
