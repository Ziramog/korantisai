# Implementation Plan — Phase 3: Next.js Migration (Shadow Build)

This plan supersedes the previous draft. We are migrating the existing cinematic prototype (vanilla HTML/CSS/JS) into a production Next.js 14 App Router application.

**Core Principle:** *Preserve emotional fidelity while changing architecture.*
We are NOT adding new capabilities, and we are NOT building the backend or database yet. Interaction model → Component system → Schema (derived) → Backend.

## 3. Refined Phase 3 Execution Plan (Safe Version)

### Phase 3A — Next.js Scaffold (pure shell only)
- Initialize project at `f:\KORANTIS\korantis-app` using `create-next-app` (App Router, Tailwind, TypeScript).
- Setup font system (Cormorant Garamond + fallback sans).
- Scaffold global layout only.
- *No Supabase yet. No data model yet.*

### Phase 3B — UI Migration Layer
- Port global CSS variables to design tokens (Tailwind + CSS variables).
- Port layout system.
- Build `<VenueCard />` (static, no logic).
- Build `<SearchBar />` (UI only).
- Build `<GlobalNav />` (UI only).
- Build `<TasteRadar />` placeholder.
- Build Feed container (static mock data).

### Phase 3C — Interaction Rebinding
- Re-implement circadian engine as a client-side React context or hook (modifies UI state only).
- Port feed ordering logic to client-side.
- Port motion system (CSS transitions/Framer Motion).

### Phase 3D — Data Layer Introduction
- Introduce Supabase cloud connection.
- Create `venues` table and `embeddings` column.

### Phase 3E — Vector + Ranking Integration
- Enable `pgvector` search.
- Integrate hybrid ranking (circadian + taste vector + query embedding).

---

## Current Objective (Executing Now)
We are executing **Phase 3A and 3B** immediately to set up the shadow build and port the visual shell.
