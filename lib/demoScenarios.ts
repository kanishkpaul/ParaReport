import type { DemoScenario } from "@/types/civic";

export const demoScenarios: DemoScenario[] = [
  {
    id: "monsoon",
    label: "Monsoon critical",
    mode: "monsoon_flood_dengue",
    location: "Behala, near Banamali Naskar Road",
    text: "Water is knee deep near the drain. Plastic is blocking it. A light pole is sparking."
  },
  {
    id: "pujo",
    label: "Pujo safety",
    mode: "pujo_safety",
    location: "South Kolkata Pujo para gate",
    text: "Pandal exit is too narrow, wire is hanging near barricade, bamboo is holding rainwater."
  },
  {
    id: "summer",
    label: "Summer water",
    mode: "summer_heat_water",
    location: "Chetla para public tap",
    text: "No water in this lane since morning. Elderly people are waiting near the public tap."
  },
  {
    id: "winter",
    label: "Winter dust",
    mode: "winter_air_dust",
    location: "Lake Market side lane",
    text: "Garbage is being burned beside a broken dusty road near the market."
  },
  {
    id: "wetlands",
    label: "Wetlands watch",
    mode: "wetlands_watch",
    location: "East Kolkata Wetlands, Bantala side",
    text: "Truck dumped debris near this bheri. Water channel is getting blocked."
  },
  {
    id: "post-pujo",
    label: "Post-Pujo cleanup",
    mode: "post_pujo_cleanup",
    location: "Rashbehari connector lane",
    text: "Pandal waste is still blocking the footpath and drain two days after immersion."
  }
];
