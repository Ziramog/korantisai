# Korantis — Complete Architecture & Product Blueprint

> *"Find places by feeling."*
> AI-native emotional discovery platform for urban lifestyle venues.

---

## Table of Contents

1. [Product Vision & Philosophy](#1-product-vision--philosophy)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Schema](#5-database-schema)
6. [PostgreSQL Strategy](#6-postgresql-strategy)
7. [pgvector Strategy](#7-pgvector-strategy)
8. [PostGIS Usage](#8-postgis-usage)
9. [Semantic Search Architecture](#9-semantic-search-architecture)
10. [Embedding Architecture](#10-embedding-architecture)
11. [AI Orchestration Layer](#11-ai-orchestration-layer)
12. [Ranking Engine Design](#12-ranking-engine-design)
13. [Venue Enrichment Pipeline](#13-venue-enrichment-pipeline)
14. [Image Processing Pipeline](#14-image-processing-pipeline)
15. [Search Flow Architecture](#15-search-flow-architecture)
16. [Recommendation System](#16-recommendation-system)
17. [Mobile-First UX Architecture](#17-mobile-first-ux-architecture)
18. [Folder Structure](#18-folder-structure)
19. [API Design](#19-api-design)
20. [Caching Strategy](#20-caching-strategy)
21. [Performance Optimization](#21-performance-optimization)
22. [Precomputed vs Runtime Logic](#22-precomputed-vs-runtime-logic)
23. [What Should NOT Use LLMs](#23-what-should-not-use-llms)
24. [AI Latency Avoidance Strategy](#24-ai-latency-avoidance-strategy)
25. [Analytics Architecture](#25-analytics-architecture)
26. [Cost Optimization Strategy](#26-cost-optimization-strategy)
27. [Scalability Roadmap](#27-scalability-roadmap)
28. [Security Considerations](#28-security-considerations)
29. [Deployment Strategy](#29-deployment-strategy)
30. [Authentication Architecture](#30-authentication-architecture)
31. [Storage Architecture](#31-storage-architecture)
32. [Search Indexing Strategy](#32-search-indexing-strategy)
33. [Image CDN Strategy](#33-image-cdn-strategy)
34. [Recommendation Engine Evolution](#34-recommendation-engine-evolution)
35. [Taste Graph Direction](#35-taste-graph-direction)
36. [Future Social Layer](#36-future-social-layer)
37. [SEO Strategy](#37-seo-strategy)
38. [Local Discovery Growth Strategy](#38-local-discovery-growth-strategy)
39. [Infrastructure Providers](#39-infrastructure-providers)
40. [Implementation Roadmap: MVP → V1 → Platform](#40-implementation-roadmap-mvp--v1--platform)

---

## 1. Product Vision & Philosophy

### What Korantis Is

Korantis is an **AI-native emotional discovery platform**. It answers the question every person asks but no product understands: *"What kind of place do I feel like going to right now?"*

It is not a restaurant finder. It is not a maps layer. It is not a chatbot. It is a **taste engine** — a cinematic, intelligent system that translates feelings into curated places.

### Emotional Search Paradigm

Traditional apps search by category, location, or keywords. Korantis searches by:

| Traditional | Korantis |
|---|---|
| "Italian restaurants near me" | "warm dinner spot for deep conversation" |
| "Coffee shops open now" | "minimal café with natural light to work tonight" |
| "4-star rated brunch" | "slow Sunday brunch, calm, aesthetic, Palermo" |
| "Bars with outdoor seating" | "wine bar that feels intimate and low-key" |

### Product Personality

The platform communicates through **atmosphere, not listings**. Every card, every result, every transition should feel like a recommendation from a brilliant friend who knows Buenos Aires intimately — not a business directory.

### Design Pillars

- **Cinematic** — imagery-first, editorial feel, dark/warm premium palette
- **Invisible AI** — intelligence embedded in results, never surfaced as "AI"
- **Frictionless** — zero login wall, immediate discovery, fast-path to finding
- **Emotionally Precise** — understands vibes, lighting, noise, energy, time context
- **Editorially Curated** — 100–300 venues, hand-vetted, quality over quantity

---

## 2. System Architecture Overview

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│              Next.js 14 App Router (Vercel Edge)                │
│         Mobile PWA · Web · Responsive-first                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    API LAYER        │
                    │  Next.js API Routes │
                    │  (Vercel Functions) │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼───────┐   ┌──────────▼──────────┐  ┌───────▼───────┐
│  Supabase DB  │   │   AI / Embedding    │  │  Supabase     │
│  PostgreSQL   │   │   OpenAI API        │  │  Storage      │
│  pgvector     │   │   MiniMax API       │  │  (Images)     │
│  PostGIS      │   └─────────────────────┘  └───────────────┘
│  Supabase Auth│
└───────────────┘
        │
┌───────▼───────┐
│  Mapbox GL    │
│  (Client-side │
│   map layer)  │
└───────────────┘
```

### Core Principles

1. **Offline-first intelligence** — venue embeddings, vibe scores, and semantic metadata computed once, stored in DB, served fast
2. **Edge-friendly** — API routes run at Vercel Edge when stateless; DB calls go to nearest Supabase region
3. **AI as post-processing** — AI interprets queries and generates explanations; ranking is deterministic + vector similarity
4. **Image pipeline as product** — images are rehosted, optimized, and CDN-served; never depend on external URLs
5. **Progressive enhancement** — works fully without auth; auth unlocks saves and personalization

---

## 3. Frontend Architecture

### Stack

- **Framework:** Next.js 14 (App Router)
- **Hosting:** Vercel
- **Styling:** TailwindCSS + CSS custom properties for design tokens
- **Animation:** Framer Motion
- **Maps:** Mapbox GL JS (client-side)
- **State:** Zustand (lightweight, no Redux overhead)
- **Data fetching:** SWR + React Query for server state
- **Forms:** React Hook Form
- **Icons:** Lucide React / custom SVGs

### App Router Structure

```
app/
├── layout.tsx              # Root layout: fonts, theme, analytics
├── page.tsx                # Home: discovery feed, emotional search bar
├── search/
│   └── page.tsx            # Search results: cards + map split view
├── place/
│   └── [slug]/
│       └── page.tsx        # Venue detail: cinematic, full-screen
├── collections/
│   └── page.tsx            # Curated editorial collections
├── explore/
│   └── page.tsx            # Browse by vibe/district/category
├── profile/
│   └── page.tsx            # Saved places, history (auth-gated)
└── api/
    ├── search/route.ts
    ├── venues/route.ts
    ├── embed/route.ts
    └── explain/route.ts
```

### Component Philosophy

Components are organized around **experience domains**, not UI primitives:

```
components/
├── discovery/
│   ├── SearchBar.tsx         # Emotional query input, centered hero
│   ├── VenueCard.tsx         # Cinematic card with image + vibe tags
│   ├── VenueCardMini.tsx     # Compact version for lists
│   ├── VibeTags.tsx          # Pill tags: warm · quiet · minimal · etc
│   ├── AtmosphereSignals.tsx # Noise · Light · Work · Crowd icons
│   └── ExplainBadge.tsx      # AI explanation chip (1–2 sentences)
├── layout/
│   ├── SplitView.tsx         # Left: cards | Right: map (desktop)
│   ├── StackView.tsx         # Mobile: cards → map toggle
│   ├── MapLayer.tsx          # Mapbox wrapper with custom markers
│   └── NavBar.tsx            # Minimal top nav
├── venue/
│   ├── HeroSection.tsx       # Full-bleed cinematic image
│   ├── MoodBoard.tsx         # Photo grid: atmosphere gallery
│   ├── InfoBlock.tsx         # Hours, location, signals
│   └── SimilarPlaces.tsx     # Semantic neighbor recommendations
├── ui/
│   ├── BlurImage.tsx         # Next/Image with blur placeholder
│   ├── Tag.tsx
│   ├── Button.tsx
│   └── Modal.tsx
└── auth/
    ├── AuthModal.tsx         # Soft-gate: "Save this place" prompt
    └── SaveButton.tsx
```

### Design System

**Palette (Dark Premium)**
```css
--bg-base: #0a0a0a;
--bg-surface: #141414;
--bg-elevated: #1c1c1c;
--accent-warm: #c8956c;        /* warm amber */
--accent-sage: #8aad96;        /* natural green */
--text-primary: #f0ede8;
--text-secondary: #9e9a94;
--text-muted: #5c5a56;
--border-subtle: rgba(255,255,255,0.06);
```

**Typography**
```css
--font-display: 'Canela', 'Freight Display', Georgia, serif;  /* editorial */
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

**Motion Principles (Framer Motion)**
- Entrance: `opacity 0→1, y: 12→0, duration: 0.4, ease: easeOut`
- Card hover: `scale: 1.02, shadow increase, duration: 0.2`
- Map transition: `blur crossfade, 300ms`
- Page transitions: `slide + fade, 350ms`
- No bouncy springs; everything should feel *considered and calm*

### Performance Strategy (Frontend)

- **Next.js Image** for all venue photos (blur placeholder, responsive srcset)
- **Lazy load** cards below the fold via `loading="lazy"` + Intersection Observer
- **Preload** hero images of top 3 results
- **Font subsetting** — only load Latin glyphs for display font
- **Bundle splitting** — Mapbox lazy-loaded only when map is visible
- **Prefetch** on hover for venue detail pages
- **Streaming SSR** for search results (React Suspense + streaming)

---

## 4. Backend Architecture

### Philosophy: Lean Monolith on Edge

Korantis runs as a **single Next.js application** deployed on Vercel. There are no microservices, no separate backend server, no message queues at MVP. All API logic lives in Next.js Route Handlers.

### API Routes (Route Handlers)

```
/api/search          POST  — Main semantic search endpoint
/api/venues          GET   — Browse/filter venues
/api/venues/[slug]   GET   — Single venue detail
/api/explain         POST  — AI explanation for a result set
/api/embed           POST  — Internal: embed a query (cached)
/api/collections     GET   — Editorial curated collections
/api/similar/[id]    GET   — Semantic neighbors of a venue
/api/save            POST  — Save venue (auth required)
/api/saves           GET   — User's saved venues (auth required)
```

### Request Lifecycle (Search)

```
User types query
       │
       ▼
/api/search  ←── Rate limited at Vercel Edge (10 req/s per IP)
       │
       ├── 1. Parse & validate query
       ├── 2. Check query embedding cache (Redis/Upstash)
       │         ↓ miss
       ├── 3. Generate embedding via OpenAI text-embedding-3-small
       ├── 4. Cache embedding (TTL: 24h)
       │
       ├── 5. Run hybrid search in Supabase:
       │       a. pgvector cosine similarity (semantic)
       │       b. PostGIS distance filter (if location context)
       │       c. Structured filters (category, time, district)
       │       d. Rank & score
       │
       ├── 6. Fetch top 8–12 venue records + image URLs
       │
       ├── 7. Generate AI explanation (MiniMax API, cached by query)
       │
       └── 8. Return: { venues[], explanation, vibes[], mapBounds }
```

### Middleware

- **Rate limiting** — Upstash Redis + `@upstash/ratelimit` (free tier: 10k req/day)
- **Auth detection** — Supabase session from cookies; guest users get results, no saves
- **CORS** — restricted to Korantis domains
- **Request logging** — structured JSON to Vercel log drains

---

## 5. Database Schema

### Supabase PostgreSQL — Core Tables

```sql
-- ─────────────────────────────────────────────
-- VENUES
-- ─────────────────────────────────────────────
CREATE TABLE venues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,           -- "felix-roastery-palermo"
  name            text NOT NULL,
  tagline         text,                           -- "Espresso rituals in warm light"
  description     text,                           -- editorial description
  short_desc      text,                           -- 1-sentence summary

  -- Location
  district        text NOT NULL,                  -- "palermo", "recoleta"
  address         text,
  location        geography(Point, 4326),         -- PostGIS: lng/lat

  -- Category & Type
  category        text NOT NULL,                  -- "cafe", "wine_bar", "restaurant"
  subcategories   text[],                         -- ["brunch", "laptop_friendly"]

  -- Operational
  price_tier      smallint CHECK (price_tier BETWEEN 1 AND 4),
  hours           jsonb,                          -- { mon: "8:00-22:00", ... }
  phone           text,
  website         text,
  instagram       text,

  -- Atmosphere Signals (0.0 – 1.0 scores, precomputed)
  noise_level     numeric(3,2),                   -- 0=silent, 1=loud
  light_quality   numeric(3,2),                   -- 0=dim, 1=bright natural
  work_friendly   numeric(3,2),
  romantic_score  numeric(3,2),
  social_energy   numeric(3,2),                   -- 0=intimate, 1=buzzing
  luxury_feel     numeric(3,2),
  outdoor_score   numeric(3,2),
  crowd_density   numeric(3,2),

  -- Visual
  cover_image_id  uuid REFERENCES venue_images(id),
  image_count     smallint DEFAULT 0,

  -- Vibe Tags (precomputed taxonomy)
  vibe_tags       text[],                         -- ["warm","minimal","cozy","quiet"]
  aesthetic_tags  text[],                         -- ["nordic","industrial","rustic"]
  time_tags       text[],                         -- ["morning","late_night","weekend"]

  -- AI Enrichment
  ai_summary      text,                           -- LLM-generated editorial prose
  ai_vibe_profile jsonb,                          -- structured vibe breakdown

  -- Search
  embedding       vector(1536),                   -- OpenAI text-embedding-3-small
  search_text     tsvector,                       -- Full-text search (tsvector)

  -- Metadata
  is_active       boolean DEFAULT true,
  is_featured     boolean DEFAULT false,
  quality_score   numeric(4,3) DEFAULT 0.5,       -- editorial quality signal
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- VENUE IMAGES
-- ─────────────────────────────────────────────
CREATE TABLE venue_images (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid REFERENCES venues(id) ON DELETE CASCADE,
  storage_path    text NOT NULL,                  -- supabase storage path
  cdn_url         text,                           -- computed CDN URL
  width           integer,
  height          integer,
  blur_hash       text,                           -- BlurHash for placeholder
  alt_text        text,
  sort_order      smallint DEFAULT 0,
  is_cover        boolean DEFAULT false,
  shot_type       text,                           -- "interior","exterior","food","detail"
  embedding       vector(512),                    -- CLIP image embedding (future)
  created_at      timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- COLLECTIONS (editorial curation)
-- ─────────────────────────────────────────────
CREATE TABLE collections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,                  -- "Laptops Welcome"
  description     text,
  cover_image_id  uuid REFERENCES venue_images(id),
  mood_tag        text,                           -- "work" | "date" | "sunday"
  is_published    boolean DEFAULT false,
  sort_order      smallint DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE collection_venues (
  collection_id   uuid REFERENCES collections(id) ON DELETE CASCADE,
  venue_id        uuid REFERENCES venues(id) ON DELETE CASCADE,
  sort_order      smallint DEFAULT 0,
  curator_note    text,
  PRIMARY KEY (collection_id, venue_id)
);

-- ─────────────────────────────────────────────
-- USER SAVES
-- ─────────────────────────────────────────────
CREATE TABLE user_saves (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id        uuid REFERENCES venues(id) ON DELETE CASCADE,
  saved_at        timestamptz DEFAULT now(),
  note            text,
  UNIQUE(user_id, venue_id)
);

-- ─────────────────────────────────────────────
-- SEARCH EVENTS (analytics, no PII)
-- ─────────────────────────────────────────────
CREATE TABLE search_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      text NOT NULL,                  -- anonymous session ID
  user_id         uuid REFERENCES auth.users(id), -- null for guests
  query           text NOT NULL,
  result_ids      uuid[],
  clicked_id      uuid REFERENCES venues(id),
  district_hint   text,
  time_context    text,                           -- "morning","evening","weekend"
  created_at      timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- QUERY EMBEDDING CACHE
-- ─────────────────────────────────────────────
CREATE TABLE query_cache (
  query_hash      text PRIMARY KEY,              -- SHA256 of normalized query
  query_text      text NOT NULL,
  embedding       vector(1536),
  hit_count       integer DEFAULT 1,
  created_at      timestamptz DEFAULT now(),
  last_used_at    timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- USER PROFILES (extended)
-- ─────────────────────────────────────────────
CREATE TABLE user_profiles (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name    text,
  avatar_url      text,
  preferred_district text,
  taste_tags      text[],                         -- derived from saves
  created_at      timestamptz DEFAULT now()
);
```

---

## 6. PostgreSQL Strategy

### Why PostgreSQL + Supabase

- Supabase free tier covers MVP: 500MB DB, 1GB storage, 2GB bandwidth
- pgvector handles semantic search natively — no separate vector DB
- PostGIS handles geospatial queries natively
- Row-level security (RLS) built-in for multi-user data
- Realtime subscriptions available for future social features
- No additional infrastructure needed

### Indexing Strategy

```sql
-- Vector similarity (IVFFlat: fast approximate search)
CREATE INDEX venues_embedding_idx
  ON venues USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);          -- 50 lists for ~300 venues; tune later

-- Geospatial
CREATE INDEX venues_location_idx
  ON venues USING GIST (location);

-- Full-text search
CREATE INDEX venues_search_text_idx
  ON venues USING GIN (search_text);

-- Vibe tags (array contains)
CREATE INDEX venues_vibe_tags_idx
  ON venues USING GIN (vibe_tags);

-- Filtering
CREATE INDEX venues_category_district_idx
  ON venues (category, district, is_active);

-- Cover image lookup
CREATE INDEX venue_images_venue_id_idx
  ON venue_images (venue_id, sort_order);
```

### tsvector Population

```sql
-- Auto-populate search_text on insert/update
CREATE OR REPLACE FUNCTION update_venues_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.tagline, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(array_to_string(NEW.vibe_tags, ' '), '') || ' ' ||
    coalesce(array_to_string(NEW.aesthetic_tags, ' '), '') || ' ' ||
    coalesce(NEW.district, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venues_search_text_trigger
  BEFORE INSERT OR UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_venues_search_text();
```

### RLS Policies

```sql
-- Venues: public read, admin write
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venues_public_read" ON venues
  FOR SELECT USING (is_active = true);

-- User saves: own data only
ALTER TABLE user_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saves_own" ON user_saves
  FOR ALL USING (auth.uid() = user_id);
```

---

## 7. pgvector Strategy

### Embedding Model Choice

**OpenAI `text-embedding-3-small`** (1536 dimensions)

- Cost: $0.02 / 1M tokens
- For 300 venues × avg 300 tokens = 90K tokens = **$0.0018 total** for initial corpus
- For query embeddings: ~50 tokens avg × 1000 queries/day = 50K tokens/day = **$0.001/day**
- Extremely cheap. Upgrade to `text-embedding-3-large` later if quality demands it.

### What Gets Embedded

For each venue, construct a **rich semantic text blob** before embedding:

```
{name}. {tagline}. {ai_summary}.
Atmosphere: {vibe_tags joined}. Aesthetic: {aesthetic_tags joined}.
{district}, Buenos Aires. Category: {category}.
Noise: {noise_descriptor}. Light: {light_descriptor}.
Work-friendly: {yes/no}. Romantic: {yes/no}.
Best for: {time_tags joined}.
```

This ensures the embedding captures all emotional and atmospheric signals, not just the name.

### Query Embedding

User queries are embedded as-is (short, emotional phrases). The semantic distance between "quiet café to work tonight" and a venue embedding built with "calm, low noise, work-friendly, laptop" will be naturally close.

### Hybrid Search Function (SQL)

```sql
CREATE OR REPLACE FUNCTION search_venues(
  query_embedding vector(1536),
  query_text      text,
  p_district      text DEFAULT NULL,
  p_category      text DEFAULT NULL,
  p_limit         integer DEFAULT 12,
  semantic_weight float DEFAULT 0.7,
  text_weight     float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid, slug text, name text, tagline text,
  district text, category text, vibe_tags text[],
  noise_level numeric, light_quality numeric,
  work_friendly numeric, romantic_score numeric,
  cover_image_id uuid, ai_summary text,
  semantic_score float, text_score float,
  final_score float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id, v.slug, v.name, v.tagline,
    v.district, v.category, v.vibe_tags,
    v.noise_level, v.light_quality,
    v.work_friendly, v.romantic_score,
    v.cover_image_id, v.ai_summary,
    (1 - (v.embedding <=> query_embedding))::float AS semantic_score,
    (ts_rank(v.search_text, plainto_tsquery('english', query_text)))::float AS text_score,
    (
      semantic_weight * (1 - (v.embedding <=> query_embedding)) +
      text_weight     * ts_rank(v.search_text, plainto_tsquery('english', query_text)) +
      0.05            * v.quality_score
    )::float AS final_score
  FROM venues v
  WHERE
    v.is_active = true
    AND (p_district IS NULL OR v.district = p_district)
    AND (p_category IS NULL OR v.category = p_category)
    AND (v.embedding <=> query_embedding) < 0.5     -- cosine distance threshold
  ORDER BY final_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. PostGIS Usage

### Why PostGIS

Location context in search queries ("near Palermo", "in Recoleta") should influence results — but not override vibe match. PostGIS enables spatial filtering and distance scoring.

### Geographic Schema

```sql
-- District bounding boxes (for context extraction)
CREATE TABLE districts (
  id      text PRIMARY KEY,          -- "palermo"
  name    text NOT NULL,
  polygon geography(Polygon, 4326),  -- district boundary
  center  geography(Point, 4326)
);

-- Venues already have: location geography(Point, 4326)
```

### Spatial Queries

```sql
-- 1. Venues within district polygon
SELECT * FROM venues
WHERE ST_Within(location::geometry, (
  SELECT polygon::geometry FROM districts WHERE id = 'palermo'
));

-- 2. Venues within X meters of a point (user location)
SELECT *, ST_Distance(location, ST_MakePoint(-58.4173, -34.5755)::geography) AS dist_m
FROM venues
WHERE ST_DWithin(location, ST_MakePoint(-58.4173, -34.5755)::geography, 1500)
ORDER BY dist_m;

-- 3. Extract district from query (structured parsing, not LLM)
-- Handled in application layer: check query string for district keywords
```

### District Extraction (Application Layer)

```typescript
const DISTRICT_KEYWORDS: Record<string, string> = {
  'palermo': 'palermo',
  'soho': 'palermo',       // palermo soho alias
  'hollywood': 'palermo',  // palermo hollywood alias
  'recoleta': 'recoleta',
  'puerto madero': 'puerto_madero',
  'madero': 'puerto_madero',
};

function extractDistrict(query: string): string | null {
  const lower = query.toLowerCase();
  for (const [keyword, district] of Object.entries(DISTRICT_KEYWORDS)) {
    if (lower.includes(keyword)) return district;
  }
  return null;
}
```

---

## 9. Semantic Search Architecture

### The Intelligence Stack

The system's "magic" is that most intelligence is **offline and precomputed**. Runtime AI is minimal and targeted.

```
OFFLINE (enrichment pipeline)
─────────────────────────────
Venue data →
  LLM writes editorial description →
    Vibe classifier assigns tags →
      Atmosphere scorer assigns signals →
        Embedding generated →
          Stored in DB

ONLINE (per-query, ~200ms)
──────────────────────────
User query →
  Parse: district, time_context, category hint →
    Embed query (cached) →
      pgvector cosine similarity →
        Hybrid score (semantic + text + quality) →
          PostGIS filter if location present →
            Return top results →
              AI generates 1-sentence explanation (cached by query) →
                Return to UI
```

### Query Understanding (Structured, No LLM)

Before embedding, parse the query for structured signals:

```typescript
interface ParsedQuery {
  raw: string;
  district: string | null;
  timeContext: 'morning' | 'afternoon' | 'evening' | 'night' | null;
  intentSignals: string[];  // ["work", "date", "social", "solo"]
  categoryHint: string | null;
}

function parseQuery(query: string): ParsedQuery {
  return {
    raw: query,
    district: extractDistrict(query),
    timeContext: extractTimeContext(query),  // "tonight" → "evening"
    intentSignals: extractIntentSignals(query),  // "work" → ["work"]
    categoryHint: extractCategoryHint(query),    // "wine bar" → "wine_bar"
  };
}
```

This structured parsing enables **deterministic filtering** before the expensive vector search — reducing the candidate set and improving precision.

### Vibe Taxonomy

Pre-defined taxonomy used for tagging and discovery:

```typescript
const VIBE_TAXONOMY = {
  atmosphere: ['cozy', 'minimal', 'warm', 'cool', 'rustic', 'modern',
               'industrial', 'botanical', 'luxurious', 'casual', 'intimate'],
  noise:      ['silent', 'quiet', 'low-hum', 'conversational', 'lively', 'loud'],
  light:      ['candlelit', 'warm-low', 'warm-bright', 'natural', 'cool-white', 'moody'],
  crowd:      ['solo-friendly', 'couple', 'small-group', 'social', 'packed'],
  work:       ['laptop-friendly', 'no-laptop', 'work-focused', 'mixed'],
  time:       ['early-morning', 'morning', 'daytime', 'afternoon', 'evening',
               'night', 'late-night', 'weekend-brunch'],
  aesthetic:  ['nordic', 'japanese', 'mediterranean', 'parisian', 'porteño',
               'new-york', 'artsy', 'botanical', 'brutalist'],
};
```

---

## 10. Embedding Architecture

### Embedding Generation Pipeline

```
1. Venue created in CMS / admin panel
2. Enrichment job triggered (manual at MVP, webhook later)
3. Build semantic text blob:
   ┌──────────────────────────────────────────────────────┐
   │ "{name}. {tagline}. {ai_summary}.                   │
   │  Atmosphere: warm, minimal, quiet.                  │
   │  Aesthetic: nordic-porteño. Located in Palermo.     │
   │  Category: café. Work-friendly. Morning to evening. │
   │  Light: natural warm. Noise: low. Romantic: medium."│
   └──────────────────────────────────────────────────────┘
4. Call OpenAI text-embedding-3-small
5. Store 1536-dim vector in venues.embedding
6. Build IVFFlat index (or refresh if > N new venues)
```

### Query Embedding Cache

```typescript
async function getQueryEmbedding(query: string): Promise<number[]> {
  const normalized = query.trim().toLowerCase();
  const hash = sha256(normalized);

  // 1. Check in-memory LRU cache (server-side, 100 entries)
  if (memoryCache.has(hash)) return memoryCache.get(hash);

  // 2. Check Upstash Redis (cross-request cache)
  const cached = await redis.get(`embed:${hash}`);
  if (cached) return JSON.parse(cached);

  // 3. Generate from OpenAI
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: normalized,
  });
  const vector = embedding.data[0].embedding;

  // 4. Cache in both layers (TTL: 24h)
  await redis.setex(`embed:${hash}`, 86400, JSON.stringify(vector));
  memoryCache.set(hash, vector);

  return vector;
}
```

### Cost Projection

| Operation | Volume | Cost/Month |
|---|---|---|
| Initial venue embeddings (300) | Once | ~$0.002 |
| Query embeddings (3K queries/day × 30) | 90K/month | ~$0.002 |
| AI explanations (MiniMax, 500 tokens avg) | 1K unique/month | ~$0.50 |
| **Total AI costs at launch** | | **< $1/month** |

---

## 11. AI Orchestration Layer

### Philosophy: AI as Interpreter, Not Driver

```
AI DOES:
  ✓ Interpret natural language queries
  ✓ Generate short editorial explanations (1–2 sentences)
  ✓ Assign vibe tags during enrichment (offline)
  ✓ Write atmospheric descriptions (offline)
  ✓ Embed text into vectors (offline + cached)

AI DOES NOT:
  ✗ Control ranking at runtime
  ✗ Generate search results dynamically
  ✗ Make expensive reasoning calls per request
  ✗ Operate as a chatbot
  ✗ Replace deterministic logic
```

### AI Calls at Runtime

**1. Query Embedding** (cached aggressively, ~$0/month at scale)
```typescript
const embedding = await getQueryEmbedding(userQuery); // ~50ms, cached
```

**2. Result Explanation** (per unique query, cached, MiniMax)
```typescript
async function generateExplanation(query: string, venues: Venue[]): Promise<string> {
  const cacheKey = `explain:${sha256(query)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const prompt = `
You are a taste-driven urban discovery curator in Buenos Aires.
A user searched: "${query}"
The top results are: ${venues.slice(0, 3).map(v => v.name).join(', ')}.
Write ONE sentence (max 20 words) explaining why these places match the feeling.
Be atmospheric and precise. Never generic. No emojis.
  `;

  const response = await minimaxAPI.complete({ prompt, maxTokens: 60 });
  const explanation = response.text.trim();

  await redis.setex(cacheKey, 3600, explanation); // cache 1h
  return explanation;
}
```

**3. Venue Enrichment (Offline Only)**
```typescript
// Run once per venue, never at search time
async function enrichVenue(venueData: RawVenueInput): Promise<EnrichedVenue> {
  const summary = await generateAtmosphericSummary(venueData);
  const vibeTags = await classifyVibes(venueData, summary);
  const atmosphereScores = await scoreAtmosphere(venueData, summary);
  const embedding = await generateEmbedding(venueData, summary, vibeTags);
  return { ...venueData, summary, vibeTags, atmosphereScores, embedding };
}
```

### MiniMax vs OpenAI Split

| Task | Model | Reason |
|---|---|---|
| Text embeddings | OpenAI text-embedding-3-small | Best quality/cost for embeddings |
| Short explanations (runtime) | MiniMax (cost-efficient) | Cheap, fast, sufficient for 1-line outputs |
| Venue descriptions (offline) | OpenAI GPT-4o-mini | Higher quality needed once, not per-request |
| Future: conversational | MiniMax or GPT-4o-mini | TBD |

---

## 12. Ranking Engine Design

### Score Composition

```typescript
interface VenueScore {
  semanticSimilarity: number;  // 0–1: pgvector cosine similarity
  textRelevance: number;        // 0–1: tsvector ts_rank
  qualityScore: number;         // 0–1: editorial quality signal
  freshnessScore: number;       // 0–1: recency of data
  popularitySignal: number;     // 0–1: saves + clicks (logged, not gamed)
  distanceScore: number;        // 0–1: proximity when location available
}

function computeFinalScore(s: VenueScore, context: QueryContext): number {
  const weights = {
    semantic: 0.55,
    text: 0.20,
    quality: 0.10,
    freshness: 0.02,
    popularity: 0.08,
    distance: context.hasLocation ? 0.05 : 0,
  };

  return (
    weights.semantic   * s.semanticSimilarity +
    weights.text       * s.textRelevance +
    weights.quality    * s.qualityScore +
    weights.freshness  * s.freshnessScore +
    weights.popularity * s.popularitySignal +
    weights.distance   * s.distanceScore
  );
}
```

### Ranking Principles

1. **Semantic similarity is primary** — but not the only signal
2. **Quality score** prevents obscure or poorly-documented venues from ranking unfairly
3. **Popularity is a weak signal** — Korantis is curatorial, not democratic
4. **Distance is contextual** — only applied when location is present in query
5. **No social proof abuse** — number of reviews is irrelevant; this is not Yelp
6. **Editorial override** — featured venues get +0.1 boost for homepage/generic queries

### Time-Context Adjustment

```typescript
if (context.timeContext === 'night' && venue.time_tags.includes('late-night')) {
  score += 0.08;
}
if (context.timeContext === 'morning' && venue.time_tags.includes('morning')) {
  score += 0.08;
}
```

---

## 13. Venue Enrichment Pipeline

### Data Sources at MVP

Since this is a curated 100–300 venue dataset for Buenos Aires, data is **manually curated + AI-enriched**:

```
Phase 1: Manual curation
  - Team visits / researches each venue
  - Fills: name, address, hours, category, basic info
  - Collects 5–10 images per venue

Phase 2: AI enrichment (offline script)
  - Input: basic venue data + images (optional)
  - GPT-4o-mini writes editorial description
  - GPT-4o-mini assigns vibe tags from taxonomy
  - GPT-4o-mini scores atmosphere signals (0–1 per dimension)
  - OpenAI embeds the enriched text
  - All stored in DB

Phase 3: Human review
  - Editor reviews AI-generated content
  - Corrects tone, tags, and scores
  - Marks is_active = true when ready
```

### Enrichment Script

```typescript
// scripts/enrich-venue.ts
async function enrichVenueById(venueId: string) {
  const venue = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single();

  // Step 1: Generate AI summary
  const summary = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: buildEnrichmentPrompt(venue.data)
    }],
    max_tokens: 300,
  });

  // Step 2: Classify vibes
  const vibesResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: buildVibeClassificationPrompt(venue.data, summary.choices[0].message.content)
    }],
    response_format: { type: 'json_object' },
    max_tokens: 200,
  });
  const vibes = JSON.parse(vibesResponse.choices[0].message.content);

  // Step 3: Generate embedding
  const semanticBlob = buildSemanticBlob(venue.data, summary, vibes);
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: semanticBlob,
  });

  // Step 4: Update DB
  await supabase.from('venues').update({
    ai_summary: summary.choices[0].message.content,
    vibe_tags: vibes.vibe_tags,
    aesthetic_tags: vibes.aesthetic_tags,
    time_tags: vibes.time_tags,
    noise_level: vibes.noise_level,
    light_quality: vibes.light_quality,
    work_friendly: vibes.work_friendly,
    romantic_score: vibes.romantic_score,
    embedding: embeddingResponse.data[0].embedding,
  }).eq('id', venueId);

  console.log(`✓ Enriched: ${venue.data.name}`);
}
```

---

## 14. Image Processing Pipeline

### Philosophy: Images Are Product Infrastructure

Every image must be:
1. **Downloaded** from source and rehosted — never link to external URLs
2. **Resized** to standard sizes for responsive delivery
3. **Optimized** (WebP, quality ~80)
4. **BlurHashed** for instant placeholders
5. **CDN-cached** via Supabase Storage + edge CDN

### Image Sizes (Responsive)

```typescript
const IMAGE_SIZES = {
  card_thumb: { w: 400, h: 300 },    // search result card
  card_large: { w: 800, h: 600 },    // featured/hero card
  hero: { w: 1200, h: 800 },         // venue detail hero
  gallery: { w: 600, h: 450 },       // gallery grid items
  map_pin: { w: 80, h: 80 },         // map marker thumbnail
};
```

### Ingestion Script

```typescript
// scripts/ingest-image.ts
import sharp from 'sharp';
import { encode as blurHashEncode } from 'blurhash';

async function ingestImage(sourceUrl: string, venueId: string, sortOrder: number) {
  // 1. Download
  const buffer = await fetchImageBuffer(sourceUrl);

  // 2. Generate BlurHash
  const { data: rawData, info } = await sharp(buffer)
    .resize(32, 32)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const blurHash = blurHashEncode(new Uint8ClampedArray(rawData), 32, 32, 4, 4);

  // 3. Process multiple sizes
  for (const [sizeName, dims] of Object.entries(IMAGE_SIZES)) {
    const processed = await sharp(buffer)
      .resize(dims.w, dims.h, { fit: 'cover', position: 'attention' })
      .webp({ quality: 82 })
      .toBuffer();

    const storagePath = `venues/${venueId}/${sizeName}.webp`;
    await supabase.storage
      .from('venue-images')
      .upload(storagePath, processed, { contentType: 'image/webp', upsert: true });
  }

  // 4. Save metadata
  await supabase.from('venue_images').insert({
    venue_id: venueId,
    storage_path: `venues/${venueId}`,
    blur_hash: blurHash,
    width: info.width,
    height: info.height,
    sort_order: sortOrder,
  });
}
```

### CDN Strategy

- **Supabase Storage** serves via its built-in CDN (Cloudflare-backed)
- Storage bucket: `venue-images` (public read)
- Public URL pattern: `https://{project}.supabase.co/storage/v1/object/public/venue-images/venues/{id}/{size}.webp`
- **Next.js Image Optimization** (`next/image`) adds further optimization + caching at Vercel edge for web

```typescript
// next.config.js
images: {
  remotePatterns: [
    { hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }
  ],
  formats: ['image/avif', 'image/webp'],
}
```

### Image Component

```tsx
// components/ui/BlurImage.tsx
export function BlurImage({ src, blurHash, alt, ...props }) {
  const blurDataURL = blurHashToDataURL(blurHash, 32, 32);
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL={blurDataURL}
      {...props}
    />
  );
}
```

---

## 15. Search Flow Architecture

### Full Request Lifecycle

```
┌─ USER INPUT ─────────────────────────────────────────┐
│ "quiet café to work in Palermo tonight"              │
└──────────────────────────────────────────────────────┘
                        │
                        ▼ (debounced 300ms)
┌─ QUERY PARSING (client-side, instant) ───────────────┐
│ district: "palermo"                                  │
│ time_context: "evening"                              │
│ intent: ["work", "solo"]                             │
│ category_hint: "café"                                │
└──────────────────────────────────────────────────────┘
                        │
                        ▼ POST /api/search
┌─ EDGE MIDDLEWARE ────────────────────────────────────┐
│ Rate limit check (Upstash)                           │
│ Session detection (guest vs auth)                    │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌─ EMBEDDING LAYER ────────────────────────────────────┐
│ Check Redis cache (hash of normalized query)         │
│   HIT: return cached vector (~1ms)                   │
│   MISS: call OpenAI API (~80ms) → cache result       │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌─ HYBRID SEARCH (Supabase) ───────────────────────────┐
│ Call: search_venues(embedding, query_text, filters)  │
│   1. Vector similarity (pgvector cosine)             │
│   2. Full-text rank (tsvector)                       │
│   3. Filter: district=palermo, category=café         │
│   4. Filter: time_tags contains "evening"            │
│   5. Score composition                               │
│   6. Return top 12                                   │
│ ~20–50ms                                             │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌─ EXPLANATION LAYER (async, cached) ──────────────────┐
│ Check Redis: explain:{query_hash}                    │
│   HIT: attach cached explanation                     │
│   MISS: call MiniMax → 1 sentence → cache 1h         │
│ Non-blocking: return results first, explanation next │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌─ RESPONSE ASSEMBLY ──────────────────────────────────┐
│ {                                                    │
│   venues: [...12 enriched venue objects],            │
│   explanation: "Quiet Palermo cafés...",             │
│   vibeMatch: ["quiet","work","warm"],                │
│   mapBounds: { ne: [...], sw: [...] }                │
│ }                                                    │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
              Total target latency: < 300ms
              (cold: ~250ms; warm/cached: ~80ms)
```

### Search UI States

```
idle        → hero SearchBar, featured collections, trending searches
typing      → suggestions (static: top queries, district links)
loading     → skeleton cards with shimmer (optimistic)
results     → card grid + map, explanation chip, vibe filters
empty       → "Nothing quite like that yet" + curated fallback
error       → retry prompt, no crash
```

---

## 16. Recommendation System

### MVP: Content-Based (Semantic Neighbors)

At MVP, recommendations are purely content-based:

```sql
-- Similar venues: closest embedding neighbors (excluding same venue)
CREATE OR REPLACE FUNCTION similar_venues(target_id uuid, result_limit int DEFAULT 4)
RETURNS TABLE (id uuid, similarity float) AS $$
BEGIN
  RETURN QUERY
  SELECT v.id, (1 - (v.embedding <=> t.embedding))::float AS similarity
  FROM venues v, venues t
  WHERE t.id = target_id AND v.id != target_id AND v.is_active = true
  ORDER BY v.embedding <=> t.embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

### V1: Collaborative Signals

Once save data accumulates (>500 saves):

```
If users who saved venue A also saved venue B,
then B gets a collaborative boost in A's "similar" recommendations.
```

This is implemented as a simple co-occurrence matrix in PostgreSQL:

```sql
-- Compute co-save matrix
SELECT a.venue_id AS a, b.venue_id AS b, COUNT(*) AS co_saves
FROM user_saves a
JOIN user_saves b ON a.user_id = b.user_id AND a.venue_id != b.venue_id
GROUP BY a.venue_id, b.venue_id
HAVING COUNT(*) > 2;
```

### Future: Taste Graph

Described in §35.

---

## 17. Mobile-First UX Architecture

### Philosophy

Korantis is **mobile-native** even though it launches as a web app. Every layout decision optimizes for the 390px viewport first.

### Core Mobile Patterns

**Home Screen:**
```
┌─────────────────────────┐
│  Korantis    [·]        │ ← minimal logo + menu
├─────────────────────────┤
│                         │
│   How does this         │ ← editorial tagline
│   place feel?           │
│                         │
│  ┌─────────────────┐    │
│  │ quiet café...   │    │ ← full-width search input
│  └─────────────────┘    │
│                         │
│  [palermo] [recoleta]   │ ← district pills
│  [work] [date] [brunch] │ ← intent pills
│                         │
├─────────────────────────┤
│  Featured Collection    │ ← editorial section
│  ┌───┐ ┌───┐ ┌───┐     │ ← horizontal scroll cards
│  └───┘ └───┘ └───┘     │
└─────────────────────────┘
```

**Search Results:**
```
┌─────────────────────────┐
│ ← quiet café in palermo │ ← query echo + back
│ "Calm spots to focus"   │ ← AI explanation
│ [quiet] [work] [warm]   │ ← active vibe filters
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │   IMAGE HERO      │  │ ← full-width image
│  │ Felix Roastery    │  │
│  │ Palermo · café    │  │
│  │ [quiet][warm][   ]│  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │   IMAGE HERO      │  │ ← swipeable card stack
│  │ ...               │  │
│  └───────────────────┘  │
├─────────────────────────┤
│      [   Map   ]        │ ← sticky bottom: map toggle
└─────────────────────────┘
```

**Map View (toggle):**
- Full-screen Mapbox map
- Custom minimal dark markers (dots, not Google pins)
- Bottom sheet with venue cards (swipeable)
- Tap marker → bottom sheet scrolls to venue

### Touch Interactions

- Swipe left/right on result cards: dismiss / save
- Long press on card: quick preview (image + summary)
- Pull down to dismiss map, return to list
- Tap vibe tag: refine search (filter, no reload)

### PWA Configuration

```json
// public/manifest.json
{
  "name": "Korantis",
  "short_name": "Korantis",
  "description": "Find places by feeling.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 18. Folder Structure

```
korantis/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── search/page.tsx
│   ├── place/[slug]/page.tsx
│   ├── explore/page.tsx
│   ├── collections/page.tsx
│   ├── collections/[slug]/page.tsx
│   ├── profile/page.tsx
│   └── api/
│       ├── search/route.ts
│       ├── venues/route.ts
│       ├── venues/[slug]/route.ts
│       ├── similar/[id]/route.ts
│       ├── collections/route.ts
│       ├── saves/route.ts
│       └── explain/route.ts
├── components/
│   ├── discovery/
│   ├── venue/
│   ├── layout/
│   ├── ui/
│   └── auth/
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # browser client
│   │   ├── server.ts         # server client (RSC)
│   │   └── types.ts          # generated types
│   ├── search/
│   │   ├── embed.ts          # embedding logic
│   │   ├── parse.ts          # query parsing
│   │   ├── rank.ts           # scoring utils
│   │   └── explain.ts        # AI explanation
│   ├── images/
│   │   ├── blurhash.ts
│   │   └── cdn.ts
│   ├── map/
│   │   └── mapbox.ts
│   ├── analytics/
│   │   └── events.ts
│   └── utils/
│       ├── cn.ts             # clsx/tailwind-merge helper
│       ├── format.ts
│       └── cache.ts
├── hooks/
│   ├── useSearch.ts
│   ├── useVenue.ts
│   ├── useSave.ts
│   ├── useMap.ts
│   └── useAuth.ts
├── stores/
│   ├── searchStore.ts        # Zustand: active query, results
│   └── mapStore.ts           # Zustand: map bounds, selected venue
├── types/
│   ├── venue.ts
│   ├── search.ts
│   └── user.ts
├── scripts/
│   ├── enrich-venue.ts
│   ├── ingest-images.ts
│   ├── seed-venues.ts
│   └── refresh-embeddings.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_pgvector.sql
│   │   ├── 003_postgis.sql
│   │   └── 004_functions.sql
│   ├── seed/
│   │   └── venues.json
│   └── config.toml
├── public/
│   ├── fonts/
│   ├── icons/
│   └── manifest.json
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 19. API Design

### Endpoints

#### `POST /api/search`

```typescript
// Request
{
  query: string;           // "quiet café to work tonight"
  district?: string;       // "palermo" (override auto-detected)
  category?: string;       // "cafe"
  limit?: number;          // default: 12
  location?: {             // user's GPS (optional)
    lat: number;
    lng: number;
  };
}

// Response
{
  venues: VenueCard[];
  explanation: string;     // "Palermo's quietest spots for focused work..."
  vibeMatch: string[];     // ["quiet", "work-friendly", "warm"]
  mapBounds: {
    ne: [number, number];
    sw: [number, number];
  };
  total: number;
  queryId: string;         // for analytics click tracking
}
```

#### `GET /api/venues/[slug]`

```typescript
// Response
{
  venue: VenueFull;        // all fields + images + similar venues
  images: VenueImage[];
  similar: VenueCard[];
  collections: Collection[];  // collections this venue appears in
}
```

#### `GET /api/venues`

```typescript
// Query params: district, category, vibe_tags (comma-sep), limit, offset
// Response: paginated venue list (browse/explore mode)
```

#### `POST /api/saves`

```typescript
// Auth required. Body: { venue_id: string }
// Response: { saved: true }
```

### Response Types

```typescript
interface VenueCard {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  district: string;
  category: string;
  vibeTags: string[];
  coverImage: {
    url: string;
    blurHash: string;
    width: number;
    height: number;
  };
  signals: {
    noiseLevel: number;     // 0–1
    lightQuality: number;
    workFriendly: number;
    romanticScore: number;
  };
  score?: number;           // relevance score (omitted in browse mode)
}

interface VenueFull extends VenueCard {
  description: string;
  aiSummary: string;
  address: string;
  location: { lat: number; lng: number };
  hours: Record<string, string>;
  priceTier: 1 | 2 | 3 | 4;
  images: VenueImage[];
  aestheticTags: string[];
  timeTags: string[];
}
```

---

## 20. Caching Strategy

### Cache Layers

```
Layer 1: Browser / CDN cache
  - Static pages: 1 hour (stale-while-revalidate)
  - Venue detail pages: ISR (revalidate: 3600)
  - Images: Cache-Control: public, max-age=31536000 (1 year, immutable)

Layer 2: Vercel Edge Cache
  - /api/venues/[slug]: cached at edge, revalidated on venue update
  - /api/collections: cached 1 hour

Layer 3: Upstash Redis (runtime cache)
  - Query embeddings: TTL 24h (keyed by SHA256 of normalized query)
  - AI explanations: TTL 1h (keyed by SHA256 of query)
  - Search results: TTL 5min (keyed by query+filters hash)
  - Popular query results: TTL 15min

Layer 4: PostgreSQL query cache
  - query_cache table for persistent embedding storage
  - Supabase Connection pooling via PgBouncer (built-in)
```

### Cache Key Strategy

```typescript
function buildSearchCacheKey(query: string, filters: SearchFilters): string {
  const normalized = {
    q: query.trim().toLowerCase(),
    d: filters.district || '',
    c: filters.category || '',
  };
  return `search:${sha256(JSON.stringify(normalized))}`;
}
```

### Cache Invalidation

- Venue updates → invalidate venue detail cache via Supabase webhook → Vercel revalidatePath
- New venue added → invalidate district browse pages
- Collection updates → invalidate collection pages

---

## 21. Performance Optimization

### Target Metrics

| Metric | Target |
|---|---|
| LCP (Largest Contentful Paint) | < 2.0s |
| FID / INP | < 100ms |
| CLS | < 0.05 |
| Search response time (warm) | < 100ms |
| Search response time (cold) | < 300ms |
| Venue detail page load | < 1.5s |

### Strategy

**1. Streaming SSR**
```tsx
// app/search/page.tsx
export default async function SearchPage({ searchParams }) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults query={searchParams.q} />
    </Suspense>
  );
}
// SearchResults streams as data arrives — first paint is instant
```

**2. ISR for Venue Pages**
```tsx
// app/place/[slug]/page.tsx
export const revalidate = 3600; // Rebuild every hour

export async function generateStaticParams() {
  const venues = await getAllVenueSlugs();
  return venues.map(v => ({ slug: v.slug }));
}
```

**3. Preloading**
```tsx
// On hover over search result, prefetch venue page
<Link href={`/place/${slug}`} prefetch={true}>
```

**4. Optimistic UI**
```tsx
// Show skeleton immediately on search submit
const [isLoading, setLoading] = useState(false);
const handleSearch = async (query: string) => {
  setLoading(true);  // ← skeleton renders in ~0ms
  const results = await fetchSearch(query);
  setLoading(false);
};
```

**5. Mapbox Lazy Loading**
```tsx
const MapLayer = dynamic(() => import('@/components/layout/MapLayer'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
```

---

## 22. Precomputed vs Runtime Logic

### Always Precomputed (Offline)

| Task | How | When |
|---|---|---|
| Venue embeddings | OpenAI API + script | On venue creation/update |
| Vibe tags | LLM classification | On venue enrichment |
| Atmosphere scores | LLM scoring | On venue enrichment |
| Editorial summaries | GPT-4o-mini | On venue enrichment |
| BlurHashes | Sharp + blurhash lib | On image ingestion |
| Image variants | Sharp resizing | On image ingestion |
| tsvector search index | PostgreSQL trigger | On venue insert/update |
| Spatial index | PostGIS | On venue insert/update |
| Collection membership | Manual curation | On collection edit |

### Runtime (Per Request)

| Task | Latency | Cached? |
|---|---|---|
| Query parsing (district, time, intent) | < 1ms | No (instant) |
| Query embedding | ~80ms | Yes (Redis, 24h) |
| Hybrid DB search | ~20–50ms | Partial (popular queries) |
| AI explanation | ~300ms | Yes (Redis, 1h) |
| Image serving | < 50ms | Yes (CDN, 1 year) |

### Decision Rule

> If a computation depends only on **venue data** (not the user's specific query), it should be precomputed.
> If it depends on the **specific query**, it should be cached at the query level.
> If it depends on the **specific user**, it is runtime and personalized.

---

## 23. What Should NOT Use LLMs

| Task | Use Instead |
|---|---|
| Extract district from query | String matching dictionary |
| Extract time context ("tonight") | Regex / keyword map |
| Detect category hint ("wine bar") | Keyword dictionary |
| Sort/rank results | Deterministic scoring function |
| Apply filters | SQL WHERE clauses |
| Display vibe tags | Precomputed from DB |
| Show operating hours | DB field |
| Calculate distances | PostGIS ST_Distance |
| Generate BlurHash | Sharp + blurhash library |
| Validate user input | Zod schema validation |
| Format prices | Number formatter |
| Image resizing | Sharp (build time) |
| Pagination | SQL LIMIT/OFFSET |
| User authentication | Supabase Auth |
| Rate limiting | Upstash + middleware |

**LLM budget at runtime is precious.** Use it only where it creates irreplaceable value: interpreting genuinely ambiguous natural language, and generating emotional editorial copy.

---

## 24. AI Latency Avoidance Strategy

### The Problem

LLM calls are slow (200–800ms) and expensive. Korantis must feel instantaneous.

### Strategy Matrix

```
Query embedding:
  Target: < 5ms
  Method: Redis cache (SHA256 key, 24h TTL)
  Hit rate target: > 80% (popular queries recur)

AI explanation:
  Target: Non-blocking (return results first)
  Method: 
    1. Return search results immediately (~100ms)
    2. Stream AI explanation separately (async)
    3. Cache explanation in Redis (1h TTL)
    UI: Show "..." then fade in explanation
    
Venue enrichment:
  Target: 0ms at runtime
  Method: All enrichment offline, stored in DB
  
Future personalization:
  Target: < 10ms
  Method: Precomputed taste vectors per user
          Updated daily in background job
```

### Non-Blocking Explanation Pattern

```tsx
// SearchResults.tsx
const [explanation, setExplanation] = useState<string | null>(null);

useEffect(() => {
  // Results are already displayed; fetch explanation async
  fetchExplanation(query, venueIds).then(setExplanation);
}, [results]);

return (
  <>
    <VenueGrid venues={results} />
    <ExplanationChip text={explanation} loading={!explanation} />
  </>
);
```

---

## 25. Analytics Architecture

### Philosophy: Behavior Over Vanity Metrics

Track signals that improve the product, not just dashboards.

### Events Schema

```typescript
type AnalyticsEvent =
  | { event: 'search'; query: string; results_count: number; session_id: string }
  | { event: 'result_click'; venue_id: string; query: string; rank: number; session_id: string }
  | { event: 'venue_view'; venue_id: string; source: 'search' | 'browse' | 'collection' }
  | { event: 'save'; venue_id: string; user_id: string }
  | { event: 'map_open'; session_id: string }
  | { event: 'collection_view'; collection_id: string }
  | { event: 'zero_results'; query: string }  // critical: improve coverage
```

### Tools

- **Plausible Analytics** (privacy-first, $9/month, GDPR-compliant) for web analytics
- **Supabase `search_events` table** for search intelligence (what queries drive saves)
- **Vercel Analytics** (free tier) for web vitals and performance

### Key Metrics

```
Product health:
  - Search-to-click rate (target: > 60%)
  - Click-to-save rate (proxy for quality)
  - Zero-results rate (target: < 5%)
  - Return visit rate (weekly active / monthly active)

Search quality:
  - Top 50 queries by volume → manual audit monthly
  - Zero-results queries → coverage gaps → add venues or improve embeddings
  - Queries with low CTR → ranking problems

Business signals:
  - MAU, DAU
  - Auth conversion rate (from search to sign-up)
  - Collections engagement
```

---

## 26. Cost Optimization Strategy

### Monthly Budget at MVP (~$50/month target)

| Service | Plan | Cost |
|---|---|---|
| Vercel (hosting) | Pro (required for edge functions at scale) | $20/month |
| Supabase | Free tier → Pro at $25/month when needed | $0–$25 |
| Upstash Redis | Free tier (10K req/day) | $0 |
| OpenAI (embeddings) | Pay-as-you-go | ~$1–2/month |
| MiniMax API | Pay-as-you-go | ~$2–5/month |
| Mapbox | Free (50K map loads/month) | $0 |
| Plausible Analytics | $9/month | $9 |
| Domain | Annual | ~$1/month |
| **Total** | | **~$33–62/month** |

### Cost Scaling Triggers

```
> 1K DAU         → Supabase Pro ($25) for connection pooling
> 50K map loads  → Mapbox paid (~$0.50/1K extra loads)
> 10K Redis req  → Upstash paid ($10/month)
> 5K AI queries  → MiniMax costs rise; add more aggressive caching
> 100K queries   → Consider self-hosted embedding model (Ollama + text-embed)
```

### Long-Term Cost Optimization

- Move embeddings to a self-hosted model (nomic-embed-text via Ollama) at scale → $0 incremental
- Move short explanations to a fine-tuned small model on Fireworks.ai → 10x cheaper
- Enable aggressive query-level result caching to reduce DB load
- Static export for browse/explore pages (zero DB cost per pageview)

---

## 27. Scalability Roadmap

### Phase 1: MVP (0–1K users)
Single Supabase project, single Next.js deployment on Vercel, everything in one DB, no queue system. This handles hundreds of QPS easily.

### Phase 2: Growth (1K–100K users)
- Add **Upstash Redis** for distributed caching (already in architecture)
- Enable **Supabase read replicas** for analytics queries (Supabase Pro)
- Add **background jobs** via Vercel Cron (venue re-enrichment, taste vector updates)
- Add **CDN purge automation** on venue updates

### Phase 3: Scale (100K+ users)
- Extract enrichment pipeline to standalone worker (Trigger.dev or Inngest)
- Add **Elasticsearch** or **Typesense** for text search if Postgres FTS becomes limiting
- Consider **dedicated vector DB** (Qdrant self-hosted) if pgvector shows bottlenecks
- Add **read replicas** for search queries, keep primary for writes
- Mobile apps (React Native + Expo sharing component logic)

### What Never Needs Microservices
The image pipeline, search API, and venue enrichment can all remain in the Next.js monolith until millions of users. Don't split early.

---

## 28. Security Considerations

### Authentication & Authorization

- **Supabase RLS** enforces data access at DB level — no user can access another's saves even with a direct SQL injection attempt
- **JWT validation** on every authenticated API route via Supabase server client
- **PKCE flow** for OAuth (Supabase handles this)

### API Security

```typescript
// Rate limiting: all API routes
import { Ratelimit } from '@upstash/ratelimit';
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'),  // 20 req per 10s per IP
});
```

- **Input validation:** All inputs validated with Zod before processing
- **Query sanitization:** User queries never interpolated into raw SQL (always parameterized)
- **No secrets client-side:** All AI API keys are server-side only
- **Content Security Policy:** Strict CSP headers via Next.js headers config
- **HTTPS everywhere:** Vercel provides TLS automatically

### Data Privacy

- Search events store `session_id` (random UUID per session), never IP address
- No tracking pixels, no third-party ad scripts
- User saves are only accessible via authenticated RLS policies
- GDPR-compatible: user can delete account → CASCADE deletes saves

---

## 29. Deployment Strategy

### Environments

```
development  → localhost:3000 + local Supabase (supabase start)
staging      → Vercel Preview + staging Supabase project
production   → Vercel Production + production Supabase project
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run type check
        run: npx tsc --noEmit
      - name: Run linter
        run: npm run lint
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### Database Migrations

```bash
# Local development
supabase db diff --schema public > supabase/migrations/XXX_change.sql
supabase db push

# Production
supabase db push --db-url $PRODUCTION_DB_URL
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only
OPENAI_API_KEY=                   # server-side only
MINIMAX_API_KEY=                  # server-side only
NEXT_PUBLIC_MAPBOX_TOKEN=         # public (read-only map token)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 30. Authentication Architecture

### Philosophy: Zero-Friction Discovery

```
Guest user:
  ✓ Search freely
  ✓ Browse venues
  ✓ View venue details
  ✓ View map
  ✓ Explore collections
  ✗ Save venues (triggers soft-gate)
  ✗ Personalization
  ✗ Profile

Authenticated user:
  + All of the above
  + Save venues
  + Access saved list
  + Taste personalization (V1)
  + Collections (V2)
```

### Soft Auth Gate

```tsx
// components/auth/SaveButton.tsx
function SaveButton({ venueId }: { venueId: string }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) {
      // Soft gate: show modal, remember intent
      openAuthModal({ intent: 'save', venueId });
      return;
    }
    await saveVenue(venueId);
    setSaved(true);
  };

  return <button onClick={handleSave}>{saved ? '♥' : '♡'}</button>;
}
```

```tsx
// After auth completes, resume intent
const { pendingIntent } = useAuthModal();
useEffect(() => {
  if (user && pendingIntent?.intent === 'save') {
    saveVenue(pendingIntent.venueId);
  }
}, [user]);
```

### Supabase Auth Configuration

```typescript
// lib/supabase/server.ts
export function createServerClient() {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: ... }  // Next.js cookie adapter
  );
}
```

OAuth providers configured in Supabase dashboard:
- **Google OAuth** → enable at launch
- **Apple Sign In** → add in V1 (required for iOS App Store)

---

## 31. Storage Architecture

### Supabase Storage Buckets

```
venue-images/          ← public bucket (CDN-served)
  venues/
    {venue-id}/
      card_thumb.webp  (400×300)
      card_large.webp  (800×600)
      hero.webp        (1200×800)
      gallery/
        01.webp
        02.webp
        ...

user-avatars/          ← public bucket
  {user-id}/
    avatar.webp

exports/               ← private bucket (internal use)
  embeddings/
    venues.json        ← backup of all venue embeddings
```

### Storage Policies

```sql
-- Public read for venue images
CREATE POLICY "public_venue_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'venue-images');

-- Auth required for user avatars (write)
CREATE POLICY "auth_avatar_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 32. Search Indexing Strategy

### Multi-Layer Index

```
Layer 1: Semantic (pgvector)
  Index: IVFFlat, cosine_ops, 50 lists
  Use: Primary relevance ranking
  Query: embedding <=> query_vector

Layer 2: Full-text (tsvector)
  Index: GIN on search_text
  Use: Keyword precision, proper nouns, Spanish terms
  Query: search_text @@ plainto_tsquery('english', query)

Layer 3: Structured (B-Tree)
  Indexes: category, district, is_active, price_tier
  Use: Hard filters before scoring

Layer 4: Array (GIN)
  Index: GIN on vibe_tags
  Use: Vibe filter in browse/explore mode
  Query: vibe_tags @> ARRAY['quiet', 'warm']

Layer 5: Spatial (GIST)
  Index: GIST on location geography
  Use: Proximity filtering
  Query: ST_DWithin(location, point, distance)
```

### Search Mode Selection

```typescript
function selectSearchMode(parsed: ParsedQuery): SearchMode {
  if (parsed.raw.length < 3) return 'browse';
  if (isStructuredBrowse(parsed)) return 'structured';  // "cafés in palermo"
  return 'semantic';                                     // "quiet spot to think"
}
```

---

## 33. Image CDN Strategy

### MVP: Supabase Storage (Cloudflare CDN)

Supabase Storage is backed by Cloudflare globally. Public bucket objects are cached at edge automatically.

```
URL pattern:
https://{project-id}.supabase.co/storage/v1/object/public/venue-images/venues/{id}/hero.webp

Cache headers (set by Supabase):
Cache-Control: public, max-age=3600
```

### V1: next/image Optimization

`next/image` adds an additional optimization layer:

```typescript
// next.config.ts
export default {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: '*.supabase.co',
    }],
    minimumCacheTTL: 86400,
    formats: ['image/avif', 'image/webp'],
  }
}
```

Vercel caches optimized images at its edge CDN (250+ locations).

### Future: Cloudflare Images or imgix

At >10K images or complex transformations:
- **Cloudflare Images**: $5/month for 100K stored, dynamic resizing via URL params
- **imgix**: Powerful transformation API, more expensive

---

## 34. Recommendation Engine Evolution

### Stage 1 (MVP): Content-Based Similarity
- Pure pgvector cosine distance between venue embeddings
- "If you liked Felix Roastery, you'll like Café Crespo"
- No user data needed, works immediately

### Stage 2 (V1): Save-Based Collaborative
- Users who saved A also saved B → boost B for A's detail page
- Co-occurrence matrix in PostgreSQL (simple, fast)
- 500+ saves needed for signal

### Stage 3 (V2): Taste Vector Per User
- User's saved venues → average their embeddings → "taste centroid"
- New search: bias results toward user's taste centroid
- `final_score += 0.1 * cosine_similarity(venue_embedding, user_taste_vector)`

### Stage 4 (Scale): Graph-Based
- Build bipartite graph: users → venues
- Graph embedding (Node2Vec or LightGCN-lite)
- Cold start: use onboarding taste quiz to initialize vector

---

## 35. Taste Graph Direction

### What Is the Taste Graph

The Taste Graph is Korantis's long-term competitive moat: a structured understanding of *how taste clusters in Buenos Aires*. It connects:

```
Users ──saves──▶ Venues ──tagged──▶ Vibes
  │                                    │
  └────────────────────────────────────┘
              (implicit taste)
```

### Data Structure

```sql
CREATE TABLE taste_vectors (
  user_id         uuid REFERENCES auth.users(id),
  vector          vector(1536),          -- avg of saved venue embeddings
  vibe_affinity   jsonb,                 -- {"warm": 0.8, "minimal": 0.6}
  updated_at      timestamptz
);
```

### Taste Profile Display (User-Facing)

Eventually surface as: *"You tend to prefer quiet, minimal cafés with natural light in Palermo."*

This is built entirely from save behavior — no explicit preference questionnaire needed (though optional onboarding quiz helps cold start).

---

## 36. Future Social Layer

### Philosophy: Social is a Multiplier, Not Core

Korantis is a taste platform first. Social features amplify discovery but should never make it feel like a review app.

### Possible Social Primitives

```
Phase 1 (no social):
  Private saves, private history

Phase 2 (soft social):
  Share a venue → beautiful link preview
  "Send to a friend" → WhatsApp/iMessage deep link
  Curated Lists → user can publish a "my favorite spots" list

Phase 3 (taste network):
  Follow taste-mates (users with similar vibe profiles)
  See what similar-taste users saved recently
  "Trending in Palermo this week" (aggregated saves, anonymous)

Phase 4 (editorial):
  User-contributed editorial notes (vetted, not reviews)
  Tasteful photo contributions
  Community-curated collections
```

### Anti-Patterns to Avoid

- No star ratings
- No public review counts
- No "most reviewed" sorting
- No comment sections
- No influencer integration

---

## 37. SEO Strategy

### Why SEO Matters

Organic search for "best café palermo buenos aires" or "romantic dinner recoleta" represents high-intent traffic. Korantis can own this.

### Technical SEO

```tsx
// app/place/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const venue = await getVenueBySlug(params.slug);
  return {
    title: `${venue.name} — ${venue.tagline} | Korantis`,
    description: venue.ai_summary,
    openGraph: {
      images: [{ url: venue.coverImage.url, width: 1200, height: 630 }],
    },
  };
}
```

- **ISR venue pages** — pre-rendered at build, served as static HTML → perfect for Googlebot
- **Schema.org markup** — `LocalBusiness`, `Restaurant` JSON-LD on venue pages
- **Sitemap** — auto-generated from venue slugs
- **No `noindex`** on discovery pages

### Content SEO

- Each venue page is a semantically rich, editorial page
- Collections become SEO landing pages: `/explore/quiet-cafes-palermo`, `/explore/romantic-dinner-recoleta`
- Blog/editorial layer (V2): "Buenos Aires Café Culture" type content

---

## 38. Local Discovery Growth Strategy

### Launch Market: Buenos Aires

**Phase 1: Curate aggressively**
- 100 hand-picked venues across Palermo/Recoleta/Puerto Madero
- Every venue photographed, described, scored with love
- Quality > quantity. Be the Criterion Collection of Buenos Aires cafés.

**Phase 2: Build ambient presence**
- Instagram @korantis — cinematic venue photography, no reviews, no stars
- Instagram stories: "place of the week", atmospheric photography
- Newsletter (weekly): "3 places this weekend" — curated by mood
- PR: Buenos Aires lifestyle press, ex-pat guides, architecture blogs

**Phase 3: Word of mouth flywheel**
- Beautiful venue pages → shareable links → WhatsApp forwarding
- "Send this place" UX built into every venue detail page
- `og:image` cards look premium when shared → organic amplification

**Phase 4: Expand**
- Montevideo, Santiago, São Paulo (same playbook)
- City-by-city curation: each city feels locally authentic, not algorithmically generated

---

## 39. Infrastructure Providers

| Service | Provider | Notes |
|---|---|---|
| Frontend hosting | Vercel | Best Next.js experience, edge network |
| Database | Supabase (PostgreSQL) | pgvector + PostGIS + RLS + Auth |
| Auth | Supabase Auth | Google OAuth → Apple later |
| Object storage | Supabase Storage | CDN-backed, simple, co-located with DB |
| Cache | Upstash Redis | Serverless Redis, pay-as-you-go |
| Maps | Mapbox GL JS | Best dark/custom tile styling |
| Text embeddings | OpenAI API | text-embedding-3-small |
| Short AI copy (runtime) | MiniMax API | Cost-efficient for simple completions |
| Venue enrichment (offline) | OpenAI GPT-4o-mini | Higher quality, run once per venue |
| Analytics | Plausible | Privacy-first, lightweight |
| Performance analytics | Vercel Analytics | Free, web vitals |
| CI/CD | GitHub Actions + Vercel | Auto-deploy on push |
| Domain/DNS | Cloudflare | Free DDoS, fast DNS |
| Email (transactional) | Resend | Simple API, generous free tier |

---

## 40. Implementation Roadmap: MVP → V1 → Platform

---

### ◆ MVP (Weeks 1–6): The Core Discovery Loop

**Goal:** A working, beautiful, search-first discovery app for Buenos Aires. No auth required. Feels magical on first use.

**Week 1–2: Foundation**
- [ ] Next.js 14 project setup (App Router, TypeScript, TailwindCSS)
- [ ] Supabase project: schema migrations, pgvector, PostGIS extensions
- [ ] Database schema: venues, venue_images, collections
- [ ] Basic venue data entry: 30 pilot venues (Palermo focus)
- [ ] Image ingestion script (Sharp + BlurHash + Supabase Storage)
- [ ] Seed venues with images

**Week 3: Search Core**
- [ ] Venue enrichment script (GPT-4o-mini → vibe tags, summaries, embeddings)
- [ ] `search_venues()` SQL function (hybrid: vector + FTS + filters)
- [ ] `/api/search` endpoint (parse query → embed → search → return results)
- [ ] Upstash Redis setup + query embedding cache

**Week 4: Frontend — Search Experience**
- [ ] Home page: SearchBar, district pills, intent pills
- [ ] Search results page: VenueCard grid + mobile layout
- [ ] VenueCard component: BlurImage, vibe tags, atmosphere signals
- [ ] Framer Motion: entrance animations, card transitions
- [ ] Mapbox integration: result locations on dark map

**Week 5: Venue Detail + Polish**
- [ ] Venue detail page (ISR): hero image, gallery, description, hours
- [ ] SimilarPlaces component (semantic neighbors)
- [ ] AI explanation chip (async, cached)
- [ ] Collections: 3–5 editorial curated collections
- [ ] Mobile layout polish, PWA manifest

**Week 6: Quality + Launch Prep**
- [ ] 100 venues fully enriched and live
- [ ] SEO: metadata, og:image, JSON-LD, sitemap
- [ ] Performance audit: LCP < 2s, search < 300ms
- [ ] Analytics: Plausible + search_events table
- [ ] Security: RLS, input validation, rate limiting
- [ ] Soft launch: friends + Buenos Aires early adopters

**MVP Deliverable:**
A live web app where anyone can type "quiet café to work tonight" and see beautiful, emotionally accurate results for Buenos Aires, instantly, without signing up.

---

### ◆ V1 (Weeks 7–14): The Full Product

**Goal:** Auth layer, saves, personalization seed, polish, growth foundation.

**Auth & Saves (Week 7–8)**
- [ ] Supabase Auth: Google OAuth
- [ ] Soft auth gate on Save button
- [ ] user_saves table + RLS
- [ ] Saved places page (`/profile/saves`)
- [ ] Save intent preservation across auth flow

**Expanded Content (Week 8–9)**
- [ ] 200+ venues across Palermo, Recoleta, Puerto Madero
- [ ] Collections expanded to 10+
- [ ] Editorial collection landing pages (SEO)
- [ ] Explore page: browse by vibe, district, category

**Search V2 (Week 9–10)**
- [ ] Time-context awareness (filter by open hours in real-time)
- [ ] Vibe filter chips on results (refine without re-searching)
- [ ] Zero-results recovery (fallback curated suggestions)
- [ ] Search history (session-based, no auth required)

**Performance & Infrastructure (Week 10–11)**
- [ ] ISR for all venue pages (pre-render top 100)
- [ ] Vercel Edge caching for browse endpoints
- [ ] Image CDN optimization audit
- [ ] Supabase Pro upgrade if warranted

**Growth Layer (Week 12–14)**
- [ ] Beautiful share cards (og:image generation via Vercel OG)
- [ ] "Send this place" WhatsApp/iMessage integration
- [ ] Newsletter signup (Resend API)
- [ ] Instagram-optimized venue cards (exportable visual)
- [ ] Apple Sign In (V1.5 — required for iOS App Store)

---

### ◆ Platform (Month 4–12): Scalable Urban Intelligence

**Goal:** Multi-city, personalization, taste graph, native mobile apps, growth flywheel.

**Personalization Engine (Month 4–5)**
- Taste vectors from save behavior
- Personalized homepage feed
- "Based on your taste" recommendations
- Taste profile page: "You prefer warm, minimal, quiet"

**Multi-City Expansion (Month 5–7)**
- City selector: Buenos Aires → Montevideo → São Paulo
- City-specific district taxonomy
- Per-city editorial curation team (freelance at first)
- Cross-city taste consistency (same embedding space)

**Native Mobile Apps (Month 6–8)**
- React Native + Expo (code sharing with web components)
- iOS App Store + Google Play
- Push notifications: "New café in Palermo you'd like"
- Offline mode: saved venues cached locally

**Taste Graph V2 (Month 8–10)**
- Co-save collaborative signals
- "Similar taste users" recommendations
- Soft social: public taste lists

**Editorial & Content Layer (Month 10–12)**
- Editorial articles: city guides, venue stories
- SEO content flywheel (city × category × mood landing pages)
- Photographer partnerships: professional venue shoots
- Brand partnerships: curated venue spotlights (non-intrusive)

---

## Final Principles to Build By

> **1. The AI should be invisible.** Users should feel the magic, never see the machinery.

> **2. Every millisecond is a design decision.** Speed is product quality.

> **3. Curate aggressively, expand carefully.** 100 perfect venues beats 10,000 mediocre ones.

> **4. Images are not decoration.** They are the emotional product.

> **5. Build the thing that makes someone say "how did it know?"** That's the product.

---

*Korantis Architecture v1.0 — Design by principal product/engineering synthesis*
*Stack: Next.js · Vercel · Supabase · pgvector · PostGIS · Mapbox · OpenAI · MiniMax · TailwindCSS · Framer Motion*
