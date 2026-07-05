import type { AnalysisEngine, AnalyzeIssueOutput } from "@/types/civic";

export type ProviderKind = AnalysisEngine;

// Per-visitor Bring-Your-Own-Key config for any OpenAI-compatible endpoint.
// This is never persisted; it lives only for the duration of a single request.
export type ByokConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type PhotoHint = {
  base64: string;
  mimeType: string;
};

export type AnalysisResult = {
  output: AnalyzeIssueOutput;
  engine: AnalysisEngine;
};
