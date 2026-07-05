import type { CivicIssue } from "@/types/civic";

export type IssueCluster = {
  id: string;
  title: string;
  issueCount: number;
  criticalCount: number;
  unresolvedCount: number;
  wards: string[];
  areas: string[];
  latestUpdatedAt: string;
  issues: CivicIssue[];
};

export function buildIssueClusters(issues: CivicIssue[]): IssueCluster[] {
  const grouped = new Map<string, CivicIssue[]>();

  for (const issue of issues) {
    if (!issue.duplicateGroupId) {
      continue;
    }

    const current = grouped.get(issue.duplicateGroupId) || [];
    current.push(issue);
    grouped.set(issue.duplicateGroupId, current);
  }

  return Array.from(grouped.entries()).map(([id, clusterIssues]) => {
    const sorted = [...clusterIssues].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const lead = sorted[0];

    return {
      id,
      title: lead.title,
      issueCount: clusterIssues.length,
      criticalCount: clusterIssues.filter((issue) => issue.severity === "critical").length,
      unresolvedCount: clusterIssues.filter((issue) => issue.status !== "fixed").length,
      wards: unique(clusterIssues.map((issue) => issue.ward).filter(Boolean) as string[]),
      areas: unique(clusterIssues.map((issue) => issue.locationText)),
      latestUpdatedAt: lead.updatedAt,
      issues: sorted
    };
  });
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
