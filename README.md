# ParaReport

ParaReport is a Kolkata-first civic intelligence app. It turns citizen photos,
voice notes, and local-language reports into verified civic receipts,
department-ready complaint packets, and para-level civic memory.

It supports seasonal civic modes for Kolkata: Monsoon Flood and Dengue, Pujo
Safety, Summer Heat and Water, Winter Air and Dust, Post-Pujo Cleanup,
Pre-Monsoon Storm Prep, East Kolkata Wetlands Watch, and Everyday Para Mode.

## Prototype

This repository contains a usable Next.js prototype with:

- A mobile-first reporting flow on the first screen.
- All eight seasonal modes.
- A deterministic structured analyzer that mirrors the Gemma JSON contract.
- Civic receipt rendering with Bengali share text and English complaint text.
- Demo flows for monsoon, Pujo, summer, winter, wetlands, and post-Pujo cleanup.
- A para-level issue list, duplicate clusters, and seasonal ward dashboard.
- A Gemma adapter boundary in `lib/gemma.ts` that falls back to the mock analyzer
  when no API key is configured.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Inputs

Monsoon:

```txt
Water is knee deep near the drain. Plastic is blocking it. A light pole is sparking.
```

Pujo:

```txt
Pandal exit is too narrow, wire is hanging near barricade, bamboo is holding rainwater.
```

## Architecture

The product renders only from validated structured output:

1. `AnalyzeIssueInput` enters the analyzer.
2. The deterministic mock analyzer or Gemma adapter returns `AnalyzeIssueOutput`.
3. `lib/receipts.ts` converts the analysis into a `CivicReceipt`.
4. Components render the receipt, dashboard, and civic memory views.
