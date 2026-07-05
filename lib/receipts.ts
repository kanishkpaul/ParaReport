import type { AnalyzeIssueOutput, CivicReceipt } from "@/types/civic";

export function createReceipt(issueId: string, analysis: AnalyzeIssueOutput): CivicReceipt {
  return {
    issueId,
    publicTitle: createPublicTitle(analysis),
    evidenceSummary: analysis.cleanSummary,
    severity: analysis.severity,
    mode: analysis.mode,
    riskFlags: analysis.riskFlags,
    departmentSuggestions: analysis.departmentSuggestions,
    citizenSafeActions: analysis.citizenSafeActions,
    volunteerActions: analysis.volunteerActions,
    officialEnglishComplaint: analysis.officialEnglishComplaint,
    bengaliShareText: analysis.bengaliShareText,
    hindiShareText: analysis.hindiShareText,
    publicSafetyWarning: analysis.publicSafetyWarning
  };
}

function createPublicTitle(analysis: AnalyzeIssueOutput) {
  const flag = analysis.riskFlags[0] || analysis.category;
  return `${capitalize(analysis.severity)} ${flag}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
