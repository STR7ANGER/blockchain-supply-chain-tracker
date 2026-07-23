import Link from "next/link";
import { ImpactDashboard } from "./impact-dashboard";
export default function DashboardPage() {
  return (
    <main>
      <nav>
        <Link href="/">TRACEPROOF</Link>
        <Link href="/admin">Catalog</Link>
      </nav>
      <header className="page-header">
        <p className="eyebrow">IMPACT CONTROL</p>
        <h1>Recall precisely. Recover responsibly.</h1>
        <p>
          Trace affected serialized items, monitor acknowledgments, and account
          for end-of-life material outcomes.
        </p>
      </header>
      <ImpactDashboard />
    </main>
  );
}
