import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { parseEnvironment } from "./env.js";
import { Metrics } from "./metrics.js";
import { PrismaCatalogRepository } from "./modules/catalog/prisma-repository.js";
import { CatalogService } from "./modules/catalog/service.js";
import { MongoCertificateStore } from "./modules/certificates/mongo-store.js";
import { PrismaCertificateRepository } from "./modules/certificates/prisma-repository.js";
import { CertificateService } from "./modules/certificates/service.js";
import { PrismaCustodyRepository } from "./modules/custody/prisma-repository.js";
import { CustodyService } from "./modules/custody/service.js";
import { createProvenanceGraph } from "./modules/provenance/graphql.js";

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
const custody = new CustodyService(
  new PrismaCustodyRepository(),
  environment.COMMAND_SIGNING_SECRET,
  telemetry,
);
const certificateStore = new MongoCertificateStore(environment.MONGODB_URI);
await certificateStore.connect();
const certificates = new CertificateService(
  certificateStore,
  new PrismaCertificateRepository(),
  telemetry,
);
const graph = createProvenanceGraph(catalog);
serve({
  fetch: createApp({
    catalog,
    custody,
    certificates,
    graph,
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
