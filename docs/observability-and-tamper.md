# Observability and tamper response

Structured request logs contain request ID, coarse route, status, and latency; they intentionally omit tokens, signatures, certificate names, request bodies, and tenant data. The authenticated Prometheus endpoint exposes bounded HTTP, recall, and sustainability counters.

Alert on elevated 5xx rate, p95 latency over 500 ms, critical recalls without notification jobs, pending notifications older than five minutes, terminal delivery failures, and decreasing acknowledgment coverage. Dashboard labels must remain bounded enums; never add IDs as metric labels.

The TypeScript, Go, and Rust checks recompute payload and predecessor commitments. On a mismatch, stop writes for the affected tenant, preserve database and chain snapshots, rotate command credentials if forgery is possible, compare the canonical indexer cursor with the registry anchor, and open an incident. Do not rewrite evidence to make verification pass. Recovery creates an explicit compensating event after review.
