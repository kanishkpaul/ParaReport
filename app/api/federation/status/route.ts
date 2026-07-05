import { NextResponse } from "next/server";
import { getFederationStatus } from "@/lib/federation/service";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getFederationStatus());
}
