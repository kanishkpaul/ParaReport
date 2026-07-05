import { NextResponse } from "next/server";
import { analyzeWithGemma } from "@/lib/gemma";
import { createReceipt } from "@/lib/receipts";
import type { AnalyzeIssueInput } from "@/types/civic";

export async function POST(request: Request) {
  let input: AnalyzeIssueInput;

  try {
    input = (await request.json()) as AnalyzeIssueInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const analysis = await analyzeWithGemma(input);
  const receipt = createReceipt("live-report", analysis);

  return NextResponse.json({
    analysis,
    receipt
  });
}
