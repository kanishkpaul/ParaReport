import type {
  AnalyzeIssueInput,
  AnalyzeIssueOutput,
  CivicIntelligence,
  CivicIssue,
  Severity
} from "@/types/civic";
import { getModeConfig } from "@/lib/modes";

const severityWeights: Record<Severity, number> = {
  low: 28,
  medium: 46,
  high: 72,
  critical: 92
};

export function buildCivicIntelligence(
  input: AnalyzeIssueInput,
  analysis: AnalyzeIssueOutput,
  knownIssues: CivicIssue[]
): CivicIntelligence {
  const related = findRelatedIssues(input, analysis, knownIssues);
  const hasLocation = Boolean(input.approximateLocation?.trim());
  const hasPhoto = Boolean(input.imageDescription?.trim());
  const hasDepartments = analysis.departmentSuggestions.length > 0;
  const hasBengali = Boolean(analysis.bengaliShareText);
  const completeness = [hasLocation, hasPhoto, hasDepartments, hasBengali].filter(Boolean).length;
  const duplicateBoost = Math.min(related.reduce((sum, issue) => sum + issue.verificationCount, 0), 18);
  const triageScore = clamp(severityWeights[analysis.severity] + duplicateBoost + riskBoost(analysis), 0, 99);
  const confidenceScore = clamp(58 + completeness * 9 + Math.min(analysis.riskFlags.length * 4, 16), 0, 98);
  const packetReadiness = clamp(52 + completeness * 10 + (analysis.officialEnglishComplaint ? 18 : 0), 0, 100);

  return {
    triageScore,
    confidenceScore,
    packetReadiness,
    queueLabel: buildQueueLabel(analysis),
    modeRationale: buildModeRationale(input, analysis),
    duplicateInsight: buildDuplicateInsight(related),
    nextBestAction: buildNextBestAction(analysis, related),
    impactRadius: buildImpactRadius(analysis, related),
    timeSensitivity: buildTimeSensitivity(analysis),
    escalationPath: buildEscalationPath(analysis),
    evidenceChecks: buildEvidenceChecks(input, analysis),
    privacyRedactions: [
      "Blur faces and vehicle plates before public sharing.",
      "Keep exact home numbers out of the public warning card.",
      "Preserve timestamps and landmarks in the department packet."
    ],
    exportFormats: [
      "WhatsApp public warning",
      "Department-ready PDF packet",
      "Ward dashboard queue",
      "Duplicate cluster timeline"
    ]
  };
}

function findRelatedIssues(
  input: AnalyzeIssueInput,
  analysis: AnalyzeIssueOutput,
  knownIssues: CivicIssue[]
) {
  const location = input.approximateLocation?.toLowerCase() || "";
  const locationTerms = location
    .split(/[,\s]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 3);
  const flagSet = new Set(analysis.riskFlags.map((flag) => flag.toLowerCase()));

  return knownIssues
    .map((issue) => {
      const locationMatch = locationTerms.some((term) =>
        issue.locationText.toLowerCase().includes(term)
      );
      const flagMatch = issue.riskFlags.some((flag) => flagSet.has(flag.toLowerCase()));
      const modeMatch = issue.mode === analysis.mode;
      const score = (locationMatch ? 3 : 0) + (flagMatch ? 2 : 0) + (modeMatch ? 1 : 0);

      return { issue, score };
    })
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score || b.issue.verificationCount - a.issue.verificationCount)
    .slice(0, 4)
    .map(({ issue }) => issue);
}

function riskBoost(analysis: AnalyzeIssueOutput) {
  const criticalTerms = ["electrical", "crowd", "dengue", "manhole", "fire", "ecological"];
  return analysis.riskFlags.some((flag) =>
    criticalTerms.some((term) => flag.toLowerCase().includes(term))
  )
    ? 7
    : 0;
}

function buildQueueLabel(analysis: AnalyzeIssueOutput) {
  if (analysis.severity === "critical") {
    return "Immediate command queue";
  }

  if (analysis.severity === "high") {
    return "Same-day escalation queue";
  }

  return "Verified para follow-up";
}

function buildModeRationale(input: AnalyzeIssueInput, analysis: AnalyzeIssueOutput) {
  const mode = getModeConfig(analysis.mode);
  const source = input.userSelectedMode ? "manual override" : "seasonal and keyword detection";

  return `${mode.shortName} selected by ${source}: ${mode.description}`;
}

function buildDuplicateInsight(related: CivicIssue[]) {
  if (!related.length) {
    return "No strong duplicate match yet. This can become the first receipt in a new para memory thread.";
  }

  const reports = related.reduce((sum, issue) => sum + Math.max(1, issue.verificationCount), 0);
  const unresolved = related.reduce((sum, issue) => sum + issue.unresolvedConfirmations, 0);
  const lead = related[0];

  return `Matches ${lead.duplicateGroupId || lead.locationText}: ${reports} related reports, ${unresolved} unresolved confirmations.`;
}

function buildNextBestAction(analysis: AnalyzeIssueOutput, related: CivicIssue[]) {
  if (analysis.severity === "critical") {
    return "Publish the public warning, then send the department packet and volunteer checklist together.";
  }

  if (related.length > 1) {
    return "Attach this report to the existing duplicate cluster and request one fresh verification photo.";
  }

  return "Collect one location confirmation and move the receipt into the ward queue.";
}

function buildImpactRadius(analysis: AnalyzeIssueOutput, related: CivicIssue[]) {
  if (analysis.mode === "pujo_safety") {
    return "Crowd route plus volunteer coordination radius";
  }

  if (analysis.mode === "wetlands_watch") {
    return "Bheri, canal edge, and access-road evidence radius";
  }

  if (related.length) {
    return "Recurring lane and adjacent ward-memory radius";
  }

  return "Single para hotspot radius";
}

function buildTimeSensitivity(analysis: AnalyzeIssueOutput) {
  if (analysis.severity === "critical") {
    return "Act before the next crowd surge or rain cycle.";
  }

  if (analysis.mode === "pre_monsoon_storm_prep") {
    return "Preventive action needed before the next storm.";
  }

  if (analysis.mode === "summer_heat_water") {
    return "Same-day action matters during peak heat.";
  }

  return "Track within the next civic work cycle.";
}

function buildEscalationPath(analysis: AnalyzeIssueOutput) {
  const path = [
    "Create citizen-safe public warning",
    "Attach evidence and location landmark",
    `Route to ${analysis.departmentSuggestions.slice(0, 2).join(" + ")}`,
    "Ask para volunteer for unresolved confirmation"
  ];

  if (analysis.severity === "critical") {
    path.splice(1, 0, "Flag as immediate safety risk");
  }

  return path;
}

function buildEvidenceChecks(input: AnalyzeIssueInput, analysis: AnalyzeIssueOutput) {
  const checks = [
    input.approximateLocation ? "Landmark captured" : "Needs landmark",
    input.imageDescription ? "Photo context attached" : "Photo optional but useful",
    analysis.followUpQuestion ? `Follow-up: ${analysis.followUpQuestion}` : "No essential follow-up needed",
    analysis.bengaliShareText ? "Bengali share text ready" : "Needs local-language share text"
  ];

  return checks;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}
