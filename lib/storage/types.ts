import type {
  CivicIssue,
  IssueStatus,
  SeasonalModeId,
  Severity
} from "@/types/civic";

export type ListFilters = {
  mode?: SeasonalModeId;
  severity?: Severity;
  status?: IssueStatus | "open";
  groupId?: string;
  limit?: number;
};

export type ClusterCandidate = {
  locationText: string;
  groupId: string;
  lat?: number;
  lng?: number;
};

// Persistence boundary for civic issues. The `local` implementation is
// SQLite-backed (the default for cloned/local nodes); a `hosted` implementation
// (Postgres-compatible) can be swapped in behind PARAREPORT_STORAGE without the
// business logic in lib/store.ts changing. All methods are synchronous today
// because the local backend is node:sqlite; that keeps the call sites simple.
export interface IssueStore {
  insert(issue: CivicIssue): void;
  get(id: string): CivicIssue | undefined;
  has(id: string): boolean;
  list(filters: ListFilters): CivicIssue[];

  // Adds an unresolved confirmation and bumps verification/status. Returns the
  // updated issue, or undefined if the id is unknown.
  incrementUnresolved(id: string): CivicIssue | undefined;
  markFixed(id: string, proofUrl?: string): CivicIssue | undefined;

  // Recent issues in a mode that carry a duplicate group id, for clustering.
  clusterCandidates(mode: SeasonalModeId, limit: number): ClusterCandidate[];

  // --- federation ---------------------------------------------------------

  // Locally-authored issues emitted after `cursor` (a created_at bookmark),
  // ordered oldest-first, for the outbound receipt feed.
  localIssuesSince(cursor: string | undefined, limit: number): CivicIssue[];

  // Inserts a remote-origin issue if its id is new. Returns true if inserted,
  // false if it already existed (dedupe).
  upsertRemote(issue: CivicIssue): boolean;

  countByOrigin(kind: "local" | "remote"): number;

  getPeerCursor(peerUrl: string): string | undefined;
  setPeerCursor(peerUrl: string, cursor: string): void;
}
