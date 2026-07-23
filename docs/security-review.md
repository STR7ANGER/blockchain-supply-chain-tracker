# Security and tamper review

| Threat | Control | Remaining production action |
|---|---|---|
| Cross-tenant references | ownership lookup plus relational foreign keys | replace bootstrap key with identity-backed RBAC and policy tests |
| Forged custody command | constant-time HMAC over exact bytes | rotate provider-specific keys and add replay-window monitoring |
| Duplicate logistics event | unique external ID plus transactional replay | provider reconciliation and dead-letter UI |
| Modified/deleted/reordered provenance | SHA-256 payload and predecessor chain, verified in Go and TypeScript | anchor periodic roots to an audited chain adapter |
| Malicious certificate | size, allowlist, magic bytes, quarantine metadata, content hash | malware scanning and private object-store controls |
| Public data disclosure | random token hash and reviewed projection | rate limiting, abuse detection, retention review |
| Notification duplication | unique recall/facility outbox and atomic claim | provider idempotency keys and delivery receipts |

No custom cryptographic primitive is used. This is an engineering review, not an independent smart-contract or supply-chain audit. Mainnet anchoring and legal authenticity claims remain out of scope until external review, managed authorities, monitoring, and recovery ownership exist.
