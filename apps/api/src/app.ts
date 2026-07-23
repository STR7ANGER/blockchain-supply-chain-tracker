import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import type { Metrics } from "./metrics.js";
import {
  createCatalogRoutes,
  createPublicRoutes,
} from "./modules/catalog/routes.js";
import type { CatalogService } from "./modules/catalog/service.js";
import { createCertificateRoutes } from "./modules/certificates/routes.js";
import type { CertificateService } from "./modules/certificates/service.js";
import { createCustodyRoutes } from "./modules/custody/routes.js";
import type { CustodyService } from "./modules/custody/service.js";
export const createApp = (
  options: {
    catalog?: CatalogService;
    custody?: CustodyService;
    certificates?: CertificateService;
    graph?: { fetch(request: Request): Response | Promise<Response> };
    adminKey?: string;
    metrics?: Metrics;
    operatorToken?: string;
  } = {},
) => {
  const app = new Hono();
  app.use("*", requestId());
  app.use(
    "*",
    cors({ origin: process.env.WEB_URL ?? "http://localhost:3000" }),
  );
  app.use("*", async (context, next) => {
    const start = performance.now();
    await next();
    console.info(
      JSON.stringify({
        level: "info",
        event: "http.completed",
        requestId: context.get("requestId"),
        method: context.req.method,
        route: context.req.path.startsWith("/v1/") ? "/v1/*" : context.req.path,
        status: context.res.status,
        durationMs: Math.round(performance.now() - start),
      }),
    );
  });
  app.get("/health", (c) =>
    c.json({ status: "ok", service: "provenance-api", eventContract: "v1" }),
  );
  if (options.metrics && options.operatorToken)
    app.get("/internal/metrics", (c) => {
      if (c.req.header("authorization") !== `Bearer ${options.operatorToken}`)
        return c.json({ error: { code: "FORBIDDEN" } }, 403);
      c.header("content-type", "text/plain; version=0.0.4");
      return c.body(options.metrics?.render() ?? "");
    });
  if (options.catalog && options.adminKey)
    app.route(
      "/v1/admin",
      createCatalogRoutes(options.catalog, options.adminKey),
    );
  if (options.catalog)
    app.route("/v1/public", createPublicRoutes(options.catalog));
  if (options.custody)
    app.route("/v1/custody", createCustodyRoutes(options.custody));
  if (options.certificates && options.adminKey)
    app.route(
      "/v1/certificates",
      createCertificateRoutes(options.certificates, options.adminKey),
    );
  if (options.graph)
    app.on(
      ["GET", "POST"],
      "/graphql",
      (c) => options.graph?.fetch(c.req.raw) ?? c.notFound(),
    );
  return app;
};
