"use client";

import type { CivicReceipt } from "@/types/civic";
import { getModeConfig, modeColorStyle } from "@/lib/modes";
import { RiskFlagList } from "@/components/RiskFlagList";
import { SeverityBadge } from "@/components/SeverityBadge";

type CivicReceiptCardProps = {
  receipt?: CivicReceipt;
};

export function CivicReceiptCard({ receipt }: CivicReceiptCardProps) {
  if (!receipt) {
    return (
      <section className="receipt empty-receipt">
        <span className="receipt-kicker">Civic receipt preview</span>
        <h2>Analyze a report to generate a structured packet.</h2>
        <p>
          The receipt will show mode, severity, risk flags, department routing,
          citizen actions, volunteer checklist, Bengali share text, and an
          official English complaint.
        </p>
      </section>
    );
  }

  const mode = getModeConfig(receipt.mode);

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <section className="receipt" style={modeColorStyle(receipt.mode)}>
      <div className="receipt-header">
        <div>
          <span className="receipt-kicker">Civic receipt</span>
          <h2>{receipt.publicTitle}</h2>
        </div>
        <div className="receipt-meta">
          <span className="mode-tag">{mode.shortName}</span>
          <SeverityBadge severity={receipt.severity} />
        </div>
      </div>

      <p className="receipt-summary">{receipt.evidenceSummary}</p>

      {receipt.publicSafetyWarning ? (
        <div className="warning-card">
          <strong>Public warning</strong>
          <p>{receipt.publicSafetyWarning}</p>
        </div>
      ) : null}

      <div className="receipt-grid">
        <div>
          <h3>Risk flags</h3>
          <RiskFlagList flags={receipt.riskFlags} />
        </div>
        <div>
          <h3>Departments</h3>
          <ul className="plain-list">
            {receipt.departmentSuggestions.map((department) => (
              <li key={department}>{department}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="receipt-grid">
        <ActionList title="Citizen safe actions" actions={receipt.citizenSafeActions} />
        <ActionList title="Volunteer / club checklist" actions={receipt.volunteerActions} />
      </div>

      <div className="text-packet">
        <div className="packet-heading">
          <h3>Official English complaint</h3>
          <button type="button" onClick={() => copyText(receipt.officialEnglishComplaint)}>
            Copy
          </button>
        </div>
        <p>{receipt.officialEnglishComplaint}</p>
      </div>

      <div className="text-packet bengali">
        <div className="packet-heading">
          <h3>Bengali share text</h3>
          <button type="button" onClick={() => copyText(receipt.bengaliShareText)}>
            Copy
          </button>
        </div>
        <p>{receipt.bengaliShareText}</p>
      </div>
    </section>
  );
}

function ActionList({ title, actions }: { title: string; actions: string[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul className="plain-list">
        {actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </div>
  );
}
