import type { CivicIntelligence } from "@/types/civic";

type CommandCenterProps = {
  intelligence: CivicIntelligence;
};

export function CommandCenter({ intelligence }: CommandCenterProps) {
  return (
    <section className="command-center" aria-label="Civic intelligence command center">
      <div className="command-copy">
        <span>ParaOS live intelligence</span>
        <h2>{intelligence.queueLabel}</h2>
        <p>{intelligence.nextBestAction}</p>
      </div>
      <div className="command-metrics">
        <Metric label="Triage" value={intelligence.triageScore} suffix="/99" />
        <Metric label="Confidence" value={intelligence.confidenceScore} suffix="%" />
        <Metric label="Packet ready" value={intelligence.packetReadiness} suffix="%" />
      </div>
    </section>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <article className="command-metric">
      <span>{label}</span>
      <strong>
        {value}
        <small>{suffix}</small>
      </strong>
    </article>
  );
}
