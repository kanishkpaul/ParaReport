"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CivicIssue } from "@/types/civic";
import { getModeConfig, modeColorStyle } from "@/lib/modes";
import { SeverityBadge } from "@/components/SeverityBadge";

export function IssueCard({ issue }: { issue: CivicIssue }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const mode = getModeConfig(issue.mode);

  async function confirmUnresolved() {
    setIsPending(true);
    await fetch(`/api/reports/${issue.id}/confirm`, { method: "POST" });
    setIsPending(false);
    router.refresh();
  }

  return (
    <article className="issue-card" style={modeColorStyle(issue.mode)}>
      <div className="issue-card-head">
        <span className="mode-tag">{mode.shortName}</span>
        <SeverityBadge severity={issue.severity} />
        <span className={`status-tag status-${issue.status}`}>{issue.status.replace("_", " ")}</span>
      </div>

      <h2>
        <Link href={`/issues/${issue.id}`}>{issue.title}</Link>
      </h2>
      <p className="issue-location">{issue.locationText}</p>
      <p className="issue-summary">{issue.cleanSummary}</p>

      {issue.photoUrl ? (
        <Image
          src={issue.photoUrl}
          alt={`Photo evidence for ${issue.title}`}
          width={320}
          height={180}
          className="issue-photo"
          unoptimized
        />
      ) : null}

      <div className="issue-card-foot">
        <span>
          {formatDate(issue.createdAt)}
          {issue.unresolvedConfirmations > 0
            ? ` · ${issue.unresolvedConfirmations} unresolved confirmation${issue.unresolvedConfirmations === 1 ? "" : "s"}`
            : ""}
        </span>
        {issue.status !== "fixed" ? (
          <button type="button" className="quiet-action" onClick={confirmUnresolved} disabled={isPending}>
            {isPending ? "Saving…" : "Still unresolved"}
          </button>
        ) : (
          <span className="fixed-note">Fixed{issue.fixedProofUrl ? " with proof" : ""}</span>
        )}
      </div>
    </article>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
