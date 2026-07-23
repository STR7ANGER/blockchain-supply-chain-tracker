# Recalls, impact tracing, and notifications

Recall creation accepts a tenant-owned batch or product, resolves every affected serialized item, writes a `RECALLED` hash-chain event per item, and creates one notification outbox job per current facility in the same transaction. A target with no items is rejected rather than creating a misleading empty recall.

Facilities acknowledge once; retries replay the acknowledgment and affected items at that facility receive `RECALL_ACKNOWLEDGED` evidence. Workers atomically claim pending notification jobs with `FOR UPDATE SKIP LOCKED`, retry with exponential delay, and stop after five failures. Provider delivery is outside the transaction and requires the admin worker credential.

Alerts cover critical recalls without jobs, notification age over five minutes, terminal failures, and acknowledgment coverage.
