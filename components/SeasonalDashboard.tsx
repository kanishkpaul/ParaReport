import type { CivicIssue } from "@/types/civic";
import { getModeConfig, seasonalModes } from "@/lib/modes";

type SeasonalDashboardProps = {
  issues: CivicIssue[];
};

export function SeasonalDashboard({ issues }: SeasonalDashboardProps) {
  return (
    <section className="seasonal-dashboard">
      <div className="section-heading">
        <span>Seasonal queues</span>
        <strong>Mode-specific operations</strong>
      </div>
      <div className="seasonal-grid">
        {seasonalModes.map((mode) => {
          const modeIssues = issues.filter((issue) => issue.mode === mode.id);
          const critical = modeIssues.filter((issue) => issue.severity === "critical").length;

          return (
            <article className="season-cell" key={mode.id}>
              <span style={{ color: getModeConfig(mode.id).primaryColor }}>{mode.shortName}</span>
              <strong>{modeIssues.length}</strong>
              <p>{critical} critical, {mode.dashboardLabel.toLowerCase()}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
