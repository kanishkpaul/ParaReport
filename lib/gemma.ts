import type { AnalysisEngine, AnalyzeIssueInput, AnalyzeIssueOutput } from "@/types/civic";
import { analyzeIssue } from "@/lib/analyzer";
import { getGemmaSystemPrompt } from "@/lib/gemmaPrompt";

const GEMMA_MODEL = process.env.GEMMA_MODEL || "gemma-4-e2b-it";
const GEMMA_BASE_URL = (process.env.GEMMA_BASE_URL || "http://127.0.0.1:8081/v1").replace(/\/$/, "");

export type AnalysisResult = {
  output: AnalyzeIssueOutput;
  engine: AnalysisEngine;
};

export async function analyzeReport(
  input: AnalyzeIssueInput,
  photo?: { base64: string; mimeType: string }
): Promise<AnalysisResult> {
  const enabled = process.env.GEMMA_ENABLED !== "false";

  if (!enabled) {
    return { output: analyzeIssue(input), engine: "rules" };
  }

  try {
    const photoHint = photo
      ? `\nPhoto: a citizen attached a ${photo.mimeType} image, but this local text model cannot inspect pixels. Use the report text, location, and this attachment hint only.`
      : "";

    const response = await fetch(`${GEMMA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: [
          { role: "system", content: getGemmaSystemPrompt() },
          { role: "user", content: `Input JSON:\n${JSON.stringify(input)}${photoHint}` }
        ],
        temperature: 0.1,
        max_tokens: 1400,
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(45_000)
    });

    if (!response.ok) {
      console.error(`Local Gemma error ${response.status}; falling back to rules engine`);
      return { output: analyzeIssue(input), engine: "rules" };
    }

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content;

    if (typeof text !== "string") {
      return { output: analyzeIssue(input), engine: "rules" };
    }

    const candidate = extractJson(text);

    if (!candidate) {
      return { output: analyzeIssue(input), engine: "rules" };
    }

    return { output: normalizeGemmaOutput(candidate, input), engine: "gemma" };
  } catch (error) {
    console.error("Local Gemma analysis failed; falling back to rules engine", error);
    return { output: analyzeIssue(input), engine: "rules" };
  }
}

// llama.cpp may return fenced or prefixed JSON depending on the chat template.
function extractJson(text: string): Partial<AnalyzeIssueOutput> | undefined {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    return undefined;
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    return undefined;
  }
}

const VALID_MODES = new Set([
  "everyday",
  "summer_heat_water",
  "pre_monsoon_storm_prep",
  "monsoon_flood_dengue",
  "pujo_safety",
  "post_pujo_cleanup",
  "winter_air_dust",
  "wetlands_watch"
]);
const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

function normalizeGemmaOutput(
  candidate: Partial<AnalyzeIssueOutput>,
  input: AnalyzeIssueInput
): AnalyzeIssueOutput {
  const fallback = analyzeIssue(input);

  return {
    mode: VALID_MODES.has(candidate.mode as string) ? candidate.mode! : fallback.mode,
    category: str(candidate.category) || fallback.category,
    subcategories: strArray(candidate.subcategories) ?? fallback.subcategories,
    severity: VALID_SEVERITIES.has(candidate.severity as string)
      ? candidate.severity!
      : fallback.severity,
    riskFlags: strArray(candidate.riskFlags) ?? fallback.riskFlags,
    followUpQuestion: str(candidate.followUpQuestion) || undefined,
    departmentSuggestions: strArray(candidate.departmentSuggestions) ?? fallback.departmentSuggestions,
    cleanSummary: str(candidate.cleanSummary) || fallback.cleanSummary,
    officialEnglishComplaint:
      str(candidate.officialEnglishComplaint) || fallback.officialEnglishComplaint,
    bengaliShareText: str(candidate.bengaliShareText) || fallback.bengaliShareText,
    hindiShareText: str(candidate.hindiShareText) || fallback.hindiShareText,
    publicSafetyWarning: str(candidate.publicSafetyWarning) || fallback.publicSafetyWarning,
    volunteerActions: strArray(candidate.volunteerActions) ?? fallback.volunteerActions,
    citizenSafeActions: strArray(candidate.citizenSafeActions) ?? fallback.citizenSafeActions
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function strArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length ? items : undefined;
}
