import type { SeasonalModeId } from "@/types/civic";
import { getModeConfig } from "@/lib/modes";

const issueDepartments: Record<string, string[]> = {
  waterlogging: ["Sewerage and Drainage", "Roads"],
  "blocked drain": ["Sewerage and Drainage", "Solid Waste Management"],
  "electrical hazard": ["Lighting", "Police"],
  "dengue risk": ["Health", "Solid Waste Management"],
  "hidden pothole": ["Roads", "Sewerage and Drainage"],
  "crowd bottleneck": ["Police", "Fire"],
  "temporary wiring": ["Lighting", "Fire"],
  "fire safety": ["Fire", "Police"],
  "water shortage": ["Water Supply", "Ward Office"],
  "open burning": ["Solid Waste Management", "Environment"],
  "road dust": ["Roads", "Environment"],
  dumping: ["Solid Waste Management", "Environment"],
  "wetland filling": ["Environment", "Ward Office"],
  streetlight: ["Lighting"],
  pothole: ["Roads"],
  manhole: ["Sewerage and Drainage", "Roads"]
};

export function suggestDepartments(mode: SeasonalModeId, category: string, flags: string[]) {
  const suggestions = new Set<string>(getModeConfig(mode).departmentHints);
  const lowerCategory = category.toLowerCase();

  for (const [term, departments] of Object.entries(issueDepartments)) {
    if (lowerCategory.includes(term) || flags.some((flag) => flag.toLowerCase().includes(term))) {
      departments.forEach((department) => suggestions.add(department));
    }
  }

  return Array.from(suggestions).slice(0, 4);
}
