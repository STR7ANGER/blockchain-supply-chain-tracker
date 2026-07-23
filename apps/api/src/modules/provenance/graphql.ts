import { createSchema, createYoga } from "graphql-yoga";
import type { CatalogService } from "../catalog/service.js";
export const createProvenanceGraph = (catalog: CatalogService) =>
  createYoga({
    graphqlEndpoint: "/graphql",
    schema: createSchema({
      typeDefs: `type Query { provenance(token: String!): Provenance } type Provenance { serial: String!, batch: Batch!, events: [Event!]!, certificates: [Certificate!]!, sustainability: [Sustainability!]! } type Batch { lotCode: String!, manufacturedAt: String!, product: Product!, facility: Facility! } type Product { name: String!, sku: String! } type Facility { name: String!, countryCode: String } type Event { kind: String!, occurredAt: String!, chainHash: String!, payloadHash: String!, fromFacility: NamedFacility, toFacility: NamedFacility } type NamedFacility { name: String! } type Certificate { kind: String!, filename: String!, contentHash: String!, verifiedAt: String } type Sustainability { event: String!, weightGrams: Int!, carbonAvoidedGrams: Int!, occurredAt: String! }`,
      resolvers: {
        Query: {
          provenance: (_root, args: { token: string }) =>
            catalog.publicItem(args.token),
        },
      },
    }),
    maskedErrors: true,
  });
