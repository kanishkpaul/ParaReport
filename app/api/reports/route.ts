import { NextResponse } from "next/server";
import { analyzeReport, readByokConfig } from "@/lib/providers";
import { createIssueFromAnalysis, getClusterSummary, listIssues } from "@/lib/store";
import { savePhoto, UploadError, type SavedUpload } from "@/lib/uploads";
import type {
  AnalyzeIssueInput,
  IssueStatus,
  ReportSubmissionResult,
  SeasonalModeId,
  Severity
} from "@/types/civic";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const issues = listIssues({
    mode: (params.get("mode") as SeasonalModeId) || undefined,
    severity: (params.get("severity") as Severity) || undefined,
    status: (params.get("status") as IssueStatus | "open") || undefined,
    groupId: params.get("groupId") || undefined
  });

  return NextResponse.json({ issues });
}

export async function POST(request: Request) {
  let text = "";
  let locationText = "";
  let landmark: string | undefined;
  let userSelectedMode: SeasonalModeId | undefined;
  let photo: SavedUpload | undefined;

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      text = String(form.get("text") || "").trim();
      locationText = String(form.get("location") || "").trim();
      landmark = String(form.get("landmark") || "").trim() || undefined;
      userSelectedMode = (String(form.get("mode") || "") as SeasonalModeId) || undefined;
      const file = form.get("photo");

      if (file instanceof File && file.size > 0) {
        photo = await savePhoto(file);
      }
    } else {
      const body = await request.json();
      text = String(body.text || "").trim();
      locationText = String(body.location || "").trim();
      landmark = body.landmark ? String(body.landmark) : undefined;
      userSelectedMode = body.mode || undefined;
    }
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text && !photo) {
    return NextResponse.json(
      { error: "Describe the issue or attach a photo." },
      { status: 400 }
    );
  }

  const input: AnalyzeIssueInput = {
    text,
    imageDescription: photo ? "Citizen-attached photo of the reported issue." : undefined,
    date: new Date().toISOString(),
    approximateLocation: locationText || undefined,
    userSelectedMode
  };

  const byok = readByokConfig(request.headers);

  const { output, engine } = await analyzeReport(input, {
    photo: photo ? { base64: photo.base64, mimeType: photo.mimeType } : undefined,
    byok
  });

  const issue = createIssueFromAnalysis({
    rawText: text || "(photo-only report)",
    analysis: output,
    locationText: locationText || "Location not provided",
    landmark,
    photoUrl: photo?.publicUrl,
    analysisEngine: engine
  });

  const cluster = issue.duplicateGroupId ? getClusterSummary(issue.duplicateGroupId) : undefined;

  const result: ReportSubmissionResult = {
    issue,
    receipt: issue.receipt,
    cluster,
    analysisEngine: engine
  };

  return NextResponse.json(result, { status: 201 });
}
