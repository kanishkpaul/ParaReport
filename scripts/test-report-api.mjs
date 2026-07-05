const baseUrl = (process.env.PARAREPORT_BASE_URL || "http://127.0.0.1:3051").replace(/\/$/, "");

const cases = [
  {
    name: "Banglish report route",
    body: {
      text: "School er gate er shamne drain-e jol jome ache, onek mosha hochhe",
      location: "Ballygunge, Kolkata",
      mode: "monsoon_flood_dengue"
    },
    expectMode: "monsoon_flood_dengue"
  },
  {
    name: "Bengali script report route",
    body: {
      text: "রাস্তার মোড়ে জল জমে আছে আর বিদ্যুতের তার জলের কাছে ঝুলছে",
      location: "Shyambazar, Kolkata",
      mode: "monsoon_flood_dengue"
    },
    expectMode: "monsoon_flood_dengue"
  },
  {
    name: "Hindi report route",
    body: {
      text: "तीन दिन से पानी नहीं आ रहा है, बुज़ुर्ग लोग धूप में लाइन में खड़े हैं",
      location: "Behala, Kolkata",
      mode: "summer_heat_water"
    },
    expectMode: "summer_heat_water"
  }
];

let failures = 0;

for (const testCase of cases) {
  const response = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testCase.body)
  });

  if (!response.ok) {
    failures += 1;
    console.error(`FAIL ${testCase.name}: HTTP ${response.status} ${await response.text()}`);
    continue;
  }

  const result = await response.json();
  const errors = validateResult(result, testCase);

  if (errors.length) {
    failures += 1;
    console.error(`FAIL ${testCase.name}`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error(JSON.stringify(result, null, 2));
  } else {
    console.log(`PASS ${testCase.name}: ${result.analysisEngine}, ${result.issue.mode}, ${result.issue.severity}`);
  }
}

if (failures) {
  console.error(`${failures} report API case(s) failed.`);
  process.exit(1);
}

console.log(`All ${cases.length} report API cases passed.`);

function validateResult(result, testCase) {
  const errors = [];
  const issue = result.issue;
  const receipt = result.receipt;

  const validEngines = ["local-gemma", "byok", "rules"];
  if (!validEngines.includes(result.analysisEngine)) {
    errors.push(`expected analysisEngine one of ${validEngines.join("/")}, got ${result.analysisEngine}`);
  }

  if (!issue) {
    errors.push("missing issue");
    return errors;
  }

  if (!receipt) {
    errors.push("missing receipt");
    return errors;
  }

  if (issue.mode !== testCase.expectMode) {
    errors.push(`expected mode ${testCase.expectMode}, got ${issue.mode}`);
  }

  if (!/[\u0980-\u09ff]/.test(receipt.bengaliShareText || "")) {
    errors.push("receipt.bengaliShareText must contain Bengali script");
  }

  if (receipt.hindiShareText && !/[\u0900-\u097f]/.test(receipt.hindiShareText)) {
    errors.push("receipt.hindiShareText must contain Devanagari when present");
  }

  for (const field of ["riskFlags", "departmentSuggestions", "citizenSafeActions", "volunteerActions"]) {
    if (!Array.isArray(receipt[field]) || receipt[field].length === 0) {
      errors.push(`receipt.${field} must be a non-empty array`);
    }
  }

  return errors;
}
