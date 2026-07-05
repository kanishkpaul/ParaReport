"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CivicIssue } from "@/types/civic";

export function IssueActions({ issue }: { issue: CivicIssue }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proof, setProof] = useState<File | null>(null);

  if (issue.status === "fixed") {
    return null;
  }

  async function confirmUnresolved() {
    setIsPending(true);
    await fetch(`/api/reports/${issue.id}/confirm`, { method: "POST" });
    setIsPending(false);
    router.refresh();
  }

  async function markFixed() {
    setIsPending(true);
    setError(null);
    const form = new FormData();

    if (proof) {
      form.set("proof", proof);
    }

    const response = await fetch(`/api/reports/${issue.id}/resolve`, {
      method: "POST",
      body: form
    });

    if (!response.ok) {
      setError((await response.json()).error || "Could not update the report.");
    }

    setIsPending(false);
    router.refresh();
  }

  return (
    <section className="panel issue-actions" aria-label="Update this report">
      <h2>Is this still a problem?</h2>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={confirmUnresolved} disabled={isPending}>
          Still unresolved
        </button>
        <label className="field-label proof-field">
          Proof photo (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={(event) => setProof(event.target.files?.[0] ?? null)}
          />
        </label>
        <button type="button" className="quiet-action" onClick={markFixed} disabled={isPending}>
          Mark fixed
        </button>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>
  );
}
