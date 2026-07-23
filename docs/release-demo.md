# Release demo

Use synthetic data only.

1. Start dependencies with `docker compose up -d` and apply migrations.
2. Run the seed twice; both outputs must show the same organization and item IDs.
3. Start API and web processes. Open Operations and create a separate demo tenant, facility, product, batch, and serialized item.
4. Scan the generated opaque token and review the public, redacted provenance view.
5. Submit a signed shipment and receipt, anchor a small synthetic PDF certificate, and verify the same bytes.
6. Open a batch recall, show the impacted count and notification target count, then acknowledge it once and replay the acknowledgment.
7. Record a recycled outcome and export the impact CSV.
8. Run tamper, browser, load, Rust, and Go gates. Show that modified, deleted, and reordered events fail verification.

The demo proves application behavior and tamper evidence; it does not claim a mainnet deployment, legal certificate authenticity, or independently audited carbon accounting.
