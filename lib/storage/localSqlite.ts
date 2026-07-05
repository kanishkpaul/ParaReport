import { getDb, issueToRow, rowToIssue, ISSUE_INSERT_SQL } from "@/lib/db";
import type { CivicIssue, IssueStatus, SeasonalModeId } from "@/types/civic";
import type { ClusterCandidate, IssueStore, ListFilters } from "@/lib/storage/types";

const OPEN_STATUSES: IssueStatus[] = ["new", "needs_more_info", "verified", "in_progress", "duplicate"];

// SQLite-backed IssueStore. This is the default backend for local/cloned nodes.
export class LocalSqliteStore implements IssueStore {
  insert(issue: CivicIssue): void {
    getDb().prepare(ISSUE_INSERT_SQL).run(...issueToRow(issue));
  }

  get(id: string): CivicIssue | undefined {
    const row = getDb().prepare("SELECT * FROM issues WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;

    return row ? rowToIssue(row) : undefined;
  }

  has(id: string): boolean {
    const row = getDb().prepare("SELECT 1 AS present FROM issues WHERE id = ?").get(id) as
      | { present: number }
      | undefined;

    return Boolean(row);
  }

  list(filters: ListFilters): CivicIssue[] {
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

  incrementUnresolved(id: string): CivicIssue | undefined {
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

    return this.get(id);
  }

  markFixed(id: string, proofUrl?: string): CivicIssue | undefined {
    const now = new Date().toISOString();
    getDb()
      .prepare(
        "UPDATE issues SET status = 'fixed', fixed_proof_url = COALESCE(?, fixed_proof_url), updated_at = ? WHERE id = ?"
      )
      .run(proofUrl ?? null, now, id);

    return this.get(id);
  }

  clusterCandidates(mode: SeasonalModeId, limit: number): ClusterCandidate[] {
    const rows = getDb()
      .prepare(
        "SELECT location_text, duplicate_group_id, lat, lng FROM issues WHERE mode = ? AND duplicate_group_id IS NOT NULL ORDER BY created_at DESC LIMIT ?"
      )
      .all(mode, limit) as Array<{
      location_text: string;
      duplicate_group_id: string;
      lat: number | null;
      lng: number | null;
    }>;

    return rows.map((row) => ({
      locationText: row.location_text,
      groupId: row.duplicate_group_id,
      lat: row.lat ?? undefined,
      lng: row.lng ?? undefined
    }));
  }

  localIssuesSince(cursor: string | undefined, limit: number): CivicIssue[] {
    const where = ["origin_node_id IS NULL"];
    const params: Array<string | number> = [];

    if (cursor) {
      where.push("created_at > ?");
      params.push(cursor);
    }

    params.push(limit);

    return (
      getDb()
        .prepare(
          `SELECT * FROM issues WHERE ${where.join(" AND ")} ORDER BY created_at ASC, id ASC LIMIT ?`
        )
        .all(...params) as Record<string, unknown>[]
    ).map(rowToIssue);
  }

  upsertRemote(issue: CivicIssue): boolean {
    const result = getDb()
      .prepare(`${ISSUE_INSERT_SQL} ON CONFLICT(id) DO NOTHING`)
      .run(...issueToRow(issue));

    return Number(result.changes) > 0;
  }

  countByOrigin(kind: "local" | "remote"): number {
    const clause = kind === "local" ? "origin_node_id IS NULL" : "origin_node_id IS NOT NULL";
    const row = getDb().prepare(`SELECT COUNT(*) AS n FROM issues WHERE ${clause}`).get() as {
      n: number;
    };

    return row.n;
  }

  getPeerCursor(peerUrl: string): string | undefined {
    const row = getDb().prepare("SELECT cursor FROM federation_cursors WHERE peer_url = ?").get(peerUrl) as
      | { cursor: string | null }
      | undefined;

    return row?.cursor ?? undefined;
  }

  setPeerCursor(peerUrl: string, cursor: string): void {
    getDb()
      .prepare(
        `INSERT INTO federation_cursors (peer_url, cursor, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(peer_url) DO UPDATE SET cursor = excluded.cursor, updated_at = excluded.updated_at`
      )
      .run(peerUrl, cursor, new Date().toISOString());
  }
}
