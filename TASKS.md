# Blockchain Supply-Chain Tracker — 30-Task Execution Plan

Complete tasks in order unless a dependency is explicitly removed. Each day has 10 active tasks; unfinished work rolls forward before later tasks begin. Keep at most 10 task checkboxes marked `[~]` (in progress) at once; use `[x]` only after verification.

## Day 1 — Foundation and first vertical slice (Tasks 1–10)

- [ ] 1. Design workspace, chain sandbox, databases, Docker, CI, and event taxonomy; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 2. Implement workspace, chain sandbox, databases, Docker, CI, and event taxonomy; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 3. Verify workspace, chain sandbox, databases, Docker, CI, and event taxonomy with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 4. Design organizations, facilities, roles, suppliers, and onboarding UI; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 5. Implement organizations, facilities, roles, suppliers, and onboarding UI; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 6. Verify organizations, facilities, roles, suppliers, and onboarding UI with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 7. Design product, batch, serial identity, QR generation, and scan experience; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 8. Implement product, batch, serial identity, QR generation, and scan experience; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 9. Verify product, batch, serial identity, QR generation, and scan experience with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 10. Design Rust proof registry, hash anchoring, permissions, and invariant tests; write acceptance criteria, contracts, risks, and the smallest vertical slice.

## Day 2 — Core workflows and integrations (Tasks 11–20)

- [ ] 11. Implement Rust proof registry, hash anchoring, permissions, and invariant tests; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 12. Verify Rust proof registry, hash anchoring, permissions, and invariant tests with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 13. Design custody transfer commands, shipment events, signatures, and idempotency; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 14. Implement custody transfer commands, shipment events, signatures, and idempotency; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 15. Verify custody transfer commands, shipment events, signatures, and idempotency with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 16. Design Go chain/event indexer and canonical provenance read model; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 17. Implement Go chain/event indexer and canonical provenance read model; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 18. Verify Go chain/event indexer and canonical provenance read model with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 19. Design certificate uploads, MongoDB metadata, proof verification, and public portal; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 20. Implement certificate uploads, MongoDB metadata, proof verification, and public portal; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.

## Day 3 — Advanced behavior and production hardening (Tasks 21–30)

- [ ] 21. Verify certificate uploads, MongoDB metadata, proof verification, and public portal with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 22. Design recalls, impacted-item tracing, notifications, and acknowledgment flow; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 23. Implement recalls, impacted-item tracing, notifications, and acknowledgment flow; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 24. Verify recalls, impacted-item tracing, notifications, and acknowledgment flow with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 25. Design end-of-life events, sustainability metrics, dashboards, and exports; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 26. Implement end-of-life events, sustainability metrics, dashboards, and exports; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 27. Verify end-of-life events, sustainability metrics, dashboards, and exports with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 28. Design tamper tests, E2E supply journey, observability, security review, and deployment docs; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 29. Implement tamper tests, E2E supply journey, observability, security review, and deployment docs; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 30. Verify tamper tests, E2E supply journey, observability, security review, and deployment docs with tests, failure cases, telemetry, documentation, and a reviewable demo.

## Task completion checklist

A task is complete only when code is formatted and typed, tests pass, migrations are reproducible, UI states are handled, authorization is enforced, logs contain no secrets, and relevant docs are updated. Track blockers beneath the task instead of silently widening scope.

