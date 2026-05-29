# Korantis — Milestones & Advances Completed

This document outlines the cumulative engineering, mathematical modeling, and interactive visual scaffolding accomplished during the development and shadow migration of **Korantis** (places discovered for how you want to feel).

---

## ═══════════════════════════════════════════
## THE CORE CONCEPT & ARCHITECTURE
## ═══════════════════════════════════════════

Korantis is a premium, dark-cinematic, mobile-first editorial application that leverages a continuous **8-dimensional latent vector coordinate taxonomy** to rank and display venues dynamically based on circadian anchors, search intents, and implicit dwell telemetry. 

### Core Dimensional Taxonomy
Every space, active search query, and user taste profile is represented as a normalized continuous vector in $\mathbb{R}^8$ bounded within $[-1.0, 1.0]$:
1. **Solitude vs. Sociality ($D_0$):** Intimate, quiet corners vs. buzzing social groups.
2. **Restraint vs. Raw Authenticity ($D_1$):** Minimalist luxury/purity vs. unpolished organic edges.
3. **Intellect vs. Warm Sensuality ($D_2$):** Cool, stark gallery spaces vs. warm romantic moods.
4. **Sunlight vs. Amber Enclosure ($D_3$):** Airy glass pavilions vs. dark subterranean basement retreats.
5. **Fast Ritual vs. Slow Pause ($D_4$):** Quick espresso bars vs. multi-hour lingering spots.
6. **Urban Edge vs. Nature Infusion ($D_5$):** Concrete rooftops vs. lush garden sanctuaries.
7. **Minimal Clarity vs. Layering ($D_6$):** Pure Nordic/Japanese designs vs. maximalist vintage clutter.
8. **Nostalgia vs. Avant-Garde ($D_7$):** Historic, classical vaults vs. experimental concept spaces.

---

## ═══════════════════════════════════════════
## CHRONOLOGICAL PHASE ACCOMPLISHMENTS
## ═══════════════════════════════════════════

### ── Phase 1: Atomic Card System & Exploration
* **Layout Compositions:** Scaffolds six distinct editorial card compositions matching premium print-magazine layout styles:
  * **Cinematic Full-Bleed:** Large margins, full image cover overlays, text layers.
  * **Vertical Immersive:** Elongated aspect ratio, structural bottom gold lines.
  * **Layered Editorial:** Floating glassmorphic panel with blurred background.
  * **Compact Atmospheric / Editorial Split / Typographic Minimal.**
* **Typography Systems:** Mounted elegant Google Font structures integrating `Cormorant Garamond` (classic serif display titles) and `DM Sans` (clean modern sans body copy).

### ── Phase 2: Latent Vector Engine & Vanilla Prototype
* **Mathematical Vector Calculations:** Authored `taste.js` and `ranking.js` implementing continuous drift formulas:
  * **Cosine Similarity:** Computes spatial proximity between active 8D vectors.
  * **Telemetry Feedback Loop:** Records implicit user metrics:
    * **Clicks:** Shakes transient session taste toward the selected venue ($LR = 0.15$) and baseline profiles ($LR = 0.015$).
    * **Dwells:** Graded logarithm-scale rewards ($LR = 0.05 \times \ln(1 + \Delta t)$) for card dwell times exceeding 2.0 seconds.
    * **Pass-Throughs:** Milder vector repulsion ($LR = 0.02$) away from ignored items scrolled past in under 800ms.
* **Circadian Drift Engine:** Engineered continuous time interpolation across six 24-hour day-night anchors, driving reactive CSS parameters to match atmospheric states.
* **Taste Radar Canvas:** Designed a multi-layered canvas element plotting user baseline outlines (white) and session transient coordinates (glowing gold).
* **Database Expansion:** Scaled mock data from 4 to 12 curated Buenos Aires venue profiles, populating high-fidelity graphics.
* **Glassmorphic Navigation Shell:** Structured floating glass navigation bars, tab-switching routes, and overlay transition modules.

### ── Phase 3: Next.js Production Migration (Shadow Build)
We successfully ported the static visual prototype into a production-ready **Next.js 14 App Router** codebase located inside `/korantis-app`, implementing high-performance modular React architectures:

* **Unified React Engine Context (`CircadianContext.tsx`):**
  * Integrated all circadian timers, device local storage synchronization, 8D vector derivations, search filters, and unified scoring logic into a single cohesive provider context.
* **HiDPI Retina Radar (`TasteRadar.tsx`):**
  * Re-architected the `<TasteRadar />` canvas context to scale dynamically using `window.devicePixelRatio`. Axes, text markers, and polygons render crisp curves without any pixel blur on high-density OLED phone viewports.
* **Framer Motion Sorting choreography (`page.tsx`):**
  * Integrated spring-based layout animations on the main feed container. Changing active filters or entering query keywords triggers an automatic visual sort animation where cards glide smoothly to their new sorted positions.
* **Ergonomic Mobile Filter Rail (`SearchBar.tsx`):**
  * Optimised the seven atmospheric filter pills to scroll horizontally in a single momentum scroll snap rail on mobile screens with custom-hidden scrollbars, leaving more display space for the editorial cards.
* **Compact Details Flow (`VenueDetail.tsx`):**
  * Shifted detail headers to adapt layout heights dynamically (`52vh` on mobile vs `75vh` on desktop) ensuring narrative text rests above the viewport fold. Stacked chrono-atmospheric shifts and dividing grids for mobile screens.
* **Procedural Background layers (`globals.css` / `layout.tsx`):**
  * Replaced redundant static noise files with an inline SVG `fractalNoise` turbulence grain overlay filter, eliminating 404 network assets while rendering crisp cinematic grain.
* **Atmosphere Engine Debug HUD (`AtmosphereDebug.tsx`):**
  * Designed an overlay inspector dashboard mapping the active time-scrubber timeline, freeze anchors, and continuous 8-dimensional baseline/transient level controls.

---

## ═══════════════════════════════════════════
## ARCHITECTURAL WEIGHTS & SCORING MATRICES
## ═══════════════════════════════════════════

The final Unified Score $S$ for each venue is derived as a linear combination of its sub-scores:

$$S = w_c \cdot C + w_t \cdot T + w_i \cdot I + w_x \cdot X$$

Where:
* **$C$ (Circadian Proximity):** Time circular difference between current hour and venue peaks.
* **$T$ (Taste Fit):** Normalized cosine similarity between user transient vector and venue vectors.
* **$I$ (Intent Match):** Cosine similarity between current search input vector (from pills/keywords) and venue vectors.
* **$X$ (Context Index):** Standard baseline quality weight.

### Scoring Weight Weights ($w$)
* **Passive Discovery:** $w_c = 0.40$, $w_t = 0.40$, $w_i = 0.00$, $w_x = 0.20$
* **Active Search:** $w_c = 0.10$, $w_t = 0.20$, $w_i = 0.60$, $w_x = 0.10$

### 🔧 Phase 3D: Supabase Data Layer Introduction
* **Cloud Database Schema:** Provisioned a live Supabase PostgreSQL database integrating the `pgvector` extension.
* **Schema Migration:** Created `venues` table mapping all 12 properties alongside dynamic 8D `taste_vector` columns.
* **Vector Seeding Pipeline:** Wrote a `ts-node` ingestion pipeline mapping the static Next.js mock venues and injecting randomized initial latent coordinate configurations natively into Postgres.

### 🧠 Phase 3E: Dynamic Vector Search Integration
* **API Route Bridge:** Established `/api/venues` serverless route handling secure environment variables and translating Supabase snake_case responses to the frontend camelCase interface.
* **Client-Side Live Ranking:** Overwrote static `MOCK_VENUES` import inside `CircadianContext.tsx` with a live async fetch effect. The unified scoring engine (Circadian + Intent + Taste) now performs math dynamically directly against the live Supabase `taste_vector` coordinates without losing the 60fps Framer Motion spring layout sorting capabilities.
