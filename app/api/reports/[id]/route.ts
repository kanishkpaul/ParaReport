import { NextResponse } from "next/server";
import { getClusterSummary, getIssue } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = getIssue(id);

  if (!issue) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const cluster = issue.duplicateGroupId ? getClusterSummary(issue.duplicateGroupId) : undefined;

  return NextResponse.json({ issue, cluster });
}
