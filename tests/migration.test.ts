import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// Reproduces a database created before federation columns existed, then lets the
// app open it. Regression guard: the origin_node_id index must be created after
// the column is added by migrate(), not in the base schema.
const dir = mkdtempSync(path.join(tmpdir(), "parareport-migrate-"));

// Pre-create a legacy issues table WITHOUT the federation columns.
const legacy = new DatabaseSync(path.join(dir, "parareport.db"));
legacy.exec(`
  CREATE TABLE issues (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, raw_text TEXT NOT NULL,
    clean_summary TEXT NOT NULL, mode TEXT NOT NULL, category TEXT NOT NULL,
    subcategories TEXT NOT NULL, severity TEXT NOT NULL, risk_flags TEXT NOT NULL,
    department_suggestions TEXT NOT NULL, location_text TEXT NOT NULL, landmark TEXT,
    ward TEXT, borough TEXT, lat REAL, lng REAL, status TEXT NOT NULL, photo_url TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, duplicate_group_id TEXT,
    verification_count INTEGER NOT NULL DEFAULT 1,
    unresolved_confirmations INTEGER NOT NULL DEFAULT 0, fixed_proof_url TEXT,
    receipt TEXT NOT NULL, analysis_engine TEXT NOT NULL DEFAULT 'gemma',
    is_seed INTEGER NOT NULL DEFAULT 0
  );
`);
legacy.prepare(
  `INSERT INTO issues (id, title, raw_text, clean_summary, mode, category, subcategories,
    severity, risk_flags, department_suggestions, location_text, status, created_at,
    updated_at, verification_count, unresolved_confirmations, receipt, analysis_engine, is_seed)
   VALUES ('legacy-1','t','r','s','everyday','c','[]','low','[]','[]','loc','new',
    '2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z',1,0,'{}','gemma',0)`
).run();
legacy.close();

process.env.PARAREPORT_DATA_DIR = dir;
process.env.PARAREPORT_STORAGE = "local";

const { getStore } = await import("@/lib/storage");

test("opening a pre-federation database migrates cleanly", () => {
  const store = getStore();
  // These would throw if migration or the deferred origin index failed.
  assert.equal(store.countByOrigin("local"), 1);
  assert.equal(store.countByOrigin("remote"), 0);
});

test("legacy 'gemma' analysis_engine is normalized to local-gemma on read", () => {
  const issue = getStore().get("legacy-1");
  assert.equal(issue?.analysisEngine, "local-gemma");
  assert.equal(issue?.originNodeId, undefined);
});
