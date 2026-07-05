import type { CivicIntelligence } from "@/types/civic";

type IntelligencePanelProps = {
  intelligence: CivicIntelligence;
};

export function IntelligencePanel({ intelligence }: IntelligencePanelProps) {
  return (
    <section className="intelligence-panel" aria-label="Advanced civic intelligence">
      <div className="section-heading">
        <span>Civic intelligence</span>
        <strong>{intelligence.timeSensitivity}</strong>
      </div>

      <div className="intel-hero">
        <div>
          <span>Mode rationale</span>
          <p>{intelligence.modeRationale}</p>
        </div>
        <div>
          <span>Memory graph</span>
          <p>{intelligence.duplicateInsight}</p>
        </div>
      </div>

      <div className="intel-grid">
        <IntelList title="Escalation path" items={intelligence.escalationPath} numbered />
        <IntelList title="Evidence checks" items={intelligence.evidenceChecks} />
        <IntelList title="Privacy guardrails" items={intelligence.privacyRedactions} />
        <IntelList title="Export channels" items={intelligence.exportFormats} />
      </div>

      <div className="impact-row">
        <span>Impact radius</span>
        <strong>{intelligence.impactRadius}</strong>
      </div>
    </section>
  );
}

function IntelList({
  title,
  items,
  numbered = false
}: {
  title: string;
  items: string[];
  numbered?: boolean;
}) {
  const ListTag = numbered ? "ol" : "ul";

  return (
    <div className="intel-list">
      <h3>{title}</h3>
      <ListTag>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </div>
  );
}
