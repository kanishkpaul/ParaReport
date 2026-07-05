import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Point the SQLite backend at a throwaway directory before importing anything
// that opens the database.
process.env.PARAREPORT_DATA_DIR = mkdtempSync(path.join(tmpdir(), "parareport-store-"));
process.env.PARAREPORT_STORAGE = "local";

const { LocalSqliteStore } = await import("@/lib/storage/localSqlite");
const { getStore } = await import("@/lib/storage");
type CivicIssue = import("@/types/civic").CivicIssue;

const store = new LocalSqliteStore();

let counter = 0;
function makeIssue(overrides: Partial<CivicIssue> = {}): CivicIssue {
  counter += 1;
  const id = overrides.id ?? `issue-test-${counter}`;
  const now = overrides.createdAt ?? new Date(Date.UTC(2026, 6, 5, 6, counter, 0)).toISOString();

  return {
    id,
    title: "Test issue",
    rawText: "raw",
    cleanSummary: "summary",
    mode: "monsoon_flood_dengue",
    category: "Waterlogging",
    subcategories: ["waterlogging"],
    severity: "high",
    riskFlags: ["waterlogging"],
    departmentSuggestions: ["Sewerage and Drainage"],
    locationText: "Ballygunge, Kolkata",
    status: "new",
    createdAt: now,
    updatedAt: now,
    duplicateGroupId: `grp-${counter}`,
    verificationCount: 1,
    unresolvedConfirmations: 0,
    receipt: {
      issueId: id,
      publicTitle: "High waterlogging",
      evidenceSummary: "summary",
      severity: "high",
      mode: "monsoon_flood_dengue",
      riskFlags: ["waterlogging"],
      departmentSuggestions: ["Sewerage and Drainage"],
      citizenSafeActions: ["Avoid water"],
      volunteerActions: ["Mark hazard"],
      officialEnglishComplaint: "complaint",
      bengaliShareText: "পাড়া"
    },
    analysisEngine: "local-gemma",
    isSeed: false,
    ...overrides
  };
}

test("getStore returns the local SQLite backend by default", () => {
  assert.ok(getStore() instanceof LocalSqliteStore);
});

test("insert then get round-trips an issue", () => {
  const issue = makeIssue();
  store.insert(issue);

  const loaded = store.get(issue.id);
  assert.ok(loaded);
  assert.equal(loaded?.id, issue.id);
  assert.equal(loaded?.severity, "high");
  assert.deepEqual(loaded?.riskFlags, ["waterlogging"]);
});

test("has reflects presence", () => {
  const issue = makeIssue();
  assert.equal(store.has(issue.id), false);
  store.insert(issue);
  assert.equal(store.has(issue.id), true);
});

test("incrementUnresolved bumps counts and promotes new -> verified", () => {
  const issue = makeIssue();
  store.insert(issue);

  const updated = store.incrementUnresolved(issue.id);
  assert.equal(updated?.unresolvedConfirmations, 1);
  assert.equal(updated?.verificationCount, 2);
  assert.equal(updated?.status, "verified");
});

test("markFixed sets status and proof url", () => {
  const issue = makeIssue();
  store.insert(issue);

  const fixed = store.markFixed(issue.id, "/uploads/proof.jpg");
  assert.equal(fixed?.status, "fixed");
  assert.equal(fixed?.fixedProofUrl, "/uploads/proof.jpg");
});

test("upsertRemote inserts once and dedupes on repeat", () => {
  const remote = makeIssue({
    id: "fed:node-b:issue-9",
    originNodeId: "node-b",
    originIssueId: "issue-9"
  });

  assert.equal(store.upsertRemote(remote), true);
  assert.equal(store.upsertRemote(remote), false);
  assert.equal(store.get(remote.id)?.originNodeId, "node-b");
});

test("countByOrigin separates local and remote issues", () => {
  const localBefore = store.countByOrigin("local");
  const remoteBefore = store.countByOrigin("remote");

  store.insert(makeIssue());
  store.upsertRemote(
    makeIssue({ id: "fed:node-c:issue-1", originNodeId: "node-c", originIssueId: "issue-1" })
  );

  assert.equal(store.countByOrigin("local"), localBefore + 1);
  assert.equal(store.countByOrigin("remote"), remoteBefore + 1);
});

test("localIssuesSince returns only local-origin issues after the cursor, oldest-first", () => {
  const a = makeIssue({ createdAt: "2027-01-01T00:00:00.000Z" });
  const b = makeIssue({ createdAt: "2027-01-02T00:00:00.000Z" });
  store.insert(a);
  store.insert(b);
  // A remote issue in the same window must not appear in the feed.
  store.upsertRemote(
    makeIssue({
      id: "fed:node-d:issue-1",
      originNodeId: "node-d",
      originIssueId: "issue-1",
      createdAt: "2027-01-03T00:00:00.000Z"
    })
  );

  const since = store.localIssuesSince("2026-12-31T00:00:00.000Z", 100);
  const ids = since.map((issue) => issue.id);
  assert.ok(ids.includes(a.id));
  assert.ok(ids.includes(b.id));
  assert.ok(!ids.some((id) => id.startsWith("fed:")));
  // oldest-first ordering
  assert.ok(since.findIndex((i) => i.id === a.id) < since.findIndex((i) => i.id === b.id));
});

test("peer cursors persist and update", () => {
  assert.equal(store.getPeerCursor("https://peer.example"), undefined);
  store.setPeerCursor("https://peer.example", "2026-07-05T06:00:00.000Z");
  assert.equal(store.getPeerCursor("https://peer.example"), "2026-07-05T06:00:00.000Z");
  store.setPeerCursor("https://peer.example", "2026-07-06T06:00:00.000Z");
  assert.equal(store.getPeerCursor("https://peer.example"), "2026-07-06T06:00:00.000Z");
});
