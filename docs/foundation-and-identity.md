# Foundation, tenancy, identity, and event taxonomy

The repository is a modular event-driven deployment: Next.js UI, Hono gateway, PostgreSQL transactional truth, MongoDB certificate documents, Rust proof registry, and Go indexer. Services communicate through versioned contracts and hashes, not source imports.

Tenant-owned records carry `organizationId`, indexed query paths, compound uniqueness, foreign keys, and explicit cross-tenant validation before writes. The bootstrap admin key is an operational credential for this first slice; production must replace it with identity-backed role sessions while preserving OWNER/ADMIN/OPERATOR/AUDITOR/SUPPLIER authorization.

Serialized items receive a random public token; only its SHA-256 hash is stored. QR codes contain the public verification URL. Public reads expose product, batch, reviewed certificates, sustainability, and hash-chain evidence—not emails, internal IDs, raw certificates, or admin data.

Event kinds are fixed in `@provenance/contracts`. Payloads use deterministic JSON, a SHA-256 payload hash, and a chain hash committing to the prior event. Custom cryptography is out of scope.
