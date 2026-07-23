# Deployment runbook

## Runtime topology

Deploy `Dockerfile.api` to a container platform and `Dockerfile.web` to a web platform, or configure Vercel from the repository root with `vercel.json`. PostgreSQL is authoritative for tenants, identities, events, recalls, and metrics. MongoDB stores quarantined certificate bytes and metadata. Redis is reserved for rate limiting and worker coordination.

Set every variable listed in `.env.example` using separate generated secrets. `NEXT_PUBLIC_API_URL` and `WEB_URL` must be the final HTTPS origins. Restrict database networks to the API runtime, enable encryption and backups, and never expose operator metrics publicly.

## Release order

1. Back up PostgreSQL and test restore ownership.
2. Run `npm ci`, `npm run db:generate`, and `npx prisma migrate deploy`.
3. Deploy the API, then require a successful `/health` response.
4. Deploy the web app and run `npm run test:e2e`.
5. Confirm `/internal/metrics` rejects missing credentials and accepts the operator bearer token.
6. Exercise one synthetic item journey and verify its hash chain before routing traffic.

Rollback application images independently. Database migrations are forward-only; corrective migrations are safer than destructive rollback. Stop writes first if provenance integrity is in doubt.
