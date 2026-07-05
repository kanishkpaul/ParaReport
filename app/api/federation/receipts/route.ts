import { NextResponse } from "next/server";
import { buildFeed, importEnvelopes } from "@/lib/federation/service";
import { getNodeId } from "@/lib/federation/config";
import type { ReceiptEnvelope } from "@/types/civic";

export const runtime = "nodejs";

// Outbound feed: signed local receipts a peer can pull, filtered by ?since=cursor.
export async function GET(request: Request) {
  const since = new URL(request.url).searchParams.get("since") || undefined;
  const { envelopes, cursor } = buildFeed(since);

  return NextResponse.json({ nodeId: getNodeId(), envelopes, cursor });
}

// Inbound push: a peer publishes a batch of signed envelopes to this node.
export async function POST(request: Request) {
  let envelopes: ReceiptEnvelope[];

  try {
    const body = await request.json();
    envelopes = Array.isArray(body?.envelopes) ? body.envelopes : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = importEnvelopes(envelopes);

  return NextResponse.json(result);
}
