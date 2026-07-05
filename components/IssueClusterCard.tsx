import { getModeConfig } from "@/lib/modes";
import type { IssueCluster } from "@/lib/clustering";

type IssueClusterCardProps = {
  cluster: IssueCluster;
};

export function IssueClusterCard({ cluster }: IssueClusterCardProps) {
  const lead = cluster.issues[0];
  const mode = getModeConfig(lead.mode);

  return (
    <article className="cluster-card">
      <div>
        <span className="cluster-kicker">{mode.shortName} duplicate cluster</span>
        <h3>{cluster.title}</h3>
      </div>
      <p>
        {cluster.issueCount} reports from {cluster.areas[0]}
        {cluster.wards[0] ? ` in ${cluster.wards[0]}` : ""}. {cluster.unresolvedCount} still
        unresolved.
      </p>
      <div className="cluster-stats">
        <span>{cluster.issueCount} reports</span>
        <span>{cluster.criticalCount} critical</span>
        <span>Updated {formatDate(cluster.latestUpdatedAt)}</span>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return value.slice(0, 10);
}
