# Korantis Venue Intelligence Architecture v1.0

## Purpose

This document defines the canonical architecture for the **Venue Intelligence Engine**.

The Place Discovery Architecture defines how Korantis finds candidate venues. The Venue Intelligence Architecture defines how Korantis understands a venue after it has been discovered and enriched.

Korantis is not trying to build a prettier Google Maps. Korantis is building a machine that understands urban atmosphere, intent, cultural relevance, and experiential fit.

The core question is not:

> Does this venue exist?

The core question is:

> What kind of moment does this venue support, and does it deserve to belong in Korantis?

---

## Core Principle

Discovery finds candidates. Venue Intelligence understands candidates. Atmosphere generation describes candidates. Publishing exposes candidates.

These responsibilities must remain separate.

```text
Discovery Engine
→ finds places worth investigating

Google Enrichment
→ adds factual venue data

Venue Intelligence Engine
→ extracts signals, scores, evidence, and intent fit

Eligibility Gate
→ decides whether the venue belongs in Korantis

Atmosphere Engine
→ creates final user-facing language

Publishing Layer
→ exposes approved venues
```

Venue Intelligence must not generate poetic copy. Venue Intelligence must not publish. Venue Intelligence must not decide UI.

Venue Intelligence produces structured understanding.

---

## Position in the Full Architecture

```text
Urban Geography Layer
↓
Curated Discovery Engine
↓
Candidate Universe
↓
Source Consensus Engine
↓
Google Places Enrichment
↓
Venue Intelligence Engine
↓
Intent / Experience Scoring
↓
Editorial Eligibility Gate
↓
Atmosphere Engine
↓
Staging Review
↓
Public Korantis Venue
```

The Venue Intelligence Engine starts only after a candidate has enough discovery evidence to justify enrichment.

---

## What Venue Intelligence Solves

A venue can be important but not useful for a specific intent.

A venue can be beautiful but not culturally relevant.

A venue can be popular but generic.

A venue can be unknown but perfect for Korantis.

Examples:

### Classic Landmark

A historic café may have high cultural relevance and high heritage, but low work suitability.

### Specialty Work Café

A small specialty café may have modest review count but high work, design, specialty, and community signals.

### Tourist Trap

A venue may have high review count and high tourist visibility but low experiential fit.

### Emerging Venue

A new independent place may have low review count and few sources but high novelty, community, visual quality, and atmosphere potential.

Venue Intelligence exists to make these distinctions machine-readable.


---

## Inputs

Venue Intelligence consumes data from multiple upstream systems.

### Discovery Inputs

```json
{
  "candidate_id": "",
  "city": "",
  "district": "",
  "category": "",
  "source_count": 0,
  "sources": [],
  "consensus_score": 0,
  "discovery_score": 0,
  "source_mentions": [],
  "district_identity_tags": []
}
```

### Google Enrichment Inputs

```json
{
  "google_place_id": "",
  "rating": 0,
  "user_rating_count": 0,
  "price_level": null,
  "primary_type": "",
  "types": [],
  "business_status": "",
  "formatted_address": "",
  "location": {},
  "opening_hours": {},
  "website_uri": "",
  "google_maps_uri": "",
  "photos": [],
  "reviews": []
}
```

### External Source Mention Inputs

```json
{
  "source": "",
  "source_weight": 0,
  "source_type": "editorial | community | travel | premium | local",
  "context": "",
  "rank_position": null,
  "mention_snippet": "",
  "district": "",
  "category": ""
}
```

### Photo Inputs

```json
{
  "photo_reference": "",
  "source": "google",
  "width": 0,
  "height": 0,
  "position": 0
}
```

---

## Output Philosophy

Venue Intelligence outputs:

```text
Signals
Scores
Evidence
Warnings
Recommended intents
```

It does not output final marketing language.

It does not output fixed editorial categories as permanent truth.

It does not decide final rankings alone.

The system should store evidence and derive interpretations.


---

## Store Signals, Derive Labels

Do not store rigid labels too early, such as:

```text
classic
emerging
contracultural
imperdible
hidden gem
tourist trap
```

Those are interpretations.

Instead store underlying signals:

```json
{
  "heritage_signal": 0,
  "landmark_signal": 0,
  "tourist_signal": 0,
  "local_signal": 0,
  "community_signal": 0,
  "specialty_signal": 0,
  "design_signal": 0,
  "novelty_signal": 0,
  "independent_signal": 0,
  "mainstream_signal": 0,
  "luxury_signal": 0,
  "hidden_signal": 0
}
```

Labels can be derived later.

Example:

```text
High heritage + high cultural relevance + high tourist signal
→ Classic city landmark
```

```text
High novelty + high community + high independent + low tourist
→ Emerging independent venue
```

This keeps the architecture scalable and adaptable.

---

## Score Separation

Korantis must not collapse all intelligence into one score too early.

Different scores answer different questions.

```text
Discovery Score
Cultural Relevance Score
Experience Quality Score
Photo Quality Score
Intent Scores
Eligibility Score
Korantis Rank Score
```

### Discovery Score

Question:

> Is this place important enough to investigate?

Generated before enrichment.

### Cultural Relevance Score

Question:

> Does this place matter in the city?

Uses review volume, source authority, heritage, and external mentions.

### Experience Quality Score

Question:

> Does this place offer a meaningful experience?

Uses photos, reviews, mentions, atmosphere signals, and quality indicators.

### Photo Quality Score

Question:

> Can Korantis visually represent this place well?

Uses hero suitability, interior visibility, seating, design, lighting, and product-only detection.

### Intent Scores

Question:

> What is this place good for?

Examples:

- work
- reading
- date
- dinner
- brunch
- wine
- cocktails
- solo time
- friends
- creative session

### Eligibility Score

Question:

> Should this venue be allowed into Korantis?

Combines technical completeness, editorial fit, evidence strength, photo suitability, and rejection risks.

### Korantis Rank Score

Question:

> Where should this venue rank for a specific user intent, district, time, or mood?

This is downstream and should not be computed inside the base intelligence layer unless explicitly scoped.


---

## Cultural Relevance Engine

Google review count matters, but it must be used correctly.

Review count does not measure atmosphere.

Review count measures cultural footprint and public validation.

A venue with 12,000 Google reviews is not the same as a venue with 50 reviews.

However:

```text
High review count does not equal high Korantis quality.
```

A generic chain can have many reviews. A hidden café can have few reviews and still be excellent.

Therefore review volume must be separated from experience quality.

### Suggested Inputs

```json
{
  "google_rating": 4.7,
  "google_review_count": 12000,
  "source_count": 7,
  "premium_source_count": 2,
  "editorial_source_count": 4,
  "community_source_count": 3,
  "heritage_signal": 80,
  "landmark_signal": 70
}
```

### Review Count Log Scaling

Review count should be log-scaled.

```text
50 reviews       → low relevance
500 reviews      → moderate relevance
5,000 reviews    → high relevance
50,000 reviews   → very high relevance
```

Do not score review count linearly.

Suggested conceptual formula:

```text
review_count_log_score = log10(review_count + 1) normalized to 0–100
```

### Cultural Relevance Output

```json
{
  "review_count_log_score": 0,
  "rating_quality_score": 0,
  "source_authority_score": 0,
  "heritage_boost": 0,
  "cultural_relevance_score": 0
}
```

### Examples

#### Café Tortoni-type venue

```json
{
  "cultural_relevance_score": 96,
  "heritage_signal": 95,
  "tourist_signal": 90,
  "work_score": 25
}
```

#### Cuervo-type venue

```json
{
  "cultural_relevance_score": 60,
  "specialty_signal": 95,
  "community_signal": 88,
  "work_score": 85
}
```

Both may belong in Korantis, but for different reasons.


---

## Source Intelligence

Sources should influence intelligence beyond simple frequency.

Source types:

```text
premium_editorial
local_editorial
specialist
community
travel
tourism
generic
```

Examples:

```text
Michelin                → premium_editorial
50 Best Discovery       → premium_editorial
World's Best Bars       → premium_editorial
Time Out                → local/editorial
Specialty Coffee Guide  → specialist
Reddit                  → community
Tripadvisor             → travel/popularity
Wanderlog               → travel/list aggregation
Visit Buenos Aires      → tourism/official
```

### Source Weighting

Source weights should remain configurable.

Initial suggested weights:

```text
Michelin                  95
World's Best Bars         95
50 Best Discovery         90
Time Out                  85
Specialty Coffee Guides   85
Local Editorial Guides    80
Reddit                    70
Tripadvisor               65
Wanderlog                 60
Generic Travel Blogs      50
Low-quality scraped lists  30
```

### Source Role

Different source types contribute to different signals.

```text
Michelin / 50 Best
→ premium, culinary relevance, destination quality

World's Best Bars
→ cocktail quality, night relevance, destination bar

Specialty coffee guides
→ specialty signal, work/coffee relevance

Reddit
→ community signal, local signal, practical use cases

Tripadvisor
→ popularity, tourism, broad coverage

Visit Buenos Aires
→ tourism, landmark, official city relevance
```

Tripadvisor should not dominate experience quality.

It is valuable for coverage and popularity, but weaker for atmosphere.


---

## Photo Intelligence

Photos are mandatory for Korantis.

The UI depends on visual trust.

A venue without an acceptable hero image should not be published.

Photo Intelligence should use a vision model.

Preferred inexpensive stack:

```text
Google Photos
↓
Gemini Flash Vision or equivalent low-cost vision model
↓
Structured photo analysis JSON
```

### Photo-Level Analysis

Each photo should be scored independently.

```json
{
  "photo_reference": "",
  "interior_visible": true,
  "exterior_visible": false,
  "seating_visible": true,
  "people_staying_visible": true,
  "counter_only": false,
  "product_only": false,
  "storefront_only": false,
  "menu_only": false,
  "natural_light_score": 80,
  "spatial_depth_score": 75,
  "design_quality_score": 85,
  "atmosphere_score": 88,
  "hero_suitability_score": 90,
  "card_suitability_score": 85
}
```

### Venue-Level Photo Output

```json
{
  "acceptable_hero_photo": true,
  "hero_photo_reference": "",
  "best_card_photo_reference": "",
  "photo_quality_score": 0,
  "interior_confidence": 0,
  "seating_confidence": 0,
  "long_stay_visual_signal": 0,
  "design_visual_signal": 0,
  "warnings": []
}
```

### Photo Rejection Signals

Downgrade if:

- only product photos
- only storefront photos
- menu-only photos
- no seating visible
- no interior signal
- poor visual quality
- photos do not support claimed atmosphere

Do not use product-only photos as hero.

Do not use storefront-only photos as hero unless there is no alternative and the venue type justifies it.


---

## Review Intelligence

Korantis may only have limited Google reviews.

Therefore reviews should be used carefully.

Five Google reviews are not enough to fully understand a venue.

Review Intelligence should extract signals, not overfit.

### Inputs

```text
Google review snippets
External source mentions
Reddit snippets
Editorial context
Tripadvisor summary if available
```

### Extractable Signals

```json
{
  "quiet_signal": 0,
  "lively_signal": 0,
  "crowded_signal": 0,
  "service_signal": 0,
  "wifi_signal": 0,
  "work_signal": 0,
  "study_signal": 0,
  "date_signal": 0,
  "tourist_signal": 0,
  "local_signal": 0,
  "food_quality_signal": 0,
  "drink_quality_signal": 0,
  "price_complaint_signal": 0,
  "long_stay_signal": 0,
  "quick_stop_signal": 0
}
```

### Negative Evidence Matters

The system should explicitly store constraints:

```json
{
  "constraints": [
    "small space",
    "mostly takeaway",
    "crowded at peak hours",
    "tourist-heavy",
    "limited seating",
    "product-focused",
    "reservation required"
  ]
}
```

Negative evidence is critical for trust.


---

## Experience Signals

Experience signals describe the actual feel and use of the venue.

They are not final categories.

```json
{
  "quiet_signal": 0,
  "lively_signal": 0,
  "intimate_signal": 0,
  "social_signal": 0,
  "romantic_signal": 0,
  "work_friendly_signal": 0,
  "reading_signal": 0,
  "conversation_signal": 0,
  "long_stay_signal": 0,
  "quick_stop_signal": 0,
  "morning_signal": 0,
  "afternoon_signal": 0,
  "golden_hour_signal": 0,
  "night_signal": 0,
  "late_night_signal": 0,
  "creative_signal": 0,
  "formal_signal": 0,
  "casual_signal": 0
}
```

These signals can be inferred from:

- photos
- reviews
- source mentions
- opening hours
- category
- price level
- district identity
- cultural context

---

## Intent Scores

Intent scores answer:

> What is this venue good for?

Initial scores:

```json
{
  "work_score": 0,
  "reading_score": 0,
  "date_score": 0,
  "conversation_score": 0,
  "brunch_score": 0,
  "dinner_score": 0,
  "wine_score": 0,
  "cocktail_score": 0,
  "solo_score": 0,
  "friends_score": 0,
  "creative_session_score": 0,
  "classic_city_score": 0,
  "hidden_gem_score": 0,
  "premium_destination_score": 0,
  "quick_stop_score": 0,
  "long_stay_score": 0
}
```

### Work Score

Likely inputs:

```text
seating confidence
long-stay signal
quiet signal
wifi/work review signal
table visibility
natural light
crowding constraints
category fit
```

### Date Score

Likely inputs:

```text
intimacy
lighting
design quality
romantic signal
evening relevance
noise level
price/formality fit
```

### Classic City Score

Likely inputs:

```text
heritage signal
landmark signal
cultural relevance
review count
tourist signal
historic district fit
```

### Hidden Gem Score

Likely inputs:

```text
high experience quality
high community signal
low tourist signal
moderate/low mainstream signal
independent signal
source novelty
```

### Premium Destination Score

Likely inputs:

```text
Michelin / 50 Best / premium sources
luxury signal
high rating
high design or culinary score
price level
destination language in sources
```

A venue can have multiple strong intent scores.

A venue should not be forced into one category.


---

## Derived Archetypes

Archetypes are useful for UI and editorial language, but should be derived from signals.

Do not store them as permanent fixed facts unless the system stores them as derived outputs with versioning.

### Classic City Landmark

Signals:

```json
{
  "heritage_signal": 90,
  "landmark_signal": 80,
  "cultural_relevance_score": 90,
  "tourist_signal": 80
}
```

Possible examples:

```text
Cafe Tortoni
La Biela
Confiteria Las Violetas
```

### Specialty Work Café

Signals:

```json
{
  "specialty_signal": 90,
  "work_score": 80,
  "long_stay_score": 70,
  "community_signal": 70,
  "tourist_signal": 20
}
```

Possible examples:

```text
Cuervo
LAB
Lattente
```

### Emerging Independent Venue

Signals:

```json
{
  "novelty_signal": 80,
  "independent_signal": 85,
  "community_signal": 75,
  "tourist_signal": 10,
  "mainstream_signal": 20
}
```

### Premium Destination Restaurant

Signals:

```json
{
  "premium_destination_score": 90,
  "luxury_signal": 80,
  "source_authority_score": 90,
  "dinner_score": 85
}
```

### Tourist-Heavy Landmark

Signals:

```json
{
  "cultural_relevance_score": 90,
  "tourist_signal": 90,
  "heritage_signal": 80,
  "local_signal": 30
}
```

### Generic Mainstream Venue

Signals:

```json
{
  "mainstream_signal": 90,
  "chain_signal": 80,
  "experience_quality_score": 35,
  "specialty_signal": 20
}
```

Usually reject or downgrade unless there is branch-specific evidence.

### Night Atmosphere Venue

Signals:

```json
{
  "night_signal": 90,
  "cocktail_score": 80,
  "social_signal": 85,
  "design_signal": 75
}
```


---

## Eligibility Gate

Eligibility decides whether a venue can enter Korantis.

Technical completeness is not enough.

A venue can have all fields and still be rejected.

### Technical Completeness

Checks:

```text
Google Place ID exists
rating preserved if available
userRatingCount preserved if available
photos exist
reviews or source mentions exist
category exists
district exists
basic metadata exists
```

### Editorial Eligibility

Checks:

```text
discovery confidence
experience quality
photo quality
intent fit
cultural relevance
category fit
negative constraints
generic/chain risk
takeaway/product-only risk
```

### Statuses

```text
active
pending_review
rejected
```

For machine-scale architecture, `pending_review` should mean:

```text
not enough machine confidence yet
```

not:

```text
Truzt must manually review this forever
```

Manual review is allowed for calibration, not as a required operating model.

### Rejection / Downgrade Reasons

```text
takeaway-first
product-only
store-like
no seating signal
no acceptable hero photo
generic chain
weak atmosphere
weak discovery evidence
tourist-heavy but low experiential value
poor category fit
insufficient data
```


---

## Evidence Object

Every intelligence output should include evidence.

Example:

```json
{
  "evidence": {
    "source_evidence": [
      {
        "source": "Time Out",
        "signal": "editorial recommendation",
        "weight": 85
      }
    ],
    "photo_evidence": [
      {
        "photo_reference": "",
        "signals": ["interior_visible", "seating_visible", "natural_light"]
      }
    ],
    "review_evidence": [
      {
        "text": "good for working",
        "signals": ["work_signal", "long_stay_signal"]
      }
    ],
    "google_evidence": {
      "rating": 4.7,
      "review_count": 12000,
      "types": []
    },
    "constraints": [
      "tourist-heavy",
      "limited seating"
    ]
  }
}
```

Evidence prevents the system from inventing atmosphere.


---

## Venue Intelligence JSON Contract

The engine should output one structured object per venue.

Suggested contract:

```json
{
  "candidate_id": "",
  "google_place_id": "",
  "city": "",
  "district": "",
  "category": "",

  "scores": {
    "discovery_score": 0,
    "consensus_score": 0,
    "cultural_relevance_score": 0,
    "experience_quality_score": 0,
    "photo_quality_score": 0,
    "eligibility_score": 0
  },

  "signals": {
    "heritage_signal": 0,
    "landmark_signal": 0,
    "tourist_signal": 0,
    "local_signal": 0,
    "community_signal": 0,
    "specialty_signal": 0,
    "design_signal": 0,
    "novelty_signal": 0,
    "independent_signal": 0,
    "mainstream_signal": 0,
    "luxury_signal": 0,
    "hidden_signal": 0
  },

  "experience_signals": {
    "quiet_signal": 0,
    "lively_signal": 0,
    "intimate_signal": 0,
    "social_signal": 0,
    "romantic_signal": 0,
    "work_friendly_signal": 0,
    "reading_signal": 0,
    "conversation_signal": 0,
    "long_stay_signal": 0,
    "quick_stop_signal": 0,
    "morning_signal": 0,
    "afternoon_signal": 0,
    "golden_hour_signal": 0,
    "night_signal": 0
  },

  "intent_scores": {
    "work_score": 0,
    "reading_score": 0,
    "date_score": 0,
    "conversation_score": 0,
    "brunch_score": 0,
    "dinner_score": 0,
    "wine_score": 0,
    "cocktail_score": 0,
    "solo_score": 0,
    "friends_score": 0,
    "creative_session_score": 0,
    "classic_city_score": 0,
    "hidden_gem_score": 0,
    "premium_destination_score": 0
  },

  "photo_intelligence": {
    "acceptable_hero_photo": false,
    "hero_photo_reference": null,
    "photo_quality_score": 0,
    "interior_confidence": 0,
    "seating_confidence": 0,
    "long_stay_visual_signal": 0,
    "design_visual_signal": 0
  },

  "eligibility": {
    "status": "active | pending_review | rejected",
    "reasons": [],
    "warnings": []
  },

  "derived_archetypes": [
    {
      "name": "",
      "confidence": 0
    }
  ],

  "evidence": {
    "source_evidence": [],
    "photo_evidence": [],
    "review_evidence": [],
    "google_evidence": {},
    "constraints": []
  },

  "version": "venue_intelligence_v1"
}
```


---

## Database / Persistence Guidance

Implementation should be additive.

Do not modify public venue rendering.

Do not publish.

Do not change public.venues.

Suggested new tables or JSON fields may include:

```text
venue_intelligence
venue_photo_analysis
venue_intent_scores
venue_signal_evidence
```

Preferred early-stage approach:

```text
staging_venues
+
venue_intelligence JSON object
```

or a new additive table:

```text
staging_venue_intelligence
```

Recommended table:

```text
staging_venue_intelligence
```

Possible fields:

```text
id
staging_venue_id
candidate_id
google_place_id
city
district
category
scores jsonb
signals jsonb
experience_signals jsonb
intent_scores jsonb
photo_intelligence jsonb
eligibility jsonb
evidence jsonb
version
created_at
updated_at
```

Keep it additive.

No destructive migrations.


---

## Implementation Boundaries for Codex

When implementing Venue Intelligence, Codex must not:

```text
change UI
publish venues
modify public.venues
generate final marketing copy
replace the discovery engine
auto-promote candidates without explicit script rules
mix atmosphere prose with intelligence scoring
```

Codex may:

```text
create additive schema
create intelligence types
create scoring utilities
create photo analysis contracts
create review/source signal extraction contracts
create scripts to process a controlled subset
generate reports
```

Every script must identify which layer it belongs to:

```text
Discovery
Google Enrichment
Venue Intelligence
Intent Scoring
Eligibility
Atmosphere
Publishing
```

No script should mix layers.

---

## Suggested Implementation Phases

### Phase E.0 — Architecture and Types

Create:

```text
KORANTIS_VENUE_INTELLIGENCE_ARCHITECTURE.md
scripts/intelligence/types.ts
```

No processing yet.

### Phase E.1 — Schema

Create additive SQL:

```text
supabase/08_venue_intelligence_schema.sql
```

No migration execution unless explicitly requested.

### Phase E.2 — Cultural Relevance Scoring

Implement:

```text
review_count_log_score
source_authority_score
cultural_relevance_score
```

Inputs:

```text
candidate discovery data
Google rating
Google userRatingCount
source weights
```

### Phase E.3 — Source Signal Extraction

Extract from source mentions:

```text
heritage
tourist
local
community
specialty
premium
design
novelty
mainstream
```

### Phase E.4 — Photo Intelligence Contract

Define vision model prompt and JSON contract.

Do not process all venues yet.

Test on a small subset.

### Phase E.5 — Intent Score Drafting

Create scoring utilities for:

```text
work
reading
date
classic city
hidden gem
premium destination
cocktail
wine
dinner
```

### Phase E.6 — Eligibility Gate v2

Combine:

```text
technical completeness
cultural relevance
experience quality
photo quality
intent fit
negative constraints
```

Output:

```text
active
pending_review
rejected
```

### Phase E.7 — Controlled Pilot

Run only on a small subset of approved candidates.

Example:

```text
Top 10 cafes
Top 10 restaurants
Top 5 wine bars
Top 5 cocktail bars
```

No publication.


---

## Success Criteria

Venue Intelligence succeeds if the machine can distinguish:

```text
A famous place from a useful place
A beautiful place from a work-friendly place
A tourist landmark from a local gem
A specialty café from a generic café
A premium destination from a generic expensive restaurant
A culturally important venue from a Korantis-intent match
```

It also succeeds if the system can answer:

```text
Where should I work quietly with my notebook?
Where should I go for a classic city café?
Where should I go for a low-lit wine night?
Where should I go for a creative morning alone?
Where should I go for a first date?
Where should I go for a premium dinner?
```

without requiring manual review by the founder.

---

## Final Principle

Korantis does not win by having more places.

Korantis wins by understanding places better.

Venue Intelligence is the layer that turns a venue from a listing into a machine-readable urban experience.
