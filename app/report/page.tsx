import type { Metadata } from "next";
import { ReportFlow } from "@/components/ReportFlow";

export const metadata: Metadata = {
  title: "Report"
};

export default function ReportPage() {
  return (
    <main className="page">
      <div className="page-intro">
        <span className="intro-kicker">Local Gemma civic ops</span>
        <h1>Report a civic issue</h1>
        <p>
          One report becomes a civic receipt: severity, risk flags, department routing, a
          Bengali warning, and an official English complaint - saved to your para&apos;s memory.
        </p>
        <div className="trust-strip" aria-label="System status">
          <span>Multilingual intake</span>
          <span>On-device LLM</span>
          <span>Para memory</span>
        </div>
      </div>
      <ReportFlow />
    </main>
  );
}
