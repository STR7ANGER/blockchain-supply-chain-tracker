import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { parseEnvironment } from "./env.js";
import { Metrics } from "./metrics.js";
import { PrismaCatalogRepository } from "./modules/catalog/prisma-repository.js";
import { CatalogService } from "./modules/catalog/service.js";

const environment = parseEnvironment(process.env);
const metrics = new Metrics();
const telemetry = {
  record: (event: Record<string, unknown>) =>
    console.info(JSON.stringify({ level: "info", ...event })),
};
const catalog = new CatalogService(
  new PrismaCatalogRepository(),
  environment.WEB_URL,
  telemetry,
);
serve({
  fetch: createApp({
    catalog,
    adminKey: environment.ADMIN_API_KEY,
    metrics,
    operatorToken: environment.OPERATOR_METRICS_TOKEN,
  }).fetch,
  port: environment.PORT,
});
console.info(
  JSON.stringify({
    level: "info",
    event: "server.started",
    port: environment.PORT,
  }),
);
