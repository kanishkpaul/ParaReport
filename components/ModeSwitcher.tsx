"use client";

import type { SeasonalModeId } from "@/types/civic";
import { getModeConfig, modeColorStyle, seasonalModes } from "@/lib/modes";

type ModeSwitcherProps = {
  value: SeasonalModeId;
  onChange: (mode: SeasonalModeId) => void;
};

export function ModeSwitcher({ value, onChange }: ModeSwitcherProps) {
  return (
    <section className="mode-switcher" aria-label="Seasonal mode switcher">
      <div className="section-heading">
        <span>Seasonal mode</span>
        <strong>{getModeConfig(value).dashboardLabel}</strong>
      </div>
      <div className="mode-grid" role="radiogroup" aria-label="Select civic mode">
        {seasonalModes.map((mode) => (
          <button
            type="button"
            key={mode.id}
            className={mode.id === value ? "mode-pill active" : "mode-pill"}
            style={modeColorStyle(mode.id)}
            role="radio"
            aria-checked={mode.id === value}
            onClick={() => onChange(mode.id)}
          >
            <span>{mode.shortName}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
