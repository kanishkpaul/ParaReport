import type { AnalyzeIssueInput, AnalyzeIssueOutput } from "@/types/civic";
import { analyzeIssue } from "@/lib/analyzer";

const GEMMA_SYSTEM_PROMPT = `You are ParaReport's civic issue analyzer for Kolkata.

Given a citizen report, optional image description, date, weather hint, and
location text, classify the civic issue and return strict JSON. Do not return
Markdown. Do not invent official submission status. If government integration is
not available, generate a department-ready packet instead.

Prefer Kolkata-specific seasonal reasoning:
- Monsoon: waterlogging, drains, dengue, open manholes, electrical hazards.
- Pujo: pandals, temporary wiring, crowd exits, barricades, food-stall waste,
  post-immersion cleanup.
- Summer: water shortage, heat stress, broken taps, tanker need.
- Winter: road dust, waste burning, construction dust, poor visibility.
- Wetlands: dumping, filling, encroachment, canal pollution.

Ask at most one follow-up question, only if essential.

Return JSON matching AnalyzeIssueOutput.`;

export async function analyzeWithGemma(input: AnalyzeIssueInput): Promise<AnalyzeIssueOutput> {
  const apiKey = process.env.GEMMA_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return analyzeIssue(input);
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemma-3n-e4b-it:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${GEMMA_SYSTEM_PROMPT}\n\nInput JSON:\n${JSON.stringify(input)}`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      return analyzeIssue(input);
    }

    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") {
      return analyzeIssue(input);
    }

    return normalizeGemmaOutput(JSON.parse(text), input);
  } catch {
    return analyzeIssue(input);
  }
}

function normalizeGemmaOutput(candidate: Partial<AnalyzeIssueOutput>, input: AnalyzeIssueInput) {
  const fallback = analyzeIssue(input);

  return {
    ...fallback,
    ...candidate,
    riskFlags: candidate.riskFlags?.length ? candidate.riskFlags : fallback.riskFlags,
    departmentSuggestions: candidate.departmentSuggestions?.length
      ? candidate.departmentSuggestions
      : fallback.departmentSuggestions,
    citizenSafeActions: candidate.citizenSafeActions?.length
      ? candidate.citizenSafeActions
      : fallback.citizenSafeActions,
    volunteerActions: candidate.volunteerActions?.length
      ? candidate.volunteerActions
      : fallback.volunteerActions
  };
}
