import { test } from "node:test";
import assert from "node:assert/strict";
import { createEnvelope, verifyEnvelope, canonicalize } from "@/lib/federation/signing";
import { remoteIssueId } from "@/lib/federation/envelope";
import type { FederatedIssuePayload } from "@/types/civic";

const SECRET = "shared-federation-secret";

function samplePayload(): FederatedIssuePayload {
  return {
    originIssueId: "issue-abc123",
    createdAt: "2026-07-05T06:00:00.000Z",
    updatedAt: "2026-07-05T06:00:00.000Z",
    mode: "monsoon_flood_dengue",
    category: "Waterlogging and drainage hazard",
    severity: "high",
    status: "new",
    locationText: "Ballygunge, Kolkata",
    verificationCount: 1,
    unresolvedConfirmations: 0,
    analysisEngine: "local-gemma",
    receipt: {
      issueId: "issue-abc123",
      publicTitle: "High waterlogging",
      evidenceSummary: "Waterlogging near the school gate.",
      severity: "high",
      mode: "monsoon_flood_dengue",
      riskFlags: ["waterlogging", "dengue risk"],
      departmentSuggestions: ["Sewerage and Drainage"],
      citizenSafeActions: ["Avoid standing water."],
      volunteerActions: ["Mark the hazard."],
      officialEnglishComplaint: "To the concerned department...",
      bengaliShareText: "পাড়া সতর্কতা"
    }
  };
}

test("a freshly created envelope verifies against the same secret", () => {
  const envelope = createEnvelope("node-a", samplePayload(), SECRET);
  assert.equal(verifyEnvelope(envelope, SECRET), true);
});

test("verification fails with a different secret", () => {
  const envelope = createEnvelope("node-a", samplePayload(), SECRET);
  assert.equal(verifyEnvelope(envelope, "other-secret"), false);
});

test("tampering with the payload invalidates the signature", () => {
  const envelope = createEnvelope("node-a", samplePayload(), SECRET);
  const tampered = {
    ...envelope,
    payload: { ...envelope.payload, severity: "critical" as const }
  };
  assert.equal(verifyEnvelope(tampered, SECRET), false);
});

test("tampering with the origin node id invalidates the signature", () => {
  const envelope = createEnvelope("node-a", samplePayload(), SECRET);
  const tampered = { ...envelope, originNodeId: "node-evil" };
  assert.equal(verifyEnvelope(tampered, SECRET), false);
});

test("a truncated or malformed signature is rejected", () => {
  const envelope = createEnvelope("node-a", samplePayload(), SECRET);
  assert.equal(verifyEnvelope({ ...envelope, signature: "" }, SECRET), false);
  assert.equal(verifyEnvelope({ ...envelope, signature: "abcd" }, SECRET), false);
});

test("canonicalization is order-independent", () => {
  assert.equal(canonicalize({ b: 1, a: 2 }), canonicalize({ a: 2, b: 1 }));
  assert.equal(canonicalize({ a: 2, b: 1 }), '{"a":2,"b":1}');
});

test("remote issue ids are namespaced by origin node for dedupe", () => {
  assert.equal(remoteIssueId("node-a", "issue-1"), "fed:node-a:issue-1");
  assert.notEqual(remoteIssueId("node-a", "issue-1"), remoteIssueId("node-b", "issue-1"));
});
