import { NextResponse } from "next/server";
import { confirmUnresolved, getIssue } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!getIssue(id)) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ issue: confirmUnresolved(id) });
}
