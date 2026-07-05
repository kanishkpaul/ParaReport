# ParaReport

ParaReport is a Kolkata-first civic intelligence app. It turns citizen photos and
local-language reports into verified civic receipts, department-ready complaint
packets, and para-level civic memory.

Every report is persisted, auto-clustered with earlier reports from the same
location, and gets a shareable public receipt page. Eight seasonal modes cover
the whole Kolkata year: Monsoon Flood and Dengue, Pujo Safety, Summer Heat and
Water, Winter Air and Dust, Post-Pujo Cleanup, Pre-Monsoon Storm Prep, East
Kolkata Wetlands Watch, and Everyday Para Mode.

## Product loop

1. **Report** (`/`) — text in Bengali/Hindi/English plus an optional photo and
   location. The analyzer classifies mode, severity, risk flags, and departments,
   then generates the civic receipt (citizen actions, volunteer checklist,
   official English complaint, Bengali/Hindi share text).
2. **Persist + cluster** — the report is stored in SQLite and matched against
   existing reports at the same location, building recurring-hotspot memory.
3. **Share** (`/issues/[id]`) — every report has a public receipt URL with OG
   metadata and WhatsApp share actions.
4. **Track** (`/issues`, `/dashboard`) — live feed with map, filters,
   "still unresolved" confirmations, "fixed with proof" photo uploads, and a
   ward dashboard computed entirely from real report data.

## Stack

- Next.js (App Router) + TypeScript + React 19
- SQLite via Node's built-in `node:sqlite` (Node 22.13+ required; no native deps).
  DB file lives at `data/parareport.db`, auto-migrated and seeded on first run.
- Leaflet + OpenStreetMap tiles for the issue map
- Gemma (Google AI) for analysis, with a deterministic offline rules engine as
  fallback — the app is fully functional without any API key

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The database seeds itself with 15 sample Kolkata
issues on first run; delete `data/` to reset.

### Enable Gemma analysis (optional)

```bash
# .env.local
GEMMA_API_KEY=your-google-ai-studio-key
# optional, defaults to gemma-3-27b-it
GEMMA_MODEL=gemma-3-27b-it
```

With a key set, reports (including photos) are analyzed by Gemma; every stored
issue records which engine produced its analysis (`analysisEngine: "gemma" | "rules"`).
Malformed model output falls back to the rules engine per field, so the receipt
schema is always valid.

## API

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/reports` | POST | Submit report (JSON or multipart with `photo`) |
| `/api/reports` | GET | List issues (`mode`, `severity`, `status`, `groupId` filters) |
| `/api/reports/[id]` | GET | Issue + cluster summary |
| `/api/reports/[id]/confirm` | POST | Resident confirms still unresolved |
| `/api/reports/[id]/resolve` | POST | Mark fixed (optional multipart `proof` photo) |

## Deployment notes

The app is a single Node server (SQLite file + local photo uploads), so deploy it
anywhere with a persistent disk: Fly.io, Railway, Render, or a VPS. Serverless
platforms without persistent storage need the storage layer (`lib/db.ts`,
`lib/uploads.ts`) swapped for Postgres + object storage — both are isolated
behind small modules for that reason.

ParaReport generates department-ready civic packets. It does not submit to KMC
systems and never claims official complaint status.
