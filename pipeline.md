# Korantis — Semantic Ingestion Pipeline
## Atmospheric Data Acquisition Architecture

> *"Korantis knows how to think. This document explains where truth comes from."*

---

## Table of Contents

1. [The Core Problem](#1-the-core-problem)
2. [The Four Data Layers](#2-the-four-data-layers)
3. [Layer 1 — Canonical Venue Data](#3-layer-1--canonical-venue-data)
4. [Layer 2 — Atmospheric Priors](#4-layer-2--atmospheric-priors)
5. [Layer 3 — Semantic Embeddings](#5-layer-3--semantic-embeddings)
6. [Layer 4 — Behavioral Reality](#6-layer-4--behavioral-reality)
7. [The Atmospheric Bootloader Concept](#7-the-atmospheric-bootloader-concept)
8. [Admin Curation System](#8-admin-curation-system)
9. [Semantic Ingestion Pipeline](#9-semantic-ingestion-pipeline)
10. [Review & Text Mining Architecture](#10-review--text-mining-architecture)
11. [Image Intelligence Pipeline](#11-image-intelligence-pipeline)
12. [Psychogeographic Inference Engine](#12-psychogeographic-inference-engine)
13. [Behavioral Adaptation Engine](#13-behavioral-adaptation-engine)
14. [Validation Loop Architecture](#14-validation-loop-architecture)
15. [Database Schema Extensions](#15-database-schema-extensions)
16. [Pipeline Orchestration](#16-pipeline-orchestration)
17. [Data Quality Framework](#17-data-quality-framework)
18. [Confidence Scoring System](#18-confidence-scoring-system)
19. [Scale Strategy](#19-scale-strategy)
20. [Phase Roadmap: 4 → 7](#20-phase-roadmap-4--7)

---

## 1. The Core Problem

Korantis is not a venue directory. It is a **semantic atmosphere engine**. The distinction matters because it defines everything about where the data comes from and how it becomes machine-readable.

A conventional venue database stores:

```
name: "El Federal"
category: "café"
rating: 4.2
price: $$
hours: Mon-Sun 8am-11pm
```

Korantis needs to store something fundamentally different:

```
name: "El Federal"
emotional_texture: "time-preserved, melancholic warmth"
pacing: 0.2          ← slow, unhurried
light_quality: 0.75  ← warm, amber, afternoon-window light
social_density: 0.3  ← sparse, solitary-friendly
temporal_feel: "exists outside current time"
spatial_psychology: "corner anchor, historic permanence"
cinematic_score: 0.88
solitude_support: 0.9
```

**This data does not exist anywhere.** It cannot be scraped. It cannot be purchased. It must be inferred, curated, extracted, and learned. That inference pipeline is one of Korantis's core technical assets.

### Why This Is Hard

| Conventional Data | Atmospheric Data |
|---|---|
| Exists in APIs | Must be constructed |
| Objective fact | Perceptual reality |
| Stable | Temporally shifting |
| Easy to scrape | Requires interpretation |
| Commodity | Competitive moat |
| Low signal | High signal |

### What the Pipeline Must Solve

```
Raw signals                   Korantis needs
─────────────────────────     ─────────────────────────────────
Google Places listing     →   Does this place feel fast or slow?
Yelp reviews (1000 texts) →   What emotional state does it induce?
Instagram photo grid      →   What does the light feel like at 3pm?
Foursquare check-ins      →   Who actually comes here and when?
Editorial mentions        →   How do writers describe this place?
User behavior             →   What does choosing this place reveal?
```

The pipeline is the translation engine between **raw signal** and **machine-readable atmosphere**.

---

## 2. The Four Data Layers

The architecture operates across four distinct layers, each with different acquisition methods, update frequencies, confidence levels, and roles in the final venue vector.

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 4 — BEHAVIORAL REALITY                                       │
│  Saves · Dwell · Revisits · Ignored venues · Session patterns       │
│  Source: User interaction with Korantis itself                      │
│  Confidence: Highest (revealed preference)                          │
│  Available: Post-traction (500+ users)                              │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — SEMANTIC EMBEDDINGS                                      │
│  Reviews · Captions · Editorial text · Photo embeddings             │
│  Source: External text + image signals, ML inference                │
│  Confidence: High (corpus-validated)                                │
│  Available: Month 2+ (after ingestion pipeline built)               │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — ATMOSPHERIC PRIORS                                       │
│  Admin sliders · Curatorial judgment · Human-seeded vectors         │
│  Source: Human curation (the team)                                  │
│  Confidence: High (intentional, editorial)                          │
│  Available: Week 1 (MVP foundation)                                 │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 1 — CANONICAL VENUE DATA                                     │
│  Name · Coordinates · Hours · Category · Address · Images           │
│  Source: Google Places · Foursquare · OSM · Mapbox                  │
│  Confidence: High for facts, zero for atmosphere                    │
│  Available: Immediately via API                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Layer Weight Evolution

The relative influence of each layer shifts as the product matures:

```
MVP (Week 1–8):
  Layer 1: 20%  (grounding)
  Layer 2: 80%  (the bootloader — all atmospheric truth)
  Layer 3:  0%  (not yet built)
  Layer 4:  0%  (no users yet)

V1 (Month 3–6):
  Layer 1: 10%
  Layer 2: 50%  (still dominant, but being validated)
  Layer 3: 35%  (embeddings coming online)
  Layer 4:  5%  (early behavioral signals)

Platform (Month 12+):
  Layer 1:  5%
  Layer 2: 20%  (still respected; human judgment matters)
  Layer 3: 40%  (embeddings are primary inference engine)
  Layer 4: 35%  (behavioral truth is the strongest signal)
```

---

## 3. Layer 1 — Canonical Venue Data

### Purpose

Ground-truth facts about the venue's existence: location, hours, category, contact. This is **commodity infrastructure**, not differentiation. The goal is to get it once, keep it fresh, and not over-invest.

### Sources

```
Primary:
  Google Places API       — name, address, hours, phone, website, photos, rating
  Mapbox Geocoding API    — coordinates, district, neighborhood
  OpenStreetMap           — geospatial context, walkability, density

Secondary:
  Foursquare Places API   — category taxonomy, check-in density signals
  Instagram Graph API     — cover photos, active presence indicator
  Venue's own website     — hours confirmation, menu, vibe signals
```

### Acquisition Script

```typescript
// scripts/layer1-acquire.ts
interface CanonicalVenueData {
  googlePlaceId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  district: string;
  hours: WeeklyHours;
  phone?: string;
  website?: string;
  priceLevel: 1 | 2 | 3 | 4;
  category: string;
  googleRating: number;
  totalReviews: number;
  googlePhotos: string[];  // raw Google CDN URLs — will be rehosted
}

async function acquireCanonicalData(
  googlePlaceId: string
): Promise<CanonicalVenueData> {
  const placeDetails = await googlePlacesClient.getDetails({
    placeId: googlePlaceId,
    fields: [
      'name', 'formatted_address', 'geometry',
      'opening_hours', 'formatted_phone_number', 'website',
      'price_level', 'types', 'rating', 'user_ratings_total',
      'photos', 'editorial_summary',
    ],
  });

  const district = await resolveDistrict(
    placeDetails.geometry.location,
    'buenos_aires'
  );

  return mapToCanonicalFormat(placeDetails, district);
}
```

### What Layer 1 Does NOT Give You

```
✓ Does give:  name, location, hours, phone, category (coarse)
✗ Does NOT:   emotional texture, pacing, light feel, social energy,
              work-friendliness, romantic charge, solitude support,
              cinematic quality, neighborhood soul, temporal mood
```

Everything Korantis cares about is above Layer 1.

### Freshness Strategy

```
Hours:         Refresh weekly (businesses change hours)
Contact info:  Refresh monthly
Photos:        Refresh quarterly (check for new images)
Existence:     Verify monthly (is_active check via API)
Coordinates:   Rarely change; refresh annually
```

---

## 4. Layer 2 — Atmospheric Priors

### The Atmospheric Bootloader

Layer 2 is the most important layer for MVP and remains permanently significant. It represents **intentional human judgment** — the curatorial intelligence that defines Korantis's editorial identity.

The metaphor is precise: an atmospheric bootloader is what loads first, runs the system, and eventually hands control to more autonomous processes — but it never fully disappears. The BIOS doesn't go away when the OS loads.

### The 8-Dimensional Atmosphere Vector

Each venue is scored on 8 perceptual dimensions by a human curator:

```typescript
interface AtmosphereVector {
  // Dimension 1: Solitude Support
  // Does this place support being alone without feeling exposed?
  // 0.0 = hostile to solo presence
  // 1.0 = sanctuary for the solitary
  solitude: number;

  // Dimension 2: Pacing
  // What is the implicit speed of this place?
  // 0.0 = slow, languid, timeless
  // 1.0 = fast, transactional, efficient
  pacing: number;

  // Dimension 3: Warmth
  // Material and emotional warmth — wood, amber, softness
  // 0.0 = cold, minimal, white, concrete
  // 1.0 = warm, amber, textured, enveloping
  warmth: number;

  // Dimension 4: Intimacy
  // Physical and emotional proximity to others
  // 0.0 = open, airy, public
  // 1.0 = enclosed, private, close
  intimacy: number;

  // Dimension 5: Light Quality
  // The character of the light (not just brightness)
  // 0.0 = cool, fluorescent, artificial
  // 1.0 = natural, warm, window-lit, golden
  lightQuality: number;

  // Dimension 6: Formality
  // Social expectations and dress code implicit in the space
  // 0.0 = casual, worn-in, comfortable
  // 1.0 = formal, refined, elevated
  formality: number;

  // Dimension 7: Noise Architecture
  // What kind of silence or sound fills the space?
  // 0.0 = library-still, conversations impossible to overhear
  // 1.0 = loud, immersive, all voices blended
  noiseArchitecture: number;

  // Dimension 8: Cinematic Quality
  // Would a filmmaker choose this as a location? Does it have soul?
  // 0.0 = generic, could be anywhere
  // 1.0 = unmistakably itself, irreplaceable visual identity
  cinematicQuality: number;
}
```

### Extended Atmosphere Fields

Beyond the 8D vector, curators also tag:

```typescript
interface AtmosphericPriors {
  vector: AtmosphereVector;

  // Temporal signatures
  temporalMoods: {
    morning: string;    // "quiet anticipation, steam, light entry"
    afternoon: string;  // "settled work rhythm, low conversation"
    evening: string;    // "amber shift, slower pacing, wine appears"
    lateNight: string;  // "intimate, few remaining, confidential"
  };

  // Spatial psychology
  spatialCharacter: {
    // Does the place have "corners"? Secluded seating?
    solitudeZones: 'none' | 'limited' | 'generous';
    // Does the ceiling feel high or enclosed?
    verticalFeeling: 'cave' | 'grounded' | 'expansive';
    // Relationship between interior and outside world
    insideOutsideRelation: 'sealed' | 'aware' | 'porous' | 'merged';
    // Does the place feel permanent or temporary?
    temporalAnchor: 'transient' | 'current' | 'established' | 'historic';
  };

  // Intent compatibility
  intentCompatibility: {
    deepWork: number;       // 0–1
    softWork: number;       // 0–1 (emails, light reading)
    deepConversation: number;
    firstDate: number;
    groupEnergy: number;
    readingAlone: number;
    morningRitual: number;
    lateNightRetreat: number;
  };

  // Neighborhood psychogeography
  neighborhoodRelation: {
    // Does the venue reflect its neighborhood or contradict it?
    districtEcho: 'contrast' | 'neutral' | 'amplifies';
    walkabilityContext: string; // "arrives by foot, tree-lined block"
    surroundingEnergy: string;  // "residential quiet, creative cluster"
  };

  // Curatorial notes
  curatorialVoice: string;  // 2–3 sentences, editorial prose, no superlatives
  editorialTagline: string; // 8–12 words: "Slow light and espresso ritual in old Palermo"
}
```

### The Admin Curation Interface

The interface for seeding Layer 2 must be as considered as the product itself. Curators should be able to *feel* the venue as they fill it in — not check boxes in a spreadsheet.

```
┌──────────────────────────────────────────────────────────────┐
│  KORANTIS CURATOR                          El Federal · saved │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ATMOSPHERE VECTOR                                           │
│  ─────────────────────────────                               │
│                                                              │
│  Solitude     ●────────────────○  0.85                       │
│  Pacing       ●──○             ○  0.18  (slow)               │
│  Warmth       ●────────────────○  0.82                       │
│  Intimacy     ●──────○         ○  0.55                       │
│  Light        ●───────────○    ○  0.70  (warm natural)       │
│  Formality    ○──○             ○  0.22  (casual, worn-in)    │
│  Noise        ●───○            ○  0.28  (low hum)            │
│  Cinematic    ●────────────────○  0.91                       │
│                                                              │
│  ─────────────────────────────                               │
│  INTENT COMPATIBILITY                                        │
│                                                              │
│  ☑ Deep work          ☑ Reading alone                        │
│  ☑ Soft work          ☑ Morning ritual                       │
│  ☐ Group energy       ☑ Late night retreat                   │
│  ☐ First date         ☑ Deep conversation                    │
│                                                              │
│  ─────────────────────────────                               │
│  TEMPORAL MOODS                                              │
│                                                              │
│  Morning:  [ quiet anticipation, steam, window light      ]  │
│  Afternoon:[ settled and slow, marble and hum             ]  │
│  Evening:  [ amber shift, tables fill, lower voices       ]  │
│                                                              │
│  ─────────────────────────────                               │
│  CURATORIAL VOICE                                            │
│                                                              │
│  [ El Federal operates as if time agreed to move slowly  ]   │
│  [ here. The marble, the waiters, the light — all of it  ]   │
│  [ predates the city's current anxiety.                  ]   │
│                                                              │
│  TAGLINE                                                     │
│  [ Slow light and espresso ritual in old San Telmo       ]   │
│                                                              │
│  ─────────────────────────────                               │
│  STATUS: [draft] → [reviewed] → [live]       [Save draft]   │
└──────────────────────────────────────────────────────────────┘
```

### Why This Interface Matters

The curation interface is not a backend admin panel. It is a **creative tool** that shapes the product's soul. Every slider a curator moves is a semantic commitment. The quality of the interface directly affects the quality of the data, which directly affects the quality of every search result.

Bad interface → careless curation → degraded atmosphere vectors → broken emotional search.

This is why the admin tool deserves real design investment at MVP.

---

## 5. Layer 3 — Semantic Embeddings

### The Scalable Inference Engine

Layer 3 is where Korantis's atmospheric intelligence becomes scalable. Rather than requiring a human curator to evaluate every new venue, Layer 3 builds an inference system that extracts atmospheric signals from language and imagery at machine speed.

### Sources for Semantic Extraction

```
Primary text signals:
  Google Reviews          → 50–500 reviews per venue
  Yelp Reviews            → complementary corpus, different demographics
  TripAdvisor comments    → traveler perspective (valuable for atmosphere)
  Instagram captions      → user-generated poetic language about places
  Foursquare tips         → concise, often atmospheric

Secondary text signals:
  Editorial mentions      → food blogs, lifestyle media, city guides
  Google editorial summary → short AI-generated summaries (from Google)
  Venue's own language    → "About" page, Instagram bio, menu writing style
  Neighborhood guides     → context about the district and its character

Visual signals:
  Google Photos           → user-contributed interior/exterior shots
  Instagram grid          → curated imagery from venue + visitors
  Venue website photos    → controlled, intentional visual identity
```

### Review Mining Architecture

```
Raw Reviews (1000 texts)
        │
        ▼
┌─────────────────────────────────────────────┐
│  PREPROCESSING                              │
│  - Language detection (filter Spanish + EN) │
│  - Dedup (same user, multiple reviews)      │
│  - Noise filter (rating-only, < 15 words)   │
│  - Recency weight (last 12 months = 2x)     │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  ATMOSPHERIC SIGNAL EXTRACTION              │
│                                             │
│  A. Vibe phrase extraction                  │
│     "tranquilo", "íntimo", "romantico"      │
│     "always quiet", "love working here"     │
│                                             │
│  B. Sensory language detection              │
│     light mentions: "warm light", "windows" │
│     sound mentions: "quiet", "loud music"   │
│     pace mentions: "unhurried", "rushed"    │
│                                             │
│  C. Social density signals                  │
│     "never crowded", "always packed"        │
│     "perfect for a date", "good for groups" │
│                                             │
│  D. Temporal signals                        │
│     "best in the morning", "late night gem" │
│     "great on rainy days"                   │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  EMBEDDING GENERATION                       │
│                                             │
│  Method A: Concatenate + embed              │
│    → Concat all review text (trimmed)       │
│    → Single embedding: "the corpus feel"    │
│    → Fast, good for semantic neighbors      │
│                                             │
│  Method B: Per-review embed + mean pool     │
│    → Embed each review independently        │
│    → Average the vectors                    │
│    → More robust to outlier reviews         │
│    → Use for primary venue embedding        │
│                                             │
│  Method C: Structured extraction + embed   │
│    → GPT-4o-mini extracts key phrases       │
│    → Build structured atmospheric prose    │
│    → Embed the prose (highest quality)     │
│    → Use for final venue embedding update  │
└─────────────────────────────────────────────┘
        │
        ▼
  Layer 3 Embedding (1536-dim vector)
  Stored as: venues.layer3_embedding
```

### Atmospheric Prose Construction (LLM)

The most powerful approach: use the LLM not to rate or score, but to **translate** raw social language into editorial atmospheric prose, then embed that prose.

```typescript
async function buildAtmosphericProse(
  venueName: string,
  reviews: string[],
  instagramCaptions: string[],
  editorialMentions: string[]
): Promise<string> {

  const prompt = `
You are an atmospheric archivist for Buenos Aires.
Study the following raw signals about "${venueName}" and write a single dense paragraph
(80–120 words) describing what this place FEELS LIKE.

Do not summarize. Do not list. Do not use star ratings or adjectives like "great" or "amazing".
Write about: light quality, pacing, social energy, emotional texture, who comes here and why.
Write as if describing a place to someone who will decide whether to go there alone tonight.

Language: English. Tone: literary, precise, atmospheric.
No superlatives. No marketing language. No phrases like "hidden gem" or "must visit".

REVIEWS (sample):
${reviews.slice(0, 30).join('\n---\n')}

INSTAGRAM CAPTIONS:
${instagramCaptions.slice(0, 10).join('\n')}

EDITORIAL:
${editorialMentions.join('\n')}
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.6,
  });

  return response.choices[0].message.content.trim();
}
```

**This atmospheric prose becomes the input to the final venue embedding.** Not the raw reviews. The LLM-distilled essence of what the place feels like, written in a register consistent with Korantis's editorial voice, producing an embedding in the same emotional space as user queries like "quiet café with warm light to work alone tonight."

### Layer 3 Database Fields

```sql
ALTER TABLE venues ADD COLUMN
  layer3_embedding       vector(1536),   -- from review corpus
  atmospheric_prose      text,           -- LLM-distilled description
  review_corpus_size     integer,        -- how many reviews analyzed
  layer3_confidence      numeric(3,2),   -- 0–1 confidence in L3 data
  layer3_updated_at      timestamptz,
  review_source_urls     text[];         -- sources used
```

### Hybrid Embedding: Merging L2 + L3

Once both layers are available, the final venue embedding is a **weighted blend**:

```typescript
function blendEmbeddings(
  layer2Vector: number[],    // from curated atmospheric prose
  layer3Vector: number[],    // from review corpus
  layer2Confidence: number,  // 0–1, always high for curated
  layer3Confidence: number,  // 0–1, based on review volume/quality
): number[] {
  // Dynamically weight by confidence
  const totalConfidence = layer2Confidence + layer3Confidence;
  const w2 = layer2Confidence / totalConfidence;
  const w3 = layer3Confidence / totalConfidence;

  return layer2Vector.map((v, i) =>
    w2 * v + w3 * layer3Vector[i]
  );
}
```

This blended vector lives in `venues.embedding` (the field queried at search time). Layer-specific vectors are stored separately for auditing and experimentation.

---

## 6. Layer 4 — Behavioral Reality

### The Ground Truth Layer

Layer 4 is the most powerful signal and the last to become available. It represents **revealed preference** — what users actually choose, ignore, return to, and abandon. No curation bias. No language interpretation errors. Just behavior.

### Signal Types

```typescript
interface BehavioralSignals {
  // Explicit signals (high confidence)
  saves: number;                // user explicitly wanted to remember this
  collections: number;          // added to a personal list
  shares: number;               // sent to someone else

  // Implicit signals (medium confidence)
  clickThroughRate: number;     // clicked when shown in results
  dwellTime: number;            // seconds on venue detail page
  mapInteractions: number;      // zoomed in, rotated, inspected location
  galleryDepth: number;         // how many images viewed

  // Negative signals (high confidence)
  impressionsWithoutClick: number; // shown repeatedly, never chosen
  bouncedQuickly: boolean;         // opened + closed < 5 seconds

  // Contextual signals (rich but complex)
  queryContexts: string[];      // what queries led to this venue being shown
  timeOfDayPatterns: number[];  // when does this venue get saved? (24h distribution)
  sessionPatterns: {
    sessionType: 'casual_browse' | 'focused_search' | 'repeat_visit';
    precededBy: string[];        // what venues were viewed before
    followedBy: string[];        // what venues were viewed after
  }[];
}
```

### Behavioral Signals → Atmosphere Updates

The critical mechanism: behavioral signals must **update** the atmosphere vector, not just record interactions.

```
Example signal chain:

1. "quiet café to work" query
2. Venue X shown at rank 3
3. Venue X clicked 80% of the time when shown for this query
4. Venue X gets +0.12 on work_friendly dimension
5. Venue X's embedding pulled toward "work + quiet" cluster

The venue becomes more itself through use.
This is the self-sharpening moat.
```

```typescript
// Background job: runs nightly
async function updateAtmosphereFromBehavior(venueId: string) {
  const signals = await aggregateBehavioralSignals(venueId, days = 30);

  if (signals.totalImpressions < 50) return; // insufficient data

  // Query context analysis: what search intents lead to saves?
  const saveContexts = await getQueryContextsLeadingToSaves(venueId);
  const intentClusters = clusterQueryContexts(saveContexts);

  // Compute behavioral drift vector
  const behavioralVector = await buildBehavioralEmbedding(intentClusters);

  // Update venue's final embedding with behavioral weight
  const currentEmbedding = await getVenueEmbedding(venueId);
  const updatedEmbedding = blendWithBehavioral(
    currentEmbedding,
    behavioralVector,
    weight = 0.15  // conservative initial behavioral influence
  );

  await updateVenueEmbedding(venueId, updatedEmbedding);
  await logBehavioralUpdate(venueId, signals, intentClusters);
}
```

### The Behavioral Database

```sql
-- Raw interaction events
CREATE TABLE venue_interactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid REFERENCES venues(id),
  session_id      text NOT NULL,
  user_id         uuid REFERENCES auth.users(id),  -- null for guests
  interaction_type text NOT NULL,
  -- 'impression' | 'click' | 'save' | 'share' | 'gallery_view' | 'map_inspect' | 'bounce'
  query_context   text,          -- what query led here
  dwell_seconds   integer,
  rank_shown      smallint,      -- position in search results when interacted
  time_of_day     smallint,      -- 0–23
  day_of_week     smallint,      -- 0–6
  created_at      timestamptz DEFAULT now()
);

-- Aggregated behavioral scores (updated nightly)
CREATE TABLE venue_behavioral_scores (
  venue_id              uuid PRIMARY KEY REFERENCES venues(id),
  ctr_overall           numeric(4,3),   -- click-through rate overall
  ctr_by_intent         jsonb,          -- {"work": 0.82, "date": 0.23, ...}
  save_rate             numeric(4,3),   -- saves / impressions
  dwell_avg_seconds     integer,
  bounce_rate           numeric(4,3),
  peak_save_hour        smallint,       -- when does this get saved most?
  behavioral_embedding  vector(1536),   -- derived from query contexts
  confidence            numeric(3,2),   -- based on sample size
  sample_size           integer,
  updated_at            timestamptz DEFAULT now()
);
```

### Behavioral Minimum Thresholds

Behavioral signals only become meaningful above certain volumes. Do not apply behavioral updates below these thresholds:

```typescript
const BEHAVIORAL_THRESHOLDS = {
  minImpressionsForCTR: 50,         // need 50 impressions to trust CTR
  minClicksForDwell: 20,            // need 20 clicks to trust dwell time
  minSavesForEmbeddingUpdate: 10,   // need 10 saves to update embedding
  minInteractionsForFullProfile: 100, // need 100 total to build intent profile
};
```

---

## 7. The Atmospheric Bootloader Concept

### The Core Insight

The admin curation system (Layer 2) is not a permanent data entry interface. It is the system that **loads first** and makes everything else possible.

```
Without Layer 2:
  - No atmospheric data at launch
  - pgvector has nothing meaningful to search
  - Users experience "found but wrong feeling" results
  - Product fails immediately

With Layer 2:
  - 100 venues with precise emotional vectors
  - Search works correctly from day one
  - Users experience "it understood me"
  - Product builds trust
  - Behavioral data begins to accumulate
  - Layer 3 has a validation baseline to compare against
```

### The Handoff Sequence

```
Phase 1: Layer 2 is everything
  Human curators seed 100 venues with atmosphere vectors.
  This IS the product's intelligence. Treat it accordingly.

Phase 2: Layer 3 comes online
  Review mining begins. Atmospheric prose generated.
  Compare L3 embeddings to L2-curated vectors.
  Where they agree → L2 was accurate → increase confidence.
  Where they diverge → investigate which is correct.
  This is the validation loop (see §14).

Phase 3: Layer 4 starts feeding back
  Behavioral signals accumulate. Venue vectors drift toward
  what users actually experience and choose.
  Some L2 assumptions are corrected by behavior.
  This is healthy. The machine is learning.

Phase 4: Layer 2 becomes editorial, not foundational
  Human curators still matter — but for:
  - new venue bootstrapping (cold start)
  - editorial override (curatorial voice)
  - flagging behavioral anomalies
  - maintaining tone consistency
  Layer 2 is now the conscience of the system, not the spine.
```

### What Never Gets Automated

Even at full scale, some things stay human:

```
✓ Can automate:
  - Atmosphere scoring from review language
  - Vibe tag classification
  - Embedding generation
  - Behavioral signal aggregation
  - Confidence scoring

✗ Stays human:
  - Curatorial voice / editorial taglines
  - "Is this place actually worth including?"
  - Flagging venues that game signals
  - Aesthetic judgment on photography
  - New city editorial identity
  - When the data is wrong and humans know it
```

---

## 8. Admin Curation System

### Architecture

The admin system is a **separate Next.js route group** with heavy authentication. It is not a third-party CMS — it's built custom because the data model (especially the atmospheric vector) doesn't map cleanly to any generic CMS.

```
app/
└── admin/
    ├── layout.tsx           ← Admin shell: protected, editor-only
    ├── venues/
    │   ├── page.tsx         ← Venue list: status, quality, completeness
    │   ├── new/page.tsx     ← Create: Layer 1 import + L2 seed
    │   └── [id]/
    │       ├── page.tsx     ← Edit: full atmospheric editor
    │       ├── images/page.tsx  ← Image management
    │       └── signals/page.tsx ← L3/L4 signals viewer (read-only)
    ├── collections/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    └── pipeline/
        ├── page.tsx         ← Pipeline status dashboard
        └── jobs/page.tsx    ← Enrichment job queue
```

### Venue Completeness Scoring

Track how complete each venue's data is across all layers:

```typescript
interface VenueCompleteness {
  layer1Score: number;    // 0–1: how complete is canonical data?
  layer2Score: number;    // 0–1: how complete is the atmosphere vector?
  layer3Score: number;    // 0–1: has review mining been run?
  imageScore: number;     // 0–1: 5+ images, at least 1 hero quality?
  readyForPublish: boolean;
  missingFields: string[];
}

function computeCompleteness(venue: Venue): VenueCompleteness {
  const l2 = venue.atmosphereVector;
  const layer2Score = l2
    ? Object.values(l2).filter(v => v !== null).length / 8
    : 0;

  return {
    layer1Score: hasRequiredCanonical(venue) ? 1.0 : 0.5,
    layer2Score,
    layer3Score: venue.layer3Embedding ? 1.0 : 0,
    imageScore: Math.min(venue.imageCount / 5, 1.0),
    readyForPublish: layer2Score >= 0.75 && venue.imageCount >= 3,
    missingFields: getMissingFields(venue),
  };
}
```

### Curation Workflow

```
1. IMPORT
   Admin searches Google Places by name
   Layer 1 data auto-fetched and pre-filled
   Admin verifies/corrects

2. IMAGE INGESTION
   Admin selects 5–10 images from Google Photos + Instagram
   System downloads, optimizes, BlurHashes, stores
   Admin marks cover image

3. ATMOSPHERIC SEEDING (the core work)
   Admin sets 8D vector via sliders
   Admin fills temporal moods
   Admin writes curatorial voice (2–3 sentences)
   Admin writes editorial tagline
   Admin checks intent compatibility

4. AI ENRICHMENT TRIGGER
   Admin clicks "Enrich with AI"
   System generates atmospheric prose from Layer 2 data
   System generates embedding
   Admin reviews AI output, adjusts if needed

5. REVIEW MINING (when available)
   System fetches reviews from Google/Yelp
   Runs atmospheric extraction
   Shows Layer 3 embedding comparison to Layer 2
   Admin can see divergence and investigate

6. PUBLISH
   Set is_active = true, status = 'live'
   Triggers cache invalidation
   Venue appears in search
```

---

## 9. Semantic Ingestion Pipeline

### Full Pipeline Architecture

```
EXTERNAL SOURCES
│
├── Google Places API      ─────────────────────────┐
├── Yelp Fusion API        ──────────────────────────┤
├── Foursquare API         ──────────────────────────┤  LAYER 1
├── Instagram (public)     ──────────────────────────┤  INGESTION
├── Venue websites         ──────────────────────────┤
└── OpenStreetMap          ─────────────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  raw_venue_data      │
                          │  (staging table)     │
                          └─────────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  NORMALIZATION       │
                          │  - Dedup             │
                          │  - Schema mapping    │
                          │  - Coord validation  │
                          │  - District tagging  │
                          └─────────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │   HUMAN GATE        │ ← Admin reviews, creates L2
                          │   (Admin CMS)       │
                          └─────────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                          ▼                       ▼
              ┌──────────────────┐    ┌──────────────────────┐
              │  IMAGE PIPELINE  │    │  TEXT PIPELINE       │
              │  Download        │    │  Review mining       │
              │  Resize          │    │  Caption extraction  │
              │  WebP convert    │    │  Editorial scraping  │
              │  BlurHash        │    │  Atmospheric prose   │
              │  CDN upload      │    │  generation (LLM)    │
              └──────────────────┘    └──────────────────────┘
                          │                       │
                          └───────────┬───────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  EMBEDDING ENGINE   │
                          │  Build semantic blob │
                          │  Blend L2 + L3      │
                          │  Generate vector    │
                          │  Store + index      │
                          └─────────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  QUALITY GATE       │
                          │  Completeness check │
                          │  Confidence score   │
                          │  Human approval     │
                          └─────────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  LIVE IN SEARCH     │
                          │  is_active = true   │
                          │  Cache refreshed    │
                          └─────────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  BEHAVIORAL LOOP    │ ← Continuous
                          │  Signal collection  │
                          │  Nightly embedding  │
                          │  update jobs        │
                          └─────────────────────┘
```

### Pipeline Staging Table

```sql
CREATE TABLE pipeline_staging (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id   text UNIQUE,
  raw_data          jsonb,            -- full Google Places response
  status            text DEFAULT 'raw',
  -- 'raw' → 'normalized' → 'admin_review' → 'enriched' → 'live' → 'archived'
  pipeline_stage    text DEFAULT 'layer1',
  error_log         jsonb,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
```

---

## 10. Review & Text Mining Architecture

### Review Acquisition

```typescript
// lib/pipeline/review-miner.ts

interface ReviewSource {
  source: 'google' | 'yelp' | 'tripadvisor' | 'foursquare';
  venueId: string;       // source-specific ID
  externalId: string;    // google place ID, yelp alias, etc.
}

async function mineReviews(
  sources: ReviewSource[],
  options: { maxReviews: number; minLength: number; languages: string[] }
): Promise<ProcessedReview[]> {

  const rawReviews: RawReview[] = [];

  for (const source of sources) {
    const reviews = await fetchReviewsFromSource(source);
    rawReviews.push(...reviews);
  }

  return rawReviews
    .filter(r => r.text.length >= options.minLength)
    .filter(r => options.languages.includes(detectLanguage(r.text)))
    .map(r => ({
      ...r,
      atmosphericSignals: extractAtmosphericSignals(r.text),
      recencyWeight: computeRecencyWeight(r.date),
      sentimentPolarity: analyzeSentiment(r.text),
    }));
}
```

### Atmospheric Signal Dictionary (Spanish + English)

The signal extraction uses a curated bilingual dictionary of atmospheric language:

```typescript
const ATMOSPHERIC_DICTIONARY = {
  solitude: {
    es: ['tranquilo', 'solitario', 'silencioso', 'solo', 'íntimo', 'privado'],
    en: ['quiet', 'peaceful', 'alone', 'solitary', 'private', 'secluded'],
  },
  warmth: {
    es: ['cálido', 'acogedor', 'hogareño', 'confortable', 'tibio'],
    en: ['warm', 'cozy', 'inviting', 'comfortable', 'homey', 'amber'],
  },
  lightQuality: {
    es: ['luz natural', 'luminoso', 'ventanas', 'luz cálida', 'tenue'],
    en: ['natural light', 'bright', 'warm light', 'dim', 'windows', 'sunlight'],
  },
  slowPacing: {
    es: ['sin apuro', 'tranquilo', 'relajado', 'pausado', 'sin prisa'],
    en: ['unhurried', 'slow', 'relaxed', 'leisurely', 'no rush', 'lingering'],
  },
  workFriendly: {
    es: ['trabajar', 'laptop', 'wifi', 'enchufes', 'concentrarse'],
    en: ['work', 'laptop', 'wifi', 'outlets', 'focus', 'study', 'productive'],
  },
  romantic: {
    es: ['romántico', 'íntimo', 'pareja', 'cita', 'velas'],
    en: ['romantic', 'intimate', 'date', 'candles', 'cozy for two', 'couple'],
  },
  cinematic: {
    es: ['hermoso', 'fotogénico', 'especial', 'único', 'atmosférico'],
    en: ['beautiful', 'photogenic', 'special', 'atmospheric', 'stunning', 'film'],
  },
};

function extractAtmosphericSignals(text: string): Partial<AtmosphereVector> {
  const lower = text.toLowerCase();
  const signals: Partial<AtmosphereVector> = {};

  for (const [dimension, keywords] of Object.entries(ATMOSPHERIC_DICTIONARY)) {
    const allKeywords = [...keywords.es, ...keywords.en];
    const matches = allKeywords.filter(kw => lower.includes(kw));
    if (matches.length > 0) {
      signals[dimension as keyof AtmosphereVector] = Math.min(matches.length / 3, 1.0);
    }
  }

  return signals;
}
```

### Review Corpus to Atmosphere Vector

```typescript
async function deriveAtmosphereFromReviews(
  reviews: ProcessedReview[]
): Promise<{ vector: Partial<AtmosphereVector>; confidence: number }> {

  if (reviews.length < 10) {
    return { vector: {}, confidence: 0.1 }; // insufficient data
  }

  // Aggregate signals across reviews, weighted by recency + rating confidence
  const aggregated: Record<string, number[]> = {};

  for (const review of reviews) {
    const weight = review.recencyWeight;
    for (const [dim, score] of Object.entries(review.atmosphericSignals)) {
      if (!aggregated[dim]) aggregated[dim] = [];
      aggregated[dim].push(score * weight);
    }
  }

  const vector: Partial<AtmosphereVector> = {};
  for (const [dim, scores] of Object.entries(aggregated)) {
    if (scores.length >= 3) { // need at least 3 mentions
      vector[dim as keyof AtmosphereVector] = mean(scores);
    }
  }

  const confidence = Math.min(reviews.length / 50, 1.0); // max confidence at 50+ reviews

  return { vector, confidence };
}
```

---

## 11. Image Intelligence Pipeline

### What Images Tell Us

Images are not decoration in Korantis's data model — they are **atmospheric evidence**. A photo of a venue interior reveals:

- Light quality (color temperature, direction, intensity)
- Material warmth (wood vs concrete vs marble)
- Space density (how crowded, how spacious)
- Aesthetic register (rustic, minimal, maximalist, industrial)
- Time of day signature
- Social energy (who is there, in what configuration)

### Image Processing Pipeline

```
SOURCE IMAGE (Google Places / Instagram / Venue)
        │
        ▼
┌────────────────────────────────────┐
│  DOWNLOAD + VALIDATE               │
│  - Check resolution (>= 800px)     │
│  - Check not blurry (Laplacian)    │
│  - Check not food-only (for atmos) │
└────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────┐
│  QUALITY CLASSIFICATION            │
│  shot_type:                        │
│    interior_atmosphere (priority)  │
│    exterior_building               │
│    food_drink                      │
│    detail_texture                  │
│    people_social                   │
│                                    │
│  (Manual at MVP, CLIP-based later) │
└────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────┐
│  MULTI-SIZE PROCESSING (Sharp)     │
│  card_thumb: 400×300 WebP @82%     │
│  card_large: 800×600 WebP @82%     │
│  hero: 1200×800 WebP @85%          │
│  gallery: 600×450 WebP @80%        │
└────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────┐
│  METADATA EXTRACTION               │
│  - BlurHash generation             │
│  - Dominant color palette          │
│  - Average brightness              │
│  - Warm/cool light detection       │
│    (via color temperature of       │
│     brightest regions)             │
└────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────┐
│  CDN UPLOAD (Supabase Storage)     │
│  Path: venues/{id}/{size}.webp     │
│  Cache-Control: max-age=31536000   │
└────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────┐
│  ATMOSPHERE SIGNAL EXTRACTION      │
│  (From image metadata, not full CV)│
│                                    │
│  warm_light_score: based on        │
│    dominant color temperature      │
│  visual_density: based on          │
│    edge detection (busy vs clean)  │
│  brightness_score: avg luminance   │
│                                    │
│  → Feeds lightly into L2/L3 blend  │
└────────────────────────────────────┘
```

### Color Temperature as Atmosphere Signal

```typescript
// Extract warmth from image color data (using Sharp)
async function extractLightAtmosphere(imagePath: string): Promise<{
  warmthScore: number;
  brightnessScore: number;
  dominantPalette: string[];
}> {
  const { dominant } = await sharp(imagePath)
    .resize(100, 100)
    .stats();

  // Color temperature approximation from RGB
  // Warm light: high R, medium G, low B
  const warmthScore = (dominant.r - dominant.b) / 255;
  const normalizedWarmth = Math.max(0, Math.min(1, (warmthScore + 0.5)));

  const brightnessScore = (dominant.r + dominant.g + dominant.b) / (3 * 255);

  return { warmthScore: normalizedWarmth, brightnessScore, dominantPalette: [] };
}
```

### Future: CLIP Image Embeddings

At V2, integrate CLIP (Contrastive Language-Image Pretraining) to embed venue images into the same vector space as text:

```
CLIP embedding of venue photo:
  → "warm amber light filtering through plants onto worn wood table"

CLIP embedding of user query text:
  → "warm natural light café"

Cosine similarity → high match

Store as: venue_images.clip_embedding (vector(512))
```

This enables queries like "find places that look like this" (visual search) and strengthens atmosphere inference from photos rather than just text.

---

## 12. Psychogeographic Inference Engine

### What Is Psychogeographic Inference

Psychogeography is the study of how physical environments affect emotional states. For Korantis, it means inferring the *felt experience* of a venue from structural and contextual signals — without visiting it.

### District Mood Profiles

Each district in Buenos Aires has a psychogeographic signature that influences individual venue interpretation:

```typescript
const DISTRICT_PROFILES: Record<string, DistrictMoodProfile> = {
  palermo: {
    baseEnergy: 0.65,        // moderately high energy
    aestheticRegister: 'creative-modern',
    walkabilityFeel: 'tree-lined, leisurely',
    demographicTexture: 'young professional, expat, creative',
    temporalPeaks: ['weekend afternoon', 'friday evening'],
    psychogeographicNote:
      'Palermo rewards slow walking. The cafe density creates a culture of optional movement.',
  },
  recoleta: {
    baseEnergy: 0.40,
    aestheticRegister: 'european-formal',
    walkabilityFeel: 'grand, slightly performative',
    demographicTexture: 'established, intellectual, older',
    temporalPeaks: ['sunday brunch', 'weekday afternoon'],
    psychogeographicNote:
      'Recoleta carries weight. The architecture implies permanence. Venues here feel chosen, not stumbled upon.',
  },
  san_telmo: {
    baseEnergy: 0.50,
    aestheticRegister: 'historic-bohemian',
    walkabilityFeel: 'cobblestone, layered, surprising',
    demographicTexture: 'artists, tourists, old families',
    temporalPeaks: ['sunday market', 'late evening'],
    psychogeographicNote:
      'San Telmo is Buenos Aires remembering itself. Every doorway has depth.',
  },
};
```

### How District Context Modifies Venue Vectors

```typescript
function applyDistrictContext(
  venueVector: AtmosphereVector,
  districtProfile: DistrictMoodProfile
): AtmosphereVector {
  return {
    ...venueVector,
    // A "relaxed" café in Palermo feels different from "relaxed" in Recoleta
    // because the surrounding energy frames the experience
    contextualPacing: venueVector.pacing * (1 - districtProfile.baseEnergy * 0.2),
    contextualSolitude: venueVector.solitude * (districtProfile.baseEnergy < 0.5 ? 1.1 : 0.9),
  };
}
```

### Neighborhood Text Signals

Scrape and embed neighborhood descriptions from:
- City guides and travel editorial
- Urban planning documents
- Resident blog posts and forum discussions
- Architecture and urbanism writing

These produce **district embeddings** that contextualize venue embeddings:

```sql
CREATE TABLE district_embeddings (
  district_id     text PRIMARY KEY,
  text_corpus     text,          -- aggregated neighborhood descriptions
  embedding       vector(1536),  -- semantic district identity
  mood_profile    jsonb,         -- structured psychogeographic profile
  updated_at      timestamptz
);
```

---

## 13. Behavioral Adaptation Engine

### Architecture

The behavioral engine runs as **background jobs**, never at query time. It produces updated venue signals that are folded into the next embedding refresh.

```
NIGHTLY JOB SEQUENCE
─────────────────────────────────────────────────────
00:00  aggregate_daily_interactions()
       → summarizes all venue_interactions from yesterday
       → writes to venue_behavioral_scores

00:30  compute_ctr_by_intent()
       → for each venue: which query intents lead to clicks vs ignores?
       → updates ctr_by_intent in venue_behavioral_scores

01:00  identify_behavioral_divergences()
       → finds venues where L2 assumption ≠ behavioral signal
       → logs to pipeline_divergences for human review

02:00  update_embeddings_where_confident()
       → for venues with > threshold behavioral data
       → blends behavioral vector into final embedding
       → only applies if behavioral confidence > 0.7

03:00  refresh_recommendation_neighbors()
       → re-compute similar_venues for top 50 most active venues
       → ensures recommendations stay current with behavior

04:00  update_taste_vectors()
       → for users with > 5 saves
       → recompute taste centroid from saved venue embeddings
       → store in taste_vectors table
```

### Divergence Detection

```typescript
interface PipelineDivergence {
  venueId: string;
  dimension: string;           // e.g. "work_friendly"
  layer2Value: number;         // what human curator thought
  behavioralSignal: number;    // what users revealed
  divergenceScore: number;     // |l2 - behavioral|
  sampleSize: number;
  flaggedForReview: boolean;
}

async function detectDivergences(): Promise<PipelineDivergence[]> {
  const venues = await getVenuesWithBehavioralData();
  const divergences: PipelineDivergence[] = [];

  for (const venue of venues) {
    const l2 = venue.atmosphereVector;
    const behavioral = venue.behavioralScores;

    // Example: curator marked work_friendly = 0.9
    // but CTR for "work" queries is only 0.2
    if (Math.abs(l2.workFriendly - behavioral.ctr_by_intent?.work ?? 0) > 0.4) {
      divergences.push({
        venueId: venue.id,
        dimension: 'work_friendly',
        layer2Value: l2.workFriendly,
        behavioralSignal: behavioral.ctr_by_intent?.work,
        divergenceScore: Math.abs(l2.workFriendly - behavioral.ctr_by_intent?.work),
        sampleSize: behavioral.sample_size,
        flaggedForReview: behavioral.sample_size > 50,
      });
    }
  }

  return divergences;
}
```

Divergences are surfaced in the admin pipeline dashboard for curator review. The human decides: does the behavior reflect a real mistake in the curation, or does it reflect user behavior that doesn't map to the dimension's intent?

---

## 14. Validation Loop Architecture

### The Core Question

When Layer 3 (semantic from reviews) comes online, we need to know: **does it agree with Layer 2 (human curation)?**

This is the validation loop — the mechanism that tells us whether the automated inference system is working correctly.

### Measuring Layer Agreement

```typescript
async function validateLayerAgreement(venueId: string): Promise<LayerAgreementReport> {
  const venue = await getVenueWithAllLayers(venueId);

  const l2Vector = venue.atmosphereVector;       // human-curated
  const l3Embedding = venue.layer3Embedding;     // review-derived
  const l2Embedding = venue.layer2Embedding;     // from L2 curated prose

  // Cosine similarity between L2 and L3 embeddings
  const embeddingSimilarity = cosineSimilarity(l2Embedding, l3Embedding);

  // Dimension-by-dimension comparison (where L3 has dimension estimates)
  const dimensionAgreements: Record<string, number> = {};
  for (const dim of ATMOSPHERE_DIMENSIONS) {
    if (venue.layer3VectorEstimates?.[dim] !== undefined) {
      const l2Val = l2Vector[dim];
      const l3Val = venue.layer3VectorEstimates[dim];
      dimensionAgreements[dim] = 1 - Math.abs(l2Val - l3Val);
    }
  }

  return {
    venueId,
    embeddingSimilarity,        // > 0.75 = good agreement
    dimensionAgreements,
    overallAgreementScore: mean(Object.values(dimensionAgreements)),
    needsHumanReview: embeddingSimilarity < 0.5,
    notes: generateAgreementNotes(embeddingSimilarity, dimensionAgreements),
  };
}
```

### Agreement Thresholds

```
Embedding similarity ≥ 0.85:   Perfect. L3 validates L2. High confidence.
Embedding similarity 0.70–0.85: Good agreement. Minor variations expected.
Embedding similarity 0.50–0.70: Moderate divergence. Investigate.
Embedding similarity < 0.50:    Significant disagreement. Human review required.
                                 Possible causes:
                                 - Venue changed since curation
                                 - Reviews reflect different clientele
                                 - L2 curation error
                                 - Review corpus dominated by tourist lens
```

### The Feedback Cycle

```
L2 seed → L3 validates → Divergences flagged → Human review →
  → Correct L2 if wrong       → Feed correction back to L3 baseline
  → Correct L3 if biased      → Improve extraction dictionary
  → Both right, context varies → Add temporal/demographic context
```

---

## 15. Database Schema Extensions

### Pipeline-Specific Tables

```sql
-- Multi-layer embedding storage
ALTER TABLE venues ADD COLUMN
  layer2_embedding         vector(1536),   -- from L2 curated prose
  layer3_embedding         vector(1536),   -- from review corpus
  behavioral_embedding     vector(1536),   -- from behavioral signals
  blended_embedding        vector(1536),   -- final: what search uses
  embedding_blend_weights  jsonb,          -- {"l2": 0.5, "l3": 0.35, "l4": 0.15}
  embedding_confidence     numeric(3,2),
  atmospheric_prose        text,           -- L3 LLM-distilled description
  layer2_prose             text,           -- from L2 curation
  review_corpus_size       integer,
  layer3_confidence        numeric(3,2),
  last_enriched_at         timestamptz,
  needs_re_enrichment      boolean DEFAULT false;

-- Atmospheric vector stored as structured JSONB + individual columns
ALTER TABLE venues ADD COLUMN
  atmosphere_vector        jsonb,          -- full 8D vector as JSON
  av_solitude              numeric(3,2),
  av_pacing                numeric(3,2),
  av_warmth                numeric(3,2),
  av_intimacy              numeric(3,2),
  av_light_quality         numeric(3,2),
  av_formality             numeric(3,2),
  av_noise_architecture    numeric(3,2),
  av_cinematic_quality     numeric(3,2),
  av_confidence            numeric(3,2),   -- confidence in the 8D vector
  av_source                text;           -- 'manual' | 'inferred' | 'blended'

-- Pipeline jobs tracking
CREATE TABLE pipeline_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid REFERENCES venues(id),
  job_type        text NOT NULL,
  -- 'layer1_import' | 'image_ingest' | 'review_mine' |
  -- 'atmospheric_prose' | 'embedding_gen' | 'behavioral_update'
  status          text DEFAULT 'pending',
  -- 'pending' | 'running' | 'complete' | 'failed'
  input_data      jsonb,
  output_data     jsonb,
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Divergence log
CREATE TABLE pipeline_divergences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid REFERENCES venues(id),
  dimension       text,
  layer2_value    numeric(3,2),
  layer3_value    numeric(3,2),
  behavioral_value numeric(3,2),
  divergence_type text,   -- 'l2_vs_l3' | 'l2_vs_behavioral' | 'l3_vs_behavioral'
  divergence_score numeric(3,2),
  sample_size     integer,
  resolution      text,   -- 'l2_corrected' | 'l3_biased' | 'temporal_variation' | 'pending'
  reviewed_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Review source tracking
CREATE TABLE venue_review_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid REFERENCES venues(id),
  source          text NOT NULL,   -- 'google' | 'yelp' | 'tripadvisor'
  external_id     text,
  review_count    integer,
  last_fetched_at timestamptz,
  language_mix    jsonb,           -- {"es": 0.7, "en": 0.3}
  created_at      timestamptz DEFAULT now()
);

-- Atmosphere validation reports
CREATE TABLE layer_validation_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id              uuid REFERENCES venues(id),
  l2_l3_similarity      numeric(4,3),
  dimension_agreements  jsonb,
  overall_agreement     numeric(4,3),
  needs_review          boolean,
  created_at            timestamptz DEFAULT now()
);
```

---

## 16. Pipeline Orchestration

### MVP: Script-Based (Simple)

At MVP, pipeline steps are run manually via CLI scripts. No queue system. No background workers.

```bash
# Typical venue onboarding flow
npm run pipeline:import-venue -- --google-place-id=ChIJ...
npm run pipeline:ingest-images -- --venue-id=uuid
npm run pipeline:generate-embedding -- --venue-id=uuid
npm run pipeline:validate -- --venue-id=uuid
```

### V1: Cron-Based Background Jobs (Vercel)

```typescript
// app/api/cron/nightly-pipeline/route.ts
// Triggered by Vercel Cron: "0 3 * * *" (3am Buenos Aires)

export async function GET(request: Request) {
  // Verify this is a legitimate Vercel Cron invocation
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await runNightlyPipeline();
  return Response.json({ success: true });
}

async function runNightlyPipeline() {
  // 1. Aggregate behavioral signals
  await aggregateDailyInteractions();

  // 2. Update behavioral scores
  await updateVenueBehavioralScores();

  // 3. Detect divergences
  const divergences = await detectDivergences();
  await saveDivergences(divergences);

  // 4. Update embeddings for high-confidence venues
  await updateEmbeddingsFromBehavior({ minConfidence: 0.7 });

  // 5. Refresh stale review data (check 5 venues per night)
  await refreshStaleReviews({ limit: 5, staleAfterDays: 30 });

  // 6. Update taste vectors for active users
  await updateUserTasteVectors({ activeInLast: 7 });
}
```

### V2: Event-Driven Pipeline (Trigger.dev / Inngest)

At scale, migrate to an event-driven pipeline where each stage triggers the next:

```typescript
// With Trigger.dev
client.defineJob({
  id: 'venue-onboarding',
  name: 'Full Venue Onboarding Pipeline',
  trigger: eventTrigger({ name: 'venue.created' }),
  run: async (payload, io) => {
    const { venueId } = payload;

    await io.runTask('fetch-layer1', async () => {
      await fetchAndStoreLayer1Data(venueId);
    });

    await io.runTask('ingest-images', async () => {
      await ingestVenueImages(venueId);
    });

    await io.runTask('mine-reviews', async () => {
      await mineAndProcessReviews(venueId);
    });

    await io.runTask('generate-embeddings', async () => {
      await generateAllEmbeddings(venueId);
    });

    await io.runTask('validate-layers', async () => {
      await validateLayerAgreement(venueId);
    });

    await io.runTask('notify-curator', async () => {
      await notifyCuratorForReview(venueId);
    });
  },
});
```

---

## 17. Data Quality Framework

### Quality Dimensions

Every venue in Korantis has a computed quality score across 5 dimensions:

```typescript
interface DataQualityScore {
  // 1. Factual completeness (Layer 1)
  factualScore: number;       // 0–1: all required fields present?

  // 2. Atmospheric completeness (Layer 2)
  atmosphericScore: number;   // 0–1: all 8 dimensions scored?

  // 3. Semantic richness (Layer 3)
  semanticScore: number;      // 0–1: review corpus size + quality?

  // 4. Visual quality (images)
  visualScore: number;        // 0–1: >= 5 images, >= 1 hero quality?

  // 5. Layer coherence
  coherenceScore: number;     // 0–1: do layers agree with each other?

  // Composite
  overallQuality: number;     // weighted average
  publishReady: boolean;
  qualityFlags: string[];
}
```

### Automated Quality Checks

```typescript
async function runQualityChecks(venueId: string): Promise<DataQualityScore> {
  const venue = await getVenueById(venueId);
  const flags: string[] = [];

  // Factual score
  const requiredFactual = ['name', 'coordinates', 'district', 'category', 'hours'];
  const factualScore = requiredFactual.filter(f => venue[f]).length / requiredFactual.length;
  if (factualScore < 1) flags.push(`missing_factual: ${requiredFactual.filter(f => !venue[f]).join(', ')}`);

  // Atmospheric score
  const atmoFields = Object.values(venue.atmosphereVector ?? {}).filter(v => v !== null);
  const atmosphericScore = atmoFields.length / 8;
  if (atmosphericScore < 0.75) flags.push('incomplete_atmosphere_vector');
  if (!venue.editorialTagline) flags.push('missing_editorial_tagline');
  if (!venue.curatorialVoice) flags.push('missing_curatorial_voice');

  // Semantic score
  const semanticScore = venue.layer3Confidence ?? 0;
  if (semanticScore < 0.3 && (venue.reviewCorpusSize ?? 0) > 20) {
    flags.push('low_semantic_extraction');
  }

  // Visual score
  const imageCount = venue.imageCount ?? 0;
  const visualScore = Math.min(imageCount / 5, 1.0);
  if (imageCount < 3) flags.push('insufficient_images');
  if (!venue.coverImageId) flags.push('no_cover_image');

  // Coherence
  const validation = await getLayerValidation(venueId);
  const coherenceScore = validation?.overallAgreement ?? 0.5;
  if (coherenceScore < 0.5) flags.push('low_layer_coherence');

  const overallQuality =
    0.15 * factualScore +
    0.35 * atmosphericScore +
    0.20 * semanticScore +
    0.15 * visualScore +
    0.15 * coherenceScore;

  return {
    factualScore, atmosphericScore, semanticScore,
    visualScore, coherenceScore, overallQuality,
    publishReady: overallQuality >= 0.65 && imageCount >= 3 && atmosphericScore >= 0.75,
    qualityFlags: flags,
  };
}
```

---

## 18. Confidence Scoring System

### Why Confidence Matters

A venue with 500 Yelp reviews and 3 years of behavioral data should have high confidence atmospheric scores. A venue that was manually seeded last week should have lower confidence. Search results should be weighted by confidence.

```typescript
interface VenueConfidence {
  // Per-layer confidence
  layer2Confidence: number;   // always 1.0 if human-curated
  layer3Confidence: number;   // based on review volume + language coverage
  layer4Confidence: number;   // based on interaction sample size

  // Dimension-level confidence
  dimensionConfidence: Record<string, number>;

  // Final embedding confidence
  embeddingConfidence: number;

  // Time since last verification
  dataFreshness: number;      // 1.0 = verified this week, 0.0 = > 6 months ago
}
```

### Confidence in Search Ranking

```typescript
// A modest confidence penalty prevents low-data venues
// from outranking well-validated ones on marginal semantic similarity
function applyConfidencePenalty(
  rawScore: number,
  confidence: number
): number {
  const minConfidence = 0.3;
  const penalty = 1 - (1 - confidence) * 0.2; // max 20% penalty
  return rawScore * Math.max(penalty, minConfidence);
}
```

---

## 19. Scale Strategy

### Data Volume by Phase

```
Phase 4 (MVP):
  100 venues, 1 city, fully manual
  ~500 images, ~100 human-curated atmosphere vectors
  Pipeline runs: manually via scripts

Phase 5 (V1):
  200–300 venues, 1 city, semi-automated
  Review mining online for existing venues
  Layer 2 + Layer 3 blending operational
  Divergence detection running weekly

Phase 6 (Growth):
  500–1000 venues, 2–3 cities
  Full automated pipeline for new venues (with human gate)
  Behavioral signals from 1K+ MAU feeding back
  Nightly embedding updates

Phase 7 (Platform):
  5000+ venues, 10+ cities
  CLIP image embeddings for visual atmosphere inference
  Self-supervised atmospheric learning from behavior
  District-level psychogeographic inference
  Cold-start resolved by cross-city semantic transfer
```

### City Expansion Data Strategy

When adding a new city:
1. Build district mood profiles (psychogeographic research, 1 week)
2. Seed 50 venues with full L2 manual curation (2 weeks)
3. Run L3 pipeline on seed venues immediately
4. Use seed venue embeddings to bootstrap cross-venue comparisons
5. Reuse learned signal dictionary with city-specific vocabulary additions

Cross-city semantic transfer: "A venue in São Paulo with embedding similar to Café Paulin in Buenos Aires gets pre-warmed vibe tags before manual curation."

---

## 20. Phase Roadmap: 4 → 7

---

### ◆ Phase 4 — Manual Atmospheric Curation (Weeks 1–6)

**Objective:** The atmospheric bootloader. 100 venues seeded with precision.

**What gets built:**
- Admin CMS with atmospheric vector editor (8D sliders + temporal moods + curatorial voice)
- Layer 1 import script (Google Places → DB)
- Image ingestion pipeline (download → Sharp → WebP → BlurHash → Supabase Storage)
- Layer 2 embedding generator (curated prose → OpenAI → pgvector)
- Venue quality scoring
- Pipeline job tracking table

**Data targets:**
- 100 venues with complete L2 vectors
- 5+ images per venue, all processed
- All 8 atmosphere dimensions filled
- Editorial taglines + curatorial voice written
- All venues published and searchable

**Success criteria:**
- Team member can type "quiet café to work in Palermo" and get results that feel correct
- Every result card communicates atmosphere accurately
- No venue feels "off" relative to its atmospheric promise

---

### ◆ Phase 5 — Semantic Ingestion Pipeline (Months 2–4)

**Objective:** Automate atmospheric inference from external text signals.

**What gets built:**
- Review mining scripts (Google + Yelp + Foursquare)
- Atmospheric signal extraction (bilingual dictionary + LLM extraction)
- Atmospheric prose generation (LLM → editorial prose → embedding)
- Layer 2 / Layer 3 agreement validation
- Divergence detection + admin dashboard flagging
- Embedding blending system (L2 weight + L3 weight)
- Nightly pipeline jobs (Vercel Cron)

**Data targets:**
- All 100+ venues have Layer 3 embeddings
- Review corpus mined for all venues with > 10 reviews
- Validation reports generated for all venues
- < 15% of venues showing high divergence (divergence score > 0.4)

**Success criteria:**
- A new venue can go from Layer 1 import → searchable in < 30 minutes with quality L3 embedding
- L3 embeddings agree with L2 embeddings at > 0.75 cosine similarity for 80%+ of venues
- Zero regression in search quality for existing venues

---

### ◆ Phase 6 — Behavioral Adaptation Engine (Months 5–8)

**Objective:** Let user behavior validate and sharpen atmospheric signals.

**Prerequisites:** 500+ MAU, meaningful interaction data accumulating.

**What gets built:**
- Venue interaction event logging (impressions, clicks, saves, dwell)
- Nightly behavioral aggregation jobs
- CTR-by-intent computation
- Behavioral embedding generation from query contexts
- Three-layer embedding blend (L2 + L3 + L4)
- Behavioral divergence detection
- Taste vector per user (save-derived)
- Personalized search bias (subtle, not dominant)

**Data targets:**
- 50+ interaction events per active venue per month
- Behavioral confidence > 0.5 for top 30 venues
- Taste vectors computed for users with 5+ saves

**Success criteria:**
- CTR on search results improves by > 10% after behavioral embedding integration
- Zero-results rate stays < 5% as query variety grows
- Users with taste vectors show higher save rates than anonymous users

---

### ◆ Phase 7 — Autonomous Psychogeographic Inference (Month 12+)

**Objective:** The system infers atmosphere without manual seeding for most venues.

**What gets built:**
- CLIP image embeddings for visual atmosphere inference
- Cross-venue semantic transfer (new venue gets pre-warmed from similar venues)
- District-level embedding models (neighborhood as atmosphere context)
- Self-supervised learning from behavioral patterns
- Multi-city atmospheric normalization
- Cold-start pipeline: new venue → Layer 3 + CLIP → near-complete atmosphere in hours

**Success criteria:**
- New venue achieves > 0.7 atmospheric confidence from automated pipeline alone
- Human curation review rate drops to < 30% of new venues (others are accurate without it)
- Cross-city search works meaningfully ("find me something like Café Paulin but in São Paulo")
- Behavioral data overrides incorrect L2 assumptions automatically for > 90% of cases

---

## The Most Important Thing

> Data quality matters more than volume.
> Emotional coherence matters more than scale.
> Curation initially beats automation.

The pipeline exists to serve a single product promise: when someone types "warm café with slow light to spend a rainy afternoon alone," Korantis should find the one place in Buenos Aires that is exactly that — and it should be right.

Every layer, every embedding, every behavioral signal, every validation loop exists in service of that moment of recognition: *it knew what I meant.*

---

*Korantis Pipeline Architecture v1.0*
*Layers: Canonical · Atmospheric · Semantic · Behavioral*
*Stack: Google Places · OpenAI Embeddings · GPT-4o-mini · pgvector · Sharp · Supabase · Vercel Cron*
