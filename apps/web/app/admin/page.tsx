import Link from "next/link";
import { OnboardingConsole } from "./console";
export default function AdminPage() {
  return (
    <main>
      <nav>
        <Link href="/">TRACEPROOF</Link>
        <span>
          <Link href="/dashboard">Impact dashboard</Link> ·{" "}
          <Link href="/verify">Public verification</Link>
        </span>
      </nav>
      <header className="page-header">
        <p className="eyebrow">OPERATIONS</p>
        <h1>Build the provenance graph.</h1>
        <p>
          Bootstrap tenants and register facilities, suppliers, products,
          batches, and serialized identities.
        </p>
      </header>
      <OnboardingConsole />
    </main>
  );
}
