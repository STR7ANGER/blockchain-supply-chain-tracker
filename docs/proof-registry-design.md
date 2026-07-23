# Proof registry design

The Rust proof registry stores only organization scope, subject identity, 32-byte document hash, authority, and sequence. Raw documents and customer data remain off-chain. Register and revoke operations require the current organization authority; duplicate subject/hash anchors are idempotent, conflicting sequence reuse is rejected, and revocation is irreversible.

Invariant tests cover authorization, duplicate replay, conflicting proof prevention, monotonic sequence, hash length, and irreversible revocation. The first implementation is a deterministic Rust domain crate and local chain sandbox. A later audited adapter may map it to a specific chain without changing API contracts.
