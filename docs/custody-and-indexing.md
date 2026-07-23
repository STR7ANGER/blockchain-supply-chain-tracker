# Custody commands and canonical indexing

Custody commands are fixed-schema JSON signed with HMAC-SHA256 over the exact request bytes. The API validates the signature in constant time, tenant ownership, current custodian, destination, chronological order, and provider event ID. PostgreSQL writes shipment state, item custody, and the hash-chained event in one serializable transaction. Exact event retries replay; conflicts never move custody.

The Go indexer is a separately runnable read-model boundary. It tracks observations by stable event ID, prefers higher-confirmation observations, orders by sequence, and rejects a chain whose predecessor or calculated hash differs. It has no command-signing capability. Production adapters must persist a durable cursor, handle chain reorganization, apply confirmation thresholds, and dead-letter malformed events.

Logs contain organization and bounded event kind only—not conditions, signatures, supplier emails, or raw payloads.
