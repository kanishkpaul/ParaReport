"use client";

import { useMemo, useState } from "react";
import type { AnalyzeIssueOutput, CivicReceipt, SeasonalModeId } from "@/types/civic";
import { CivicReceiptCard } from "@/components/CivicReceiptCard";
import { CommandCenter } from "@/components/CommandCenter";
import { IntelligencePanel } from "@/components/IntelligencePanel";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { ParaMap } from "@/components/ParaMap";
import { ReportForm } from "@/components/ReportForm";
import { SeasonalDashboard } from "@/components/SeasonalDashboard";
import { WardDashboard } from "@/components/WardDashboard";
import { analyzeIssue } from "@/lib/analyzer";
import { demoScenarios } from "@/lib/demoScenarios";
import { buildCivicIntelligence } from "@/lib/intelligence";
import { getDefaultMode } from "@/lib/modes";
import { mockIssues } from "@/lib/mockIssues";
import { createReceipt } from "@/lib/receipts";
import type { AnalyzeIssueInput } from "@/types/civic";

const initialScenario = demoScenarios.find((item) => item.id === "monsoon")!;
const initialInput: AnalyzeIssueInput = {
  text: initialScenario.text,
  date: new Date().toISOString(),
  approximateLocation: initialScenario.location,
  imageDescription: "A flooded lane, blocked drain mouth, plastic waste, and a light pole.",
  userSelectedMode: initialScenario.mode
};
const initialAnalysis = analyzeIssue(initialInput);
const initialReceipt = createReceipt("demo-monsoon", initialAnalysis);

export function AppShell() {
  const defaultMode = useMemo(() => getDefaultMode(new Date()), []);
  const [selectedMode, setSelectedMode] = useState<SeasonalModeId>(defaultMode);
  const [latestInput, setLatestInput] = useState<AnalyzeIssueInput>(initialInput);
  const [analysis, setAnalysis] = useState<AnalyzeIssueOutput | undefined>(initialAnalysis);
  const [receipt, setReceipt] = useState<CivicReceipt | undefined>(initialReceipt);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const intelligence = useMemo(
    () => buildCivicIntelligence(latestInput, analysis || initialAnalysis, mockIssues),
    [analysis, latestInput]
  );

  async function handleAnalyze(input: AnalyzeIssueInput) {
    setIsAnalyzing(true);

    await new Promise((resolve) => window.setTimeout(resolve, 180));
    const output = analyzeIssue(input);
    const nextReceipt = createReceipt(`receipt-${Date.now()}`, output);

    setAnalysis(output);
    setReceipt(nextReceipt);
    setLatestInput(input);
    setSelectedMode(output.mode);
    setIsAnalyzing(false);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Kolkata civic intelligence OS</p>
          <h1>ParaReport</h1>
          <p>Civic memory, seasonal triage, and department-ready receipts for Kolkata&apos;s paras.</p>
        </div>
        <div className="header-status">
          <span>Default: Monsoon in July</span>
          <strong>{intelligence.queueLabel}</strong>
        </div>
      </header>

      <CommandCenter intelligence={intelligence} />

      <div className="primary-layout">
        <div className="left-rail">
          <ModeSwitcher value={selectedMode} onChange={setSelectedMode} />
          <ReportForm
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>
        <div className="receipt-column">
          <CivicReceiptCard receipt={receipt} />
          <IntelligencePanel intelligence={intelligence} />
        </div>
      </div>

      <div className="operations-layout">
        <ParaMap issues={mockIssues} />
        <div className="dashboard-stack">
          <WardDashboard issues={mockIssues} />
          <SeasonalDashboard issues={mockIssues} />
        </div>
      </div>
    </main>
  );
}
