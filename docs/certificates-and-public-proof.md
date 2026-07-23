# Certificates, document storage, and public proof

Certificate uploads accept only PDF, PNG, or JPEG payloads up to 5 MB. Declared media type must match file magic before MongoDB storage. MongoDB stores the binary plus flexible quarantine metadata; PostgreSQL stores the immutable SHA-256 anchor, reviewed fields, and provenance event. If the PostgreSQL anchor fails, the newly inserted Mongo document is removed.

Verification recomputes the hash from supplied bytes and marks only an exact tenant/item anchor as verified. Public REST and GraphQL expose reviewed filenames, kinds, hashes, and verification timestamps, never raw document bytes or Mongo identifiers.

The `/graphql` provenance query composes identity, batch, custody timeline, certificates, and sustainability. REST remains the boundary for uploads, scans, and signed commands.
