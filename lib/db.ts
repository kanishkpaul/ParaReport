import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { seedIssues } from "@/lib/seedIssues";
import type { CivicIssue } from "@/types/civic";

const DB_DIR = process.env.PARAREPORT_DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "parareport.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  clean_summary TEXT NOT NULL,
  mode TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategories TEXT NOT NULL,
  severity TEXT NOT NULL,
  risk_flags TEXT NOT NULL,
  department_suggestions TEXT NOT NULL,
  location_text TEXT NOT NULL,
  landmark TEXT,
  ward TEXT,
  borough TEXT,
  lat REAL,
  lng REAL,
  status TEXT NOT NULL,
  photo_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  duplicate_group_id TEXT,
  verification_count INTEGER NOT NULL DEFAULT 1,
  unresolved_confirmations INTEGER NOT NULL DEFAULT 0,
  fixed_proof_url TEXT,
  receipt TEXT NOT NULL,
  analysis_engine TEXT NOT NULL DEFAULT 'rules',
  is_seed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_issues_mode ON issues(mode);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_group ON issues(duplicate_group_id);
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at);
`;

const globalDb = globalThis as unknown as { __parareportDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalDb.__parareportDb) {
    mkdirSync(DB_DIR, { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(SCHEMA);
    seedIfEmpty(db);
    globalDb.__parareportDb = db;
  }

  return globalDb.__parareportDb;
}

function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) AS n FROM issues").get() as { n: number };

  if (row.n > 0) {
    return;
  }

  const insert = db.prepare(
    `INSERT INTO issues (
      id, title, raw_text, clean_summary, mode, category, subcategories, severity,
      risk_flags, department_suggestions, location_text, landmark, ward, borough,
      lat, lng, status, photo_url, created_at, updated_at, duplicate_group_id,
      verification_count, unresolved_confirmations, fixed_proof_url, receipt,
      analysis_engine, is_seed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const issue of seedIssues) {
    insert.run(...issueToRow(issue));
  }
}

export function issueToRow(issue: CivicIssue) {
  return [
    issue.id,
    issue.title,
    issue.rawText,
    issue.cleanSummary,
    issue.mode,
    issue.category,
    JSON.stringify(issue.subcategories),
    issue.severity,
    JSON.stringify(issue.riskFlags),
    JSON.stringify(issue.departmentSuggestions),
    issue.locationText,
    issue.landmark ?? null,
    issue.ward ?? null,
    issue.borough ?? null,
    issue.lat ?? null,
    issue.lng ?? null,
    issue.status,
    issue.photoUrl ?? null,
    issue.createdAt,
    issue.updatedAt,
    issue.duplicateGroupId ?? null,
    issue.verificationCount,
    issue.unresolvedConfirmations,
    issue.fixedProofUrl ?? null,
    JSON.stringify(issue.receipt),
    issue.analysisEngine,
    issue.isSeed ? 1 : 0
  ] as const;
}

type IssueRow = Record<string, unknown>;

export function rowToIssue(row: IssueRow): CivicIssue {
  return {
    id: row.id as string,
    title: row.title as string,
    rawText: row.raw_text as string,
    cleanSummary: row.clean_summary as string,
    mode: row.mode as CivicIssue["mode"],
    category: row.category as string,
    subcategories: JSON.parse(row.subcategories as string),
    severity: row.severity as CivicIssue["severity"],
    riskFlags: JSON.parse(row.risk_flags as string),
    departmentSuggestions: JSON.parse(row.department_suggestions as string),
    locationText: row.location_text as string,
    landmark: (row.landmark as string) ?? undefined,
    ward: (row.ward as string) ?? undefined,
    borough: (row.borough as string) ?? undefined,
    lat: (row.lat as number) ?? undefined,
    lng: (row.lng as number) ?? undefined,
    status: row.status as CivicIssue["status"],
    photoUrl: (row.photo_url as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    duplicateGroupId: (row.duplicate_group_id as string) ?? undefined,
    verificationCount: row.verification_count as number,
    unresolvedConfirmations: row.unresolved_confirmations as number,
    fixedProofUrl: (row.fixed_proof_url as string) ?? undefined,
    receipt: JSON.parse(row.receipt as string),
    analysisEngine: row.analysis_engine as CivicIssue["analysisEngine"],
    isSeed: Boolean(row.is_seed)
  };
}
