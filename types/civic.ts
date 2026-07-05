export type SeasonalModeId =
  | "everyday"
  | "summer_heat_water"
  | "pre_monsoon_storm_prep"
  | "monsoon_flood_dengue"
  | "pujo_safety"
  | "post_pujo_cleanup"
  | "winter_air_dust"
  | "wetlands_watch";

export type Severity = "low" | "medium" | "high" | "critical";

export type IssueStatus =
  | "new"
  | "needs_more_info"
  | "verified"
  | "in_progress"
  | "fixed"
  | "duplicate"
  | "archived";

export type AnalysisEngine = "gemma" | "rules";

export type CivicIssue = {
  id: string;
  title: string;
  rawText: string;
  cleanSummary: string;
  mode: SeasonalModeId;
  category: string;
  subcategories: string[];
  severity: Severity;
  riskFlags: string[];
  departmentSuggestions: string[];
  locationText: string;
  landmark?: string;
  ward?: string;
  borough?: string;
  lat?: number;
  lng?: number;
  status: IssueStatus;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  duplicateGroupId?: string;
  verificationCount: number;
  unresolvedConfirmations: number;
  fixedProofUrl?: string;
  receipt: CivicReceipt;
  analysisEngine: AnalysisEngine;
  isSeed: boolean;
};

export type ClusterSummary = {
  groupId: string;
  reportCount: number;
  unresolvedConfirmations: number;
  firstReportedAt: string;
  lastReportedAt: string;
  locationText: string;
  title: string;
  severity: Severity;
  mode: SeasonalModeId;
};

export type DashboardStats = {
  totalIssues: number;
  openIssues: number;
  criticalOpen: number;
  fixedIssues: number;
  reportsLast7Days: number;
  byMode: Array<{ mode: SeasonalModeId; open: number; total: number }>;
  topClusters: ClusterSummary[];
  topUnresolved: CivicIssue[];
};

export type CivicReceipt = {
  issueId: string;
  publicTitle: string;
  evidenceSummary: string;
  severity: Severity;
  mode: SeasonalModeId;
  riskFlags: string[];
  departmentSuggestions: string[];
  citizenSafeActions: string[];
  volunteerActions: string[];
  officialEnglishComplaint: string;
  bengaliShareText: string;
  hindiShareText?: string;
  publicSafetyWarning?: string;
};

export type AnalyzeIssueInput = {
  text?: string;
  imageDescription?: string;
  date: string;
  approximateLocation?: string;
  weatherHint?: string;
  userSelectedMode?: SeasonalModeId;
};

export type AnalyzeIssueOutput = {
  mode: SeasonalModeId;
  category: string;
  subcategories: string[];
  severity: Severity;
  riskFlags: string[];
  followUpQuestion?: string;
  departmentSuggestions: string[];
  cleanSummary: string;
  officialEnglishComplaint: string;
  bengaliShareText: string;
  hindiShareText?: string;
  publicSafetyWarning?: string;
  volunteerActions: string[];
  citizenSafeActions: string[];
};

export type SeasonalModeConfig = {
  id: SeasonalModeId;
  name: string;
  shortName: string;
  activeMonths: number[];
  description: string;
  primaryColor: string;
  triggers: string[];
  categories: string[];
  riskFlags: string[];
  departmentHints: string[];
  dashboardLabel: string;
};

export type DemoScenario = {
  id: string;
  label: string;
  mode: SeasonalModeId;
  location: string;
  text: string;
};

export type ReportSubmissionResult = {
  issue: CivicIssue;
  receipt: CivicReceipt;
  cluster?: ClusterSummary;
  analysisEngine: AnalysisEngine;
};
