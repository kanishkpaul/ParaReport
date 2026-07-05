"use client";

import { useMemo, useState } from "react";
import type { CivicIssue, SeasonalModeId } from "@/types/civic";
import { buildIssueClusters } from "@/lib/clustering";
import { getModeConfig, modeColorStyle, seasonalModes } from "@/lib/modes";
import { IssueClusterCard } from "@/components/IssueClusterCard";
import { RiskFlagList } from "@/components/RiskFlagList";
import { SeverityBadge } from "@/components/SeverityBadge";

type ParaMapProps = {
  issues: CivicIssue[];
};

export function ParaMap({ issues }: ParaMapProps) {
  const [modeFilter, setModeFilter] = useState<SeasonalModeId | "all">("all");
  const clusters = useMemo(() => buildIssueClusters(issues), [issues]);
  const filteredIssues = useMemo(
    () => issues.filter((issue) => modeFilter === "all" || issue.mode === modeFilter),
    [issues, modeFilter]
  );

  return (
    <section className="map-panel" aria-label="Para map and issue list">
      <div className="section-heading">
        <span>Para map/list</span>
        <strong>Civic memory layer</strong>
      </div>

      <div className="filter-strip">
        <button
          type="button"
          className={modeFilter === "all" ? "active" : ""}
          onClick={() => setModeFilter("all")}
        >
          All
        </button>
        {seasonalModes.map((mode) => (
          <button
            type="button"
            key={mode.id}
            className={modeFilter === mode.id ? "active" : ""}
            onClick={() => setModeFilter(mode.id)}
          >
            {mode.shortName}
          </button>
        ))}
      </div>

      <div className="stylized-map" aria-hidden="true">
        <span className="river-label">Hooghly</span>
        <span className="map-pin pin-behala">Behala</span>
        <span className="map-pin pin-amherst">Amherst</span>
        <span className="map-pin pin-garia">Garia</span>
        <span className="map-pin pin-ekw">EKW</span>
      </div>

      <div className="issue-list">
        {filteredIssues.map((issue) => (
          <article className="issue-card" key={issue.id} style={modeColorStyle(issue.mode)}>
            <div className="issue-card-header">
              <div>
                <span>{getModeConfig(issue.mode).shortName}</span>
                <h3>{issue.title}</h3>
              </div>
              <SeverityBadge severity={issue.severity} />
            </div>
            <p>{issue.cleanSummary}</p>
            <RiskFlagList flags={issue.riskFlags.slice(0, 3)} />
            <div className="issue-meta">
              <span>{issue.locationText}</span>
              <span>{issue.ward}</span>
              <span>{issue.unresolvedConfirmations} unresolved</span>
            </div>
            <div className="mini-actions">
              <button type="button">Still unresolved</button>
              <button type="button">Fixed with proof</button>
            </div>
          </article>
        ))}
      </div>

      <div className="cluster-list">
        {clusters.map((cluster) => (
          <IssueClusterCard key={cluster.id} cluster={cluster} />
        ))}
      </div>
    </section>
  );
}
