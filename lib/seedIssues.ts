import type { CivicIssue, IssueStatus, SeasonalModeId } from "@/types/civic";
import { analyzeIssue } from "@/lib/analyzer";
import { createReceipt } from "@/lib/receipts";

type SeedBase = {
  id: string;
  title: string;
  rawText: string;
  mode: SeasonalModeId;
  locationText: string;
  landmark?: string;
  ward?: string;
  borough?: string;
  lat: number;
  lng: number;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  duplicateGroupId?: string;
  verificationCount: number;
  unresolvedConfirmations: number;
};

const seedBases: SeedBase[] = [
  {
    id: "issue-behala-01",
    title: "Behala flooded lane with blocked drain",
    rawText: "Water is knee deep near the drain and plastic is blocking it.",
    mode: "monsoon_flood_dengue",
    locationText: "Behala, Banamali Naskar Road",
    landmark: "Near market lane",
    ward: "Ward 128",
    borough: "Borough XIV",
    lat: 22.4986,
    lng: 88.3137,
    status: "verified",
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-05T07:30:00.000Z",
    duplicateGroupId: "behala-flood-drain-01",
    verificationCount: 7,
    unresolvedConfirmations: 5
  },
  {
    id: "issue-behala-02",
    title: "Same Behala drain overflows after rain",
    rawText: "Drain mouth still blocked after rain, water entering homes.",
    mode: "monsoon_flood_dengue",
    locationText: "Behala, Banamali Naskar Road",
    ward: "Ward 128",
    borough: "Borough XIV",
    lat: 22.499,
    lng: 88.3142,
    status: "duplicate",
    createdAt: "2026-07-02T11:20:00.000Z",
    updatedAt: "2026-07-04T18:10:00.000Z",
    duplicateGroupId: "behala-flood-drain-01",
    verificationCount: 4,
    unresolvedConfirmations: 4
  },
  {
    id: "issue-garia-01",
    title: "Garia waterlogging hiding pothole",
    rawText: "Water has covered a pothole near the auto stand.",
    mode: "monsoon_flood_dengue",
    locationText: "Garia, near auto stand",
    ward: "Ward 111",
    borough: "Borough XI",
    lat: 22.4615,
    lng: 88.3928,
    status: "new",
    createdAt: "2026-07-03T08:45:00.000Z",
    updatedAt: "2026-07-05T06:55:00.000Z",
    verificationCount: 3,
    unresolvedConfirmations: 3
  },
  {
    id: "issue-bansdroni-01",
    title: "Bansdroni stagnant water and mosquitoes",
    rawText: "Stagnant water has collected beside garbage; mosquitoes are increasing.",
    mode: "monsoon_flood_dengue",
    locationText: "Bansdroni, Naktala connector lane",
    ward: "Ward 113",
    borough: "Borough XI",
    lat: 22.4726,
    lng: 88.362,
    status: "in_progress",
    createdAt: "2026-07-02T15:30:00.000Z",
    updatedAt: "2026-07-05T09:20:00.000Z",
    verificationCount: 5,
    unresolvedConfirmations: 2
  },
  {
    id: "issue-amherst-01",
    title: "Amherst Street recurring flood point",
    rawText: "Waterlogging at Thanthania side again after short rain.",
    mode: "monsoon_flood_dengue",
    locationText: "Amherst Street / Thanthania",
    ward: "Ward 38",
    borough: "Borough IV",
    lat: 22.5804,
    lng: 88.363,
    status: "verified",
    createdAt: "2026-06-28T12:00:00.000Z",
    updatedAt: "2026-07-05T08:05:00.000Z",
    duplicateGroupId: "amherst-waterlogging-01",
    verificationCount: 7,
    unresolvedConfirmations: 6
  },
  {
    id: "issue-amherst-02",
    title: "Thanthania drain overflow reported again",
    rawText: "Same corner near Thanthania has drain overflow.",
    mode: "monsoon_flood_dengue",
    locationText: "Amherst Street / Thanthania Kalibari approach",
    ward: "Ward 38",
    borough: "Borough IV",
    lat: 22.5797,
    lng: 88.3637,
    status: "duplicate",
    createdAt: "2026-07-04T10:00:00.000Z",
    updatedAt: "2026-07-04T10:30:00.000Z",
    duplicateGroupId: "amherst-waterlogging-01",
    verificationCount: 2,
    unresolvedConfirmations: 2
  },
  {
    id: "issue-bypass-01",
    title: "EM Bypass pothole after rain",
    rawText: "A large pothole opened after rain near the service lane.",
    mode: "monsoon_flood_dengue",
    locationText: "EM Bypass service lane",
    ward: "Ward 109",
    borough: "Borough XII",
    lat: 22.4818,
    lng: 88.3963,
    status: "new",
    createdAt: "2026-07-05T05:40:00.000Z",
    updatedAt: "2026-07-05T05:40:00.000Z",
    verificationCount: 1,
    unresolvedConfirmations: 1
  },
  {
    id: "issue-kumartuli-01",
    title: "Kumartuli Puja prep blocking lane",
    rawText: "Puja preparation material is narrowing the lane and blocking access.",
    mode: "pujo_safety",
    locationText: "Kumartuli idol workshop lane",
    ward: "Ward 9",
    borough: "Borough I",
    lat: 22.6003,
    lng: 88.363,
    status: "new",
    createdAt: "2026-06-25T14:30:00.000Z",
    updatedAt: "2026-06-25T16:00:00.000Z",
    verificationCount: 2,
    unresolvedConfirmations: 1
  },
  {
    id: "issue-pujo-exit-01",
    title: "Pujo exit narrow with exposed wiring",
    rawText: "Pandal exit is too narrow, wire is hanging near barricade.",
    mode: "pujo_safety",
    locationText: "Deshapriya Park Pujo para",
    ward: "Ward 90",
    borough: "Borough VIII",
    lat: 22.5177,
    lng: 88.352,
    status: "verified",
    createdAt: "2025-10-01T19:30:00.000Z",
    updatedAt: "2025-10-02T12:00:00.000Z",
    duplicateGroupId: "pujo-exit-wire-01",
    verificationCount: 6,
    unresolvedConfirmations: 5
  },
  {
    id: "issue-pujo-exit-02",
    title: "Bamboo near Pujo gate holding rainwater",
    rawText: "Bamboo support near the gate is holding rainwater and mosquitoes.",
    mode: "pujo_safety",
    locationText: "Deshapriya Park Pujo para gate",
    ward: "Ward 90",
    borough: "Borough VIII",
    lat: 22.518,
    lng: 88.3525,
    status: "verified",
    createdAt: "2025-10-01T21:00:00.000Z",
    updatedAt: "2025-10-02T11:00:00.000Z",
    duplicateGroupId: "pujo-exit-wire-01",
    verificationCount: 3,
    unresolvedConfirmations: 3
  },
  {
    id: "issue-post-pujo-01",
    title: "Leftover bamboo and plastic blocking drain",
    rawText: "Pandal waste is still blocking the footpath and drain two days after immersion.",
    mode: "post_pujo_cleanup",
    locationText: "Rashbehari connector lane",
    ward: "Ward 85",
    borough: "Borough VIII",
    lat: 22.5176,
    lng: 88.3567,
    status: "fixed",
    createdAt: "2025-10-25T09:15:00.000Z",
    updatedAt: "2025-11-02T09:15:00.000Z",
    verificationCount: 2,
    unresolvedConfirmations: 0
  },
  {
    id: "issue-winter-market-01",
    title: "Winter market garbage burning and road dust",
    rawText: "Garbage is being burned beside a broken dusty road near the market.",
    mode: "winter_air_dust",
    locationText: "Lake Market side lane",
    ward: "Ward 87",
    borough: "Borough VIII",
    lat: 22.513,
    lng: 88.352,
    status: "fixed",
    createdAt: "2026-01-12T07:20:00.000Z",
    updatedAt: "2026-01-20T08:30:00.000Z",
    verificationCount: 4,
    unresolvedConfirmations: 0
  },
  {
    id: "issue-summer-water-01",
    title: "Summer water shortage near broken tap",
    rawText: "No water in this lane since morning. Elderly people are waiting near the public tap.",
    mode: "summer_heat_water",
    locationText: "Chetla para public tap",
    ward: "Ward 82",
    borough: "Borough IX",
    lat: 22.5089,
    lng: 88.3335,
    status: "in_progress",
    createdAt: "2026-04-18T06:40:00.000Z",
    updatedAt: "2026-04-18T10:00:00.000Z",
    verificationCount: 5,
    unresolvedConfirmations: 2
  },
  {
    id: "issue-wetlands-01",
    title: "Debris dumping near bheri",
    rawText: "Truck dumped debris near this bheri. Water channel is getting blocked.",
    mode: "wetlands_watch",
    locationText: "East Kolkata Wetlands, Bantala side",
    ward: "Peri-urban edge",
    borough: "Wetlands watch",
    lat: 22.5223,
    lng: 88.455,
    status: "verified",
    createdAt: "2026-05-08T16:15:00.000Z",
    updatedAt: "2026-05-08T17:20:00.000Z",
    verificationCount: 3,
    unresolvedConfirmations: 3
  },
  {
    id: "issue-everyday-light-01",
    title: "Broken streetlight near open manhole",
    rawText: "Streetlight is broken and an open manhole is hard to see at night.",
    mode: "everyday",
    locationText: "Shyambazar para lane",
    ward: "Ward 11",
    borough: "Borough I",
    lat: 22.6011,
    lng: 88.3721,
    status: "new",
    createdAt: "2026-07-05T13:05:00.000Z",
    updatedAt: "2026-07-05T13:05:00.000Z",
    verificationCount: 1,
    unresolvedConfirmations: 1
  }
];

// Seeds run through the same analyzer pipeline as live reports so the stored
// receipt, flags, and departments never disagree with what the UI renders.
export const seedIssues: CivicIssue[] = seedBases.map((base) => {
  const analysis = analyzeIssue({
    text: base.rawText,
    date: base.createdAt,
    approximateLocation: base.locationText,
    userSelectedMode: base.mode
  });

  return {
    ...base,
    cleanSummary: analysis.cleanSummary,
    category: analysis.category,
    subcategories: analysis.subcategories,
    severity: analysis.severity,
    riskFlags: analysis.riskFlags,
    departmentSuggestions: analysis.departmentSuggestions,
    receipt: createReceipt(base.id, analysis),
    analysisEngine: "rules",
    isSeed: true
  };
});
