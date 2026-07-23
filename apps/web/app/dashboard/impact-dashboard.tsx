"use client";
import { type FormEvent, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
type Summary = {
  event: string;
  count: number;
  weightGrams: number;
  carbonAvoidedGrams: number;
};
export function ImpactDashboard() {
  const [key, setKey] = useState("");
  const [org, setOrg] = useState("");
  const [summary, setSummary] = useState<Summary[]>([]);
  const [status, setStatus] = useState("Enter tenant credentials.");
  const headers = () => ({
    "content-type": "application/json",
    "x-admin-key": key,
  });
  async function load() {
    const response = await fetch(
      `${api}/v1/sustainability/summary?organizationId=${encodeURIComponent(org)}`,
      { headers: headers() },
    );
    if (!response.ok)
      return setStatus("Dashboard unavailable or unauthorized.");
    setSummary((await response.json()) as Summary[]);
    setStatus("Impact dashboard updated.");
  }
  async function recall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch(`${api}/v1/recalls`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        organizationId: org,
        batchId: data.get("batchId"),
        reason: data.get("reason"),
        severity: data.get("severity"),
      }),
    });
    if (!response.ok)
      return setStatus(
        "Recall could not be created. Check tenant ownership and impact.",
      );
    const result = (await response.json()) as {
      impactedItems: number;
      notifiedFacilities: number;
    };
    setStatus(
      `Recall opened for ${result.impactedItems} items across ${result.notifiedFacilities} facilities.`,
    );
  }
  async function endOfLife(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch(`${api}/v1/sustainability/events`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        eventId: crypto.randomUUID(),
        organizationId: org,
        itemId: data.get("itemId"),
        event: data.get("event"),
        weightGrams: Number(data.get("weightGrams")),
        carbonAvoidedGrams: Number(data.get("carbonAvoidedGrams")),
        occurredAt: new Date().toISOString(),
      }),
    });
    if (!response.ok) return setStatus("End-of-life record rejected.");
    await load();
  }
  return (
    <>
      <section className="admin-grid">
        <form
          className="panel form"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <h2>Dashboard access</h2>
          <label>
            Organization ID
            <input
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              required
            />
          </label>
          <label>
            Admin key
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </label>
          <button type="submit">Refresh dashboard</button>
          <p aria-live="polite">{status}</p>
        </form>
        <form className="panel form" onSubmit={recall}>
          <h2>Open recall</h2>
          <label>
            Batch ID
            <input name="batchId" required />
          </label>
          <label>
            Severity
            <select name="severity">
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>CRITICAL</option>
            </select>
          </label>
          <label>
            Reason
            <textarea name="reason" minLength={10} required />
          </label>
          <button type="submit">Trace and notify</button>
        </form>
        <form className="panel form" onSubmit={endOfLife}>
          <h2>End of life</h2>
          <label>
            Item ID
            <input name="itemId" required />
          </label>
          <label>
            Outcome
            <select name="event">
              <option>RECYCLED</option>
              <option>REUSED</option>
              <option>DISPOSED</option>
            </select>
          </label>
          <label>
            Weight (g)
            <input name="weightGrams" type="number" min="0" required />
          </label>
          <label>
            Carbon avoided (g)
            <input name="carbonAvoidedGrams" type="number" min="0" required />
          </label>
          <button type="submit">Record outcome</button>
        </form>
      </section>
      <section className="grid" aria-label="Sustainability summary">
        {summary.map((row) => (
          <article key={row.event}>
            <b>{row.event}</b>
            <h2>{row.count} items</h2>
            <p>
              {row.weightGrams} g material · {row.carbonAvoidedGrams} g CO₂e
              avoided
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
