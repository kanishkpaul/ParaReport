import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic"
};

export type SavedUpload = {
  publicUrl: string;
  base64: string;
  mimeType: string;
};

export async function savePhoto(file: File): Promise<SavedUpload> {
  const extension = ALLOWED_TYPES[file.type];

  if (!extension) {
    throw new UploadError("Unsupported image type. Use JPEG, PNG, WebP, or HEIC.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("Image is larger than 8 MB. Please upload a smaller photo.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}.${extension}`;

  mkdirSync(UPLOAD_DIR, { recursive: true });
  writeFileSync(path.join(UPLOAD_DIR, name), buffer);

  return {
    publicUrl: `/uploads/${name}`,
    base64: buffer.toString("base64"),
    mimeType: file.type
  };
}

export class UploadError extends Error {}
