import Link from "next/link";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export default async function VerifyItem({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const response = await fetch(
    `${api}/v1/public/items/${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  if (!response.ok)
    return (
      <main>
        <nav>
          <Link href="/">TRACEPROOF</Link>
        </nav>
        <section className="hero">
          <h1>Item not verified.</h1>
          <p>The token is invalid, expired, or the service is unavailable.</p>
        </section>
      </main>
    );
  const item = (await response.json()) as {
    serial: string;
    batch: { lotCode: string; product: { name: string; sku: string } };
    events: Array<{ kind: string; occurredAt: string; chainHash: string }>;
  };
  return (
    <main>
      <nav>
        <Link href="/">TRACEPROOF</Link>
        <b>VERIFIED RECORD</b>
      </nav>
      <header className="page-header">
        <p className="eyebrow">{item.batch.product.sku}</p>
        <h1>{item.batch.product.name}</h1>
        <p>
          Serial {item.serial} · Lot {item.batch.lotCode}
        </p>
      </header>
      <ol className="timeline">
        {item.events.map((event) => (
          <li key={event.chainHash}>
            <b>{event.kind.replaceAll("_", " ")}</b>
            <time dateTime={event.occurredAt}>
              {new Date(event.occurredAt).toLocaleString()}
            </time>
            <code>{event.chainHash.slice(0, 16)}…</code>
          </li>
        ))}
      </ol>
    </main>
  );
}
