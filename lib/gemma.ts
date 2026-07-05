import type { AnalysisEngine, AnalyzeIssueInput, AnalyzeIssueOutput } from "@/types/civic";
import { analyzeIssue } from "@/lib/analyzer";

const GEMMA_MODEL = process.env.GEMMA_MODEL || "gemma-3-27b-it";

const GEMMA_SYSTEM_PROMPT = `You are ParaReport's civic issue analyzer for Kolkata.

Given a citizen report, optional photo, date, weather hint, and location text,
classify the civic issue and return strict JSON. Do not return Markdown. Do not
invent official submission status. If government integration is not available,
generate a department-ready packet instead.

Prefer Kolkata-specific seasonal reasoning:
- Monsoon: waterlogging, drains, dengue, open manholes, electrical hazards.
- Pujo: pandals, temporary wiring, crowd exits, barricades, food-stall waste,
  post-immersion cleanup.
- Summer: water shortage, heat stress, broken taps, tanker need.
- Winter: road dust, waste burning, construction dust, poor visibility.
- Wetlands: dumping, filling, encroachment, canal pollution.

Ask at most one follow-up question, only if essential.

Return a single JSON object with exactly these fields:
mode (one of: everyday, summer_heat_water, pre_monsoon_storm_prep,
monsoon_flood_dengue, pujo_safety, post_pujo_cleanup, winter_air_dust,
wetlands_watch), category (string), subcategories (string[]), severity (one of:
low, medium, high, critical), riskFlags (string[]), followUpQuestion (string,
optional), departmentSuggestions (string[]), cleanSummary (string),
officialEnglishComplaint (string), bengaliShareText (string), hindiShareText
(string, optional), publicSafetyWarning (string, optional), volunteerActions
(string[]), citizenSafeActions (string[]).`;

export type AnalysisResult = {
  output: AnalyzeIssueOutput;
  engine: AnalysisEngine;
};

export async function analyzeReport(
  input: AnalyzeIssueInput,
  photo?: { base64: string; mimeType: string }
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMMA_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return { output: analyzeIssue(input), engine: "rules" };
  }

  try {
    const parts: Array<Record<string, unknown>> = [
      { text: `${GEMMA_SYSTEM_PROMPT}\n\nInput JSON:\n${JSON.stringify(input)}` }
    ];

    if (photo) {
      parts.push({ inline_data: { mime_type: photo.mimeType, data: photo.base64 } });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 0.2 }
        }),
        signal: AbortSignal.timeout(30_000)
      }
    );

    if (!response.ok) {
      console.error(`Gemma API error ${response.status}; falling back to rules engine`);
      return { output: analyzeIssue(input), engine: "rules" };
    }

    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") {
      return { output: analyzeIssue(input), engine: "rules" };
    }

    const candidate = extractJson(text);

    if (!candidate) {
      return { output: analyzeIssue(input), engine: "rules" };
    }

    return { output: normalizeGemmaOutput(candidate, input), engine: "gemma" };
  } catch (error) {
    console.error("Gemma analysis failed; falling back to rules engine", error);
    return { output: analyzeIssue(input), engine: "rules" };
  }
}

// Gemma models don't support responseMimeType, so tolerate fenced or prefixed JSON.
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
