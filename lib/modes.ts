import type { SeasonalModeConfig, SeasonalModeId } from "@/types/civic";

export const seasonalModes: SeasonalModeConfig[] = [
  {
    id: "everyday",
    name: "Everyday Para Mode",
    shortName: "Everyday",
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description: "General civic reporting and para memory for routine issues.",
    primaryColor: "#5f6470",
    triggers: [
      "garbage",
      "streetlight",
      "pothole",
      "manhole",
      "footpath",
      "water leakage",
      "dumping"
    ],
    categories: [
      "Garbage",
      "Streetlighting",
      "Roads",
      "Footpaths",
      "Drainage",
      "Water supply"
    ],
    riskFlags: ["routine civic issue", "recurrence check needed"],
    departmentHints: [
      "Solid Waste Management",
      "Roads",
      "Lighting",
      "Water Supply",
      "Sewerage and Drainage"
    ],
    dashboardLabel: "Everyday para queue"
  },
  {
    id: "summer_heat_water",
    name: "Summer Heat and Water Mode",
    shortName: "Summer",
    activeMonths: [3, 4, 5],
    description: "Heat stress, water shortage, broken taps, and public waiting risks.",
    primaryColor: "#d35b4d",
    triggers: [
      "no water",
      "low pressure",
      "tap",
      "tanker",
      "heat",
      "shade",
      "overload"
    ],
    categories: ["Water shortage", "Heat stress", "Broken public tap", "Fire risk"],
    riskFlags: ["heat stress", "water shortage", "vulnerable people affected"],
    departmentHints: ["Water Supply", "Ward Office", "Health", "Fire"],
    dashboardLabel: "Heat and water queue"
  },
  {
    id: "pre_monsoon_storm_prep",
    name: "Pre-Monsoon Storm Prep Mode",
    shortName: "Storm Prep",
    activeMonths: [4, 5, 6],
    description: "Preventive risks before heavy rain and wind.",
    primaryColor: "#6f7f3f",
    triggers: [
      "loose wire",
      "branch",
      "tree",
      "hoarding",
      "before rain",
      "gully pit",
      "desilting"
    ],
    categories: ["Loose wire", "Tree risk", "Hoarding risk", "Drain preparation"],
    riskFlags: ["rain escalation", "wind hazard", "preventable emergency"],
    departmentHints: ["Lighting", "Electricity", "Sewerage and Drainage", "Parks"],
    dashboardLabel: "Before next rain actions"
  },
  {
    id: "monsoon_flood_dengue",
    name: "Monsoon Flood and Dengue Mode",
    shortName: "Monsoon",
    activeMonths: [6, 7, 8, 9],
    description: "Waterlogging, blocked drains, dengue, manholes, and electrical danger.",
    primaryColor: "#2f74a3",
    triggers: [
      "water",
      "flood",
      "rain",
      "drain",
      "plastic",
      "manhole",
      "dengue",
      "mosquito",
      "sparking"
    ],
    categories: [
      "Waterlogging",
      "Blocked drain",
      "Electrical hazard",
      "Dengue risk",
      "Hidden pothole"
    ],
    riskFlags: [
      "waterlogging",
      "blocked drain",
      "electrical danger",
      "dengue risk",
      "fall risk"
    ],
    departmentHints: [
      "Sewerage and Drainage",
      "Solid Waste Management",
      "Lighting",
      "Health",
      "Roads"
    ],
    dashboardLabel: "Monsoon critical queue"
  },
  {
    id: "pujo_safety",
    name: "Pujo Safety Mode",
    shortName: "Pujo",
    activeMonths: [9, 10],
    description: "Temporary city safety for pandals, crowds, wiring, routes, and waste.",
    primaryColor: "#c58923",
    triggers: [
      "pandal",
      "puja",
      "pujo",
      "barricade",
      "bamboo",
      "immersion",
      "crowd",
      "gate",
      "stall"
    ],
    categories: [
      "Crowd bottleneck",
      "Temporary wiring",
      "Fire safety",
      "Traffic obstruction",
      "Accessibility",
      "Waste"
    ],
    riskFlags: [
      "crowd bottleneck",
      "temporary electrical hazard",
      "fire safety gap",
      "route obstruction"
    ],
    departmentHints: ["Police", "Fire", "Lighting", "Solid Waste Management", "Ward Office"],
    dashboardLabel: "Pujo safety coordination"
  },
  {
    id: "post_pujo_cleanup",
    name: "Post-Pujo Cleanup Mode",
    shortName: "Post-Pujo",
    activeMonths: [10, 11],
    description: "Pandal waste, immersion-route cleanup, and road or footpath restoration.",
    primaryColor: "#b76f2e",
    triggers: [
      "leftover",
      "dismantling",
      "thermocol",
      "flex",
      "immersion waste",
      "pandal waste",
      "cleanup"
    ],
    categories: ["Pandal waste", "Drain obstruction", "Road restoration", "Footpath restoration"],
    riskFlags: ["cleanup overdue", "drain obstruction", "pedestrian obstruction"],
    departmentHints: ["Solid Waste Management", "Roads", "Sewerage and Drainage", "Ward Office"],
    dashboardLabel: "Post-Pujo cleanup queue"
  },
  {
    id: "winter_air_dust",
    name: "Winter Air and Dust Mode",
    shortName: "Winter",
    activeMonths: [11, 12, 1, 2],
    description: "Road dust, open burning, construction debris, and poor visibility hazards.",
    primaryColor: "#85705d",
    triggers: ["dust", "burning", "smoke", "construction", "debris", "fog", "visibility"],
    categories: ["Open burning", "Road dust", "Construction dust", "Lighting and visibility"],
    riskFlags: ["air quality risk", "visibility hazard", "respiratory risk"],
    departmentHints: ["Solid Waste Management", "Roads", "Lighting", "Environment"],
    dashboardLabel: "Winter air and dust queue"
  },
  {
    id: "wetlands_watch",
    name: "East Kolkata Wetlands Watch Mode",
    shortName: "Wetlands",
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description: "Environmental evidence around bheris, canals, dumping, filling, and fires.",
    primaryColor: "#3f7a54",
    triggers: [
      "bheri",
      "wetland",
      "canal",
      "filling",
      "encroachment",
      "debris dumping",
      "industrial waste"
    ],
    categories: ["Illegal dumping", "Wetland filling", "Encroachment", "Canal pollution", "Fire"],
    riskFlags: ["ecological risk", "timeline evidence needed", "water-channel blockage"],
    departmentHints: ["Environment", "Solid Waste Management", "Ward Office", "Pollution Control"],
    dashboardLabel: "Wetlands evidence queue"
  }
];

const modeById = new Map(seasonalModes.map((mode) => [mode.id, mode]));

export function getModeConfig(modeId: SeasonalModeId): SeasonalModeConfig {
  const config = modeById.get(modeId);

  if (!config) {
    return seasonalModes[0];
  }

  return config;
}

export function getDefaultMode(date = new Date()): SeasonalModeId {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 9 && day >= 25) || month === 10) {
    return "pujo_safety";
  }

  if ([6, 7, 8, 9].includes(month)) {
    return "monsoon_flood_dengue";
  }

  if ([3, 4, 5].includes(month)) {
    return "summer_heat_water";
  }

  if ([11, 12, 1, 2].includes(month)) {
    return "winter_air_dust";
  }

  return "everyday";
}

export function detectModeFromText(
  text: string,
  date = new Date(),
  userSelectedMode?: SeasonalModeId
): SeasonalModeId {
  if (userSelectedMode) {
    return userSelectedMode;
  }

  const lower = text.toLowerCase();

  if (hasAny(lower, seasonalModes.find((mode) => mode.id === "wetlands_watch")!.triggers)) {
    return "wetlands_watch";
  }

  if (
    hasAny(lower, [
      "leftover",
      "dismantling",
      "thermocol",
      "flex",
      "immersion waste",
      "pandal waste",
      "cleanup"
    ])
  ) {
    return "post_pujo_cleanup";
  }

  if (hasAny(lower, seasonalModes.find((mode) => mode.id === "pujo_safety")!.triggers)) {
    return "pujo_safety";
  }

  if (hasAny(lower, seasonalModes.find((mode) => mode.id === "monsoon_flood_dengue")!.triggers)) {
    return "monsoon_flood_dengue";
  }

  if (hasAny(lower, seasonalModes.find((mode) => mode.id === "summer_heat_water")!.triggers)) {
    return "summer_heat_water";
  }

  if (
    hasAny(lower, seasonalModes.find((mode) => mode.id === "pre_monsoon_storm_prep")!.triggers)
  ) {
    return "pre_monsoon_storm_prep";
  }

  if (hasAny(lower, seasonalModes.find((mode) => mode.id === "winter_air_dust")!.triggers)) {
    return "winter_air_dust";
  }

  return getDefaultMode(date);
}

export function modeColorStyle(modeId: SeasonalModeId) {
  return {
    "--mode-color": getModeConfig(modeId).primaryColor
  } as React.CSSProperties;
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term.toLowerCase()));
}
