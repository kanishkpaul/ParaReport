import { randomUUID } from "node:crypto";
import { getDb, issueToRow, rowToIssue } from "@/lib/db";
import type {
  AnalyzeIssueOutput,
  CivicIssue,
  ClusterSummary,
  DashboardStats,
  IssueStatus,
  SeasonalModeId,
  Severity
} from "@/types/civic";
import { createReceipt } from "@/lib/receipts";

const OPEN_STATUSES: IssueStatus[] = ["new", "needs_more_info", "verified", "in_progress", "duplicate"];

export type ListFilters = {
  mode?: SeasonalModeId;
  severity?: Severity;
  status?: IssueStatus | "open";
  groupId?: string;
  limit?: number;
};

export function listIssues(filters: ListFilters = {}): CivicIssue[] {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (filters.mode) {
    where.push("mode = ?");
    params.push(filters.mode);
  }

  if (filters.severity) {
    where.push("severity = ?");
    params.push(filters.severity);
  }

  if (filters.status === "open") {
    where.push(`status IN (${OPEN_STATUSES.map(() => "?").join(",")})`);
    params.push(...OPEN_STATUSES);
  } else if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }

  if (filters.groupId) {
    where.push("duplicate_group_id = ?");
    params.push(filters.groupId);
  }

  const sql = `SELECT * FROM issues ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT ?`;
  params.push(filters.limit ?? 100);

  return (getDb().prepare(sql).all(...params) as Record<string, unknown>[]).map(rowToIssue);
}

export function getIssue(id: string): CivicIssue | undefined {
  const row = getDb().prepare("SELECT * FROM issues WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;

  return row ? rowToIssue(row) : undefined;
}

export function createIssueFromAnalysis(params: {
  rawText: string;
  analysis: AnalyzeIssueOutput;
  locationText: string;
  landmark?: string;
  photoUrl?: string;
  analysisEngine: CivicIssue["analysisEngine"];
}): CivicIssue {
  const id = `issue-${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const { analysis } = params;
  const clusterMatch = findClusterMatch(params.locationText, analysis.mode);

  const issue: CivicIssue = {
    id,
    title: buildTitle(analysis, params.locationText),
    rawText: params.rawText,
    cleanSummary: analysis.cleanSummary,
    mode: analysis.mode,
    category: analysis.category,
    subcategories: analysis.subcategories,
    severity: analysis.severity,
    riskFlags: analysis.riskFlags,
    departmentSuggestions: analysis.departmentSuggestions,
    locationText: params.locationText,
    landmark: params.landmark,
    lat: clusterMatch?.lat,
    lng: clusterMatch?.lng,
    status: analysis.followUpQuestion ? "needs_more_info" : "new",
    photoUrl: params.photoUrl,
    createdAt: now,
    updatedAt: now,
    duplicateGroupId: clusterMatch?.groupId ?? newGroupId(params.locationText, analysis.mode),
    verificationCount: 1,
    unresolvedConfirmations: 0,
    receipt: createReceipt(id, analysis),
    analysisEngine: params.analysisEngine,
    isSeed: false
  };

  getDb()
    .prepare(
      `INSERT INTO issues (
        id, title, raw_text, clean_summary, mode, category, subcategories, severity,
        risk_flags, department_suggestions, location_text, landmark, ward, borough,
        lat, lng, status, photo_url, created_at, updated_at, duplicate_group_id,
        verification_count, unresolved_confirmations, fixed_proof_url, receipt,
        analysis_engine, is_seed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(...issueToRow(issue));

  return issue;
}

export function confirmUnresolved(id: string): CivicIssue | undefined {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE issues SET
        unresolved_confirmations = unresolved_confirmations + 1,
        verification_count = verification_count + 1,
        status = CASE WHEN status = 'new' THEN 'verified' ELSE status END,
        updated_at = ?
      WHERE id = ?`
    )
    .run(now, id);

  return getIssue(id);
}

export function markFixed(id: string, proofUrl?: string): CivicIssue | undefined {
  const now = new Date().toISOString();
  getDb()
    .prepare("UPDATE issues SET status = 'fixed', fixed_proof_url = COALESCE(?, fixed_proof_url), updated_at = ? WHERE id = ?")
    .run(proofUrl ?? null, now, id);

  return getIssue(id);
}

// --- clustering -------------------------------------------------------------

const STOP_TOKENS = new Set(["near", "road", "lane", "street", "the", "para", "side", "kolkata"]);

function locationTokens(locationText: string): string[] {
  return locationText
    .toLowerCase()
    .split(/[^a-zঀ-৿]+/)
    .filter((token) => token.length > 3 && !STOP_TOKENS.has(token));
}

export function findClusterMatch(
  locationText: string,
  mode: SeasonalModeId
): { groupId: string; lat?: number; lng?: number } | undefined {
  const tokens = locationTokens(locationText);

  if (!tokens.length) {
    return undefined;
  }

  const candidates = getDb()
    .prepare("SELECT location_text, duplicate_group_id, lat, lng FROM issues WHERE mode = ? AND duplicate_group_id IS NOT NULL ORDER BY created_at DESC LIMIT 300")
    .all(mode) as Array<{ location_text: string; duplicate_group_id: string; lat: number | null; lng: number | null }>;

  for (const candidate of candidates) {
    const candidateTokens = new Set(locationTokens(candidate.location_text));

    if (tokens.some((token) => candidateTokens.has(token))) {
      return {
        groupId: candidate.duplicate_group_id,
        lat: candidate.lat ?? undefined,
        lng: candidate.lng ?? undefined
      };
    }
  }

  return undefined;
}

function newGroupId(locationText: string, mode: SeasonalModeId) {
  const slug = locationTokens(locationText).slice(0, 2).join("-") || "unlocated";
  return `${slug}-${mode}-${randomUUID().slice(0, 4)}`;
}

export function getClusterSummary(groupId: string): ClusterSummary | undefined {
  const rows = listIssues({ groupId, limit: 500 });

  if (!rows.length) {
    return undefined;
  }

  const lead = rows[rows.length - 1];
  const severityRank: Severity[] = ["low", "medium", "high", "critical"];
  const worst = rows.reduce((acc, issue) =>
    severityRank.indexOf(issue.severity) > severityRank.indexOf(acc.severity) ? issue : acc
  );

  return {
    groupId,
    reportCount: rows.length,
    unresolvedConfirmations: rows.reduce((sum, issue) => sum + issue.unresolvedConfirmations, 0),
    firstReportedAt: lead.createdAt,
    lastReportedAt: rows[0].createdAt,
    locationText: lead.locationText,
    title: lead.title,
    severity: worst.severity,
    mode: lead.mode
  };
}

// --- dashboard --------------------------------------------------------------

export function getDashboardStats(): DashboardStats {
  const all = listIssues({ limit: 1000 });
  const open = all.filter((issue) => issue.status !== "fixed" && issue.status !== "archived");
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;

  const modeMap = new Map<SeasonalModeId, { open: number; total: number }>();

  for (const issue of all) {
    const entry = modeMap.get(issue.mode) ?? { open: 0, total: 0 };
    entry.total += 1;

    if (issue.status !== "fixed" && issue.status !== "archived") {
      entry.open += 1;
    }

    modeMap.set(issue.mode, entry);
  }

  const groupIds = Array.from(new Set(open.map((issue) => issue.duplicateGroupId).filter(Boolean))) as string[];
  const topClusters = groupIds
    .map((groupId) => getClusterSummary(groupId))
    .filter((cluster): cluster is ClusterSummary => Boolean(cluster && cluster.reportCount > 1))
    .sort((a, b) => b.reportCount - a.reportCount)
    .slice(0, 5);

  return {
    totalIssues: all.length,
    openIssues: open.length,
    criticalOpen: open.filter((issue) => issue.severity === "critical").length,
    fixedIssues: all.filter((issue) => issue.status === "fixed").length,
    reportsLast7Days: all.filter((issue) => new Date(issue.createdAt).getTime() > weekAgo).length,
    byMode: Array.from(modeMap.entries()).map(([mode, counts]) => ({ mode, ...counts })),
    topClusters,
    topUnresolved: open
      .slice()
      .sort((a, b) => b.unresolvedConfirmations - a.unresolvedConfirmations)
      .slice(0, 6)
  };
}

function buildTitle(analysis: AnalyzeIssueOutput, locationText: string) {
  const flag = analysis.riskFlags[0] || analysis.category;
  const place = locationText.split(",")[0]?.trim() || "Kolkata";
  return `${capitalize(flag)} at ${place}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
