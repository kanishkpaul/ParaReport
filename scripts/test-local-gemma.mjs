import { readFileSync } from "node:fs";
import path from "node:path";

const baseUrl = (process.env.GEMMA_BASE_URL || "http://127.0.0.1:8081/v1").replace(/\/$/, "");
const model = process.env.GEMMA_MODEL || "gemma-4-e2b-it";
const promptDir = path.join(process.cwd(), "prompts", "gemma-local");
const promptFiles = ["SYSTEM.md", "SKILL.md", "MEMORY.md", "SOUL.md"];

const systemPrompt = promptFiles
  .map((file) => readFileSync(path.join(promptDir, file), "utf8").trim())
  .join("\n\n---\n\n");

const cases = [
  {
    name: "Banglish monsoon school dengue",
    input: {
      text: "School er gate er shamne drain-e jol jome ache, onek mosha hochhe, bachchara ekhanei dariye bus ney",
      approximateLocation: "Ballygunge, Kolkata",
      date: "2026-07-05T06:00:00.000Z"
    },
    expectMode: "monsoon_flood_dengue",
    expectRisk: /dengue|mosquito|water|drain/i
  },
  {
    name: "Bengali script electrical water hazard",
    input: {
      text: "রাস্তার মোড়ে জল জমে আছে আর বিদ্যুতের তার নিচু হয়ে জলে ছুঁই ছুঁই করছে",
      approximateLocation: "Shyambazar, Kolkata",
      date: "2026-07-05T06:00:00.000Z"
    },
    expectMode: "monsoon_flood_dengue",
    expectSeverity: "critical",
    expectRisk: /electric|wire|বিদ্যুৎ|water/i
  },
  {
    name: "Hindi water shortage",
    input: {
      text: "तीन दिन से पानी नहीं आ रहा है, बुज़ुर्ग लोग लाइन में धूप में खड़े हैं",
      approximateLocation: "Behala, Kolkata",
      date: "2026-04-18T06:00:00.000Z"
    },
    expectMode: "summer_heat_water",
    expectRisk: /water|heat|elder|पानी|बुज़ुर्ग/i
  },
  {
    name: "English Pujo crowd wiring",
    input: {
      text: "Temporary Pujo pandal exit is blocked by bamboo barricade and loose wiring near a food stall",
      approximateLocation: "Gariahat, Kolkata",
      date: "2026-10-02T06:00:00.000Z"
    },
    expectMode: "pujo_safety",
    expectRisk: /crowd|wire|fire|temporary|bamboo/i
  },
  {
    name: "Wetlands mixed report",
    input: {
      text: "Bheri side e construction debris dump korche, khal ta block hoye jacche",
      approximateLocation: "East Kolkata Wetlands",
      date: "2026-02-10T06:00:00.000Z"
    },
    expectMode: "wetlands_watch",
    expectRisk: /wetland|dump|canal|ecological|khal|bheri/i
  }
];

const requiredFields = [
  "mode",
  "category",
  "subcategories",
  "severity",
  "riskFlags",
  "departmentSuggestions",
  "cleanSummary",
  "officialEnglishComplaint",
  "bengaliShareText",
  "volunteerActions",
  "citizenSafeActions"
];

let failures = 0;

for (const testCase of cases) {
  const result = await analyze(testCase.input);
  const errors = validateResult(result, testCase);

  if (errors.length) {
    failures += 1;
    console.error(`FAIL ${testCase.name}`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error(JSON.stringify(result, null, 2));
  } else {
    console.log(`PASS ${testCase.name}: ${result.mode}, ${result.severity}`);
  }
}

if (failures) {
  console.error(`${failures} Gemma multilingual case(s) failed.`);
  process.exit(1);
}

console.log(`All ${cases.length} Gemma multilingual cases passed.`);

async function analyze(input) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Input JSON:\n${JSON.stringify(input)}` }
      ],
      temperature: 0.1,
      max_tokens: 1400,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemma request failed with ${response.status}: ${await response.text()}`);
  }

  const body = await response.json();
  const text = body?.choices?.[0]?.message?.content;

  if (typeof text !== "string") {
    throw new Error(`Gemma response did not include message content: ${JSON.stringify(body)}`);
  }

  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error(`Gemma response did not contain JSON: ${text}`);
  }

  return JSON.parse(match[0]);
}

function validateResult(result, testCase) {
  const errors = [];

  for (const field of requiredFields) {
    if (result[field] === undefined || result[field] === null || result[field] === "") {
      errors.push(`missing required field ${field}`);
    }
  }

  for (const field of ["subcategories", "riskFlags", "departmentSuggestions", "volunteerActions", "citizenSafeActions"]) {
    if (!Array.isArray(result[field]) || result[field].length === 0) {
      errors.push(`${field} must be a non-empty array`);
    }
  }

  if (result.mode !== testCase.expectMode) {
    errors.push(`expected mode ${testCase.expectMode}, got ${result.mode}`);
  }

  if (testCase.expectSeverity && result.severity !== testCase.expectSeverity) {
    errors.push(`expected severity ${testCase.expectSeverity}, got ${result.severity}`);
  }

  const riskText = [result.category, ...(result.riskFlags || []), ...(result.subcategories || [])].join(" ");
  if (!testCase.expectRisk.test(riskText)) {
    errors.push(`risk/category text did not match ${testCase.expectRisk}`);
  }

  if (!/[\u0980-\u09ff]/.test(result.bengaliShareText || "")) {
    errors.push("bengaliShareText must contain Bengali script");
  }

  if (result.hindiShareText && !/[\u0900-\u097f]/.test(result.hindiShareText)) {
    errors.push("hindiShareText must contain Devanagari when present");
  }

  return errors;
}
