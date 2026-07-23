import Link from "next/link";
export default function Home() {
  return (
    <main>
      <nav>
        <strong>TRACEPROOF</strong>
        <span>
          <Link href="/verify">Verify</Link> ·{" "}
          <Link href="/admin">Operations</Link>
        </span>
      </nav>
      <section className="hero">
        <p className="eyebrow">VERIFIABLE SUPPLY CHAINS</p>
        <h1>Every handoff leaves proof.</h1>
        <p>
          Register serialized goods, follow custody, validate certificates,
          target recalls, and record responsible end-of-life outcomes.
        </p>
        <Link className="primary" href="/verify">
          Verify an item
        </Link>
      </section>
      <section className="grid">
        <article>
          <b>01</b>
          <h2>Opaque identities</h2>
          <p>Public QR tokens reveal only reviewed provenance.</p>
        </article>
        <article>
          <b>02</b>
          <h2>Hash chained</h2>
          <p>Each event commits to its payload and predecessor.</p>
        </article>
        <article>
          <b>03</b>
          <h2>Tenant safe</h2>
          <p>Commands validate organization ownership at every boundary.</p>
        </article>
      </section>
    </main>
  );
}
