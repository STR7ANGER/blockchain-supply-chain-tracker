# End-of-life and sustainability accounting

Recycling, reuse, and disposal commands require a unique external event ID, tenant-owned serialized item, nonnegative bounded mass and carbon values, and a UTC timestamp not older than the current provenance tip. PostgreSQL records the metric and the corresponding tamper-evident event atomically; retries replay without double counting.

The dashboard aggregates count, material weight, and carbon avoided by outcome. CSV export uses a fixed event enum and numeric fields, eliminating spreadsheet-formula injection. These values are declared operational data, not audited environmental claims; production reporting needs reviewed methodology, units, and independent assurance.
