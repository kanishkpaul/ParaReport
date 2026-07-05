import { ReportFlow } from "@/components/ReportFlow";

export default function Home() {
  return (
    <main className="page">
      <div className="page-intro">
        <h1>Report a civic issue</h1>
        <p>
          One report becomes a civic receipt: severity, risk flags, department routing, a
          Bengali warning, and an official English complaint — saved to your para&apos;s memory.
        </p>
      </div>
      <ReportFlow />
    </main>
  );
}
