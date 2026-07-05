"use client";

import Image from "next/image";
import { useState } from "react";
import type { AnalyzeIssueInput, DemoScenario, SeasonalModeId } from "@/types/civic";
import { demoScenarios } from "@/lib/demoScenarios";
import { getModeConfig } from "@/lib/modes";

type ReportFormProps = {
  selectedMode: SeasonalModeId;
  onModeChange: (mode: SeasonalModeId) => void;
  onAnalyze: (input: AnalyzeIssueInput) => Promise<void>;
  isAnalyzing: boolean;
};

export function ReportForm({
  selectedMode,
  onModeChange,
  onAnalyze,
  isAnalyzing
}: ReportFormProps) {
  const defaultScenario = demoScenarios.find((scenario) => scenario.id === "monsoon")!;
  const [text, setText] = useState(defaultScenario.text);
  const [location, setLocation] = useState(defaultScenario.location);
  const [imageDescription, setImageDescription] = useState(
    sampleImageDescription(defaultScenario.mode)
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function submitReport() {
    await onAnalyze({
      text,
      imageDescription,
      date: new Date().toISOString(),
      approximateLocation: location,
      weatherHint: getModeConfig(selectedMode).shortName,
      userSelectedMode: selectedMode
    });
  }

  function loadScenario(scenario: DemoScenario) {
    setText(scenario.text);
    setLocation(scenario.location);
    setImageDescription(sampleImageDescription(scenario.mode));
    onModeChange(scenario.mode);
  }

  function clear() {
    setText("");
    setLocation("");
    setImageDescription("");
    setImagePreview(null);
  }

  function handleImage(file?: File) {
    if (!file) {
      setImagePreview(null);
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setImageDescription(`Citizen uploaded a photo named ${file.name}.`);
  }

  return (
    <section className="report-panel" aria-label="Report civic issue">
      <div className="section-heading">
        <span>New civic receipt</span>
        <strong>{getModeConfig(selectedMode).name}</strong>
      </div>

      <label className="field-label" htmlFor="report-text">
        Complaint text or voice note transcript
      </label>
      <textarea
        id="report-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Water is knee deep near the drain. Plastic is blocking it. A light pole is sparking."
        rows={5}
      />

      <div className="field-row">
        <label className="field-label" htmlFor="report-location">
          Location or landmark
          <input
            id="report-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Behala, near Banamali Naskar Road"
          />
        </label>
        <label className="field-label" htmlFor="image-upload">
          Optional photo
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={(event) => handleImage(event.target.files?.[0])}
          />
        </label>
      </div>

      {imagePreview ? (
        <div className="image-preview">
          <Image
            src={imagePreview}
            alt="Uploaded civic issue preview"
            width={64}
            height={48}
            unoptimized
          />
          <span>Photo preview attached</span>
        </div>
      ) : null}

      <div className="demo-strip" aria-label="Load demo scenario">
        {demoScenarios.map((scenario) => (
          <button type="button" key={scenario.id} onClick={() => loadScenario(scenario)}>
            {scenario.label}
          </button>
        ))}
      </div>

      <div className="action-row">
        <button type="button" className="primary-action" onClick={submitReport} disabled={isAnalyzing}>
          {isAnalyzing ? "Analyzing..." : "Analyze report"}
        </button>
        <button type="button" className="quiet-action" onClick={clear}>
          Clear
        </button>
      </div>
    </section>
  );
}

function sampleImageDescription(mode: SeasonalModeId) {
  const descriptions: Record<SeasonalModeId, string> = {
    everyday: "A narrow para lane with a broken civic asset visible.",
    summer_heat_water: "Residents waiting near a public tap in bright heat.",
    pre_monsoon_storm_prep: "A low wire and drain mouth visible before rainfall.",
    monsoon_flood_dengue: "A flooded lane, blocked drain mouth, plastic waste, and a light pole.",
    pujo_safety: "A temporary pandal exit with barricade, bamboo support, and hanging wire.",
    post_pujo_cleanup: "Leftover bamboo, flex, and plastic blocking a drain after Puja.",
    winter_air_dust: "Smoke and dust beside a broken market road.",
    wetlands_watch: "Debris near a bheri edge and a blocked water channel."
  };

  return descriptions[mode];
}
