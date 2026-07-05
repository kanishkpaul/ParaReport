import type { CivicIssue } from "@/types/civic";
import { buildIssueClusters } from "@/lib/clustering";
import { SeverityBadge } from "@/components/SeverityBadge";

type WardDashboardProps = {
  issues: CivicIssue[];
};

export function WardDashboard({ issues }: WardDashboardProps) {
  const clusters = buildIssueClusters(issues);
  const criticalIssues = issues.filter((issue) => issue.severity === "critical");
  const unresolved = issues.filter((issue) => issue.status !== "fixed");
  const pujoIssues = issues.filter((issue) => issue.mode === "pujo_safety" && issue.status !== "fixed");
  const winterIssues = issues.filter((issue) => issue.mode === "winter_air_dust");

  return (
    <section className="ward-dashboard">
      <div className="section-heading">
        <span>Ward dashboard</span>
        <strong>Public accountability view</strong>
      </div>

      <div className="stats-grid">
        <Stat value={unresolved.length.toString()} label="Top unresolved issues" />
        <Stat value={criticalIssues.length.toString()} label="Critical electrical-water risks" />
        <Stat value={pujoIssues.length.toString()} label="Pujo route issues pending" />
        <Stat value={winterIssues.length.toString()} label="Winter dust/burning hotspots" />
      </div>

      <div className="dashboard-columns">
        <div>
          <h3>Critical risks</h3>
          <ul className="dashboard-list">
            {criticalIssues.map((issue) => (
              <li key={issue.id}>
                <span>{issue.title}</span>
                <SeverityBadge severity={issue.severity} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Duplicate clusters</h3>
          <ul className="dashboard-list">
            {clusters.map((cluster) => (
              <li key={cluster.id}>
                <span>{cluster.title}</span>
                <strong>{cluster.issueCount} reports</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <article className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}
