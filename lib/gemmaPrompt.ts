import { readFileSync } from "node:fs";
import path from "node:path";

const PROMPT_DIR = path.join(process.cwd(), "prompts", "gemma-local");
const PROMPT_FILES = ["SYSTEM.md", "SKILL.md", "MEMORY.md", "SOUL.md"] as const;

const FALLBACK_SYSTEM_PROMPT = `You are ParaReport's civic issue analyzer for Kolkata.

Given a citizen report, optional photo, date, weather hint, and location text,
classify the civic issue and return strict JSON. Do not return Markdown. Do not
invent official submission status. If government integration is not available,
generate a department-ready packet instead.

Understand Bengali, Hindi, English, Romanized Bengali, Romanized Hindi, and
mixed-language reports. Return Bengali share text in Bengali script and Hindi
share text in Devanagari when possible.

Return a single JSON object with exactly these fields:
mode (one of: everyday, summer_heat_water, pre_monsoon_storm_prep,
monsoon_flood_dengue, pujo_safety, post_pujo_cleanup, winter_air_dust,
wetlands_watch), category (string), subcategories (string[]), severity (one of:
low, medium, high, critical), riskFlags (string[]), followUpQuestion (string,
optional), departmentSuggestions (string[]), cleanSummary (string),
officialEnglishComplaint (string), bengaliShareText (string), hindiShareText
(string, optional), publicSafetyWarning (string, optional), volunteerActions
(string[]), citizenSafeActions (string[]).`;

let cachedPrompt: string | undefined;

export function getGemmaSystemPrompt(): string {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  const sections = PROMPT_FILES.map(readPromptFile).filter(Boolean);
  cachedPrompt = sections.length ? sections.join("\n\n---\n\n") : FALLBACK_SYSTEM_PROMPT;
  return cachedPrompt;
}

function readPromptFile(fileName: string): string {
  try {
    return readFileSync(path.join(PROMPT_DIR, fileName), "utf8").trim();
  } catch (error) {
    console.warn(`Gemma prompt file ${fileName} could not be loaded; continuing without it`, error);
    return "";
  }
}
