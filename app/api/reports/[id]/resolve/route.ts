import { NextResponse } from "next/server";
import { getIssue, markFixed } from "@/lib/store";
import { savePhoto, UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!getIssue(id)) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  let proofUrl: string | undefined;

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const file = (await request.formData()).get("proof");

      if (file instanceof File && file.size > 0) {
        proofUrl = (await savePhoto(file)).publicUrl;
      }
    }
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ issue: markFixed(id, proofUrl) });
}
