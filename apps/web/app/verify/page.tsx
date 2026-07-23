import Link from "next/link";
export default function VerifyLanding() {
  return (
    <main>
      <nav>
        <Link href="/">TRACEPROOF</Link>
        <Link href="/admin">Operations</Link>
      </nav>
      <section className="hero">
        <p className="eyebrow">PUBLIC CHECK</p>
        <h1>Scan trust, not marketing.</h1>
        <p>
          Open the unique QR URL attached to an item. Public tokens are opaque
          and never expose internal tenant credentials.
        </p>
      </section>
    </main>
  );
}
