# Korantis Place Discovery Architecture v1.0

## Purpose

This document defines the canonical architecture for how Korantis discovers, evaluates, enriches, and selects venues.

Korantis is not a venue directory.

Korantis is an editorial atmosphere engine.

The goal is not to ingest every place from Google.

The goal is to build a scalable machine that can identify which places deserve attention, understand what kind of experience they offer, and decide where they belong inside Korantis.

---

## Core Principle

Google answers:

> What exists?

Korantis answers:

> What deserves attention, and for what kind of moment?

Therefore, Google Places must not be the primary discovery engine.

Google Places is an enrichment layer.

---

## High-Level Architecture

```text
Urban Geography Layer
↓
Curated Discovery Engine
↓
Candidate Universe
↓
Source Consensus Engine
↓
Cultural Relevance Engine
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

---

## 1. Urban Geography Layer

Korantis must understand cities by districts and neighborhoods.

The base hierarchy is:

```text
City
→ District / Neighborhood
→ Atmosphere / Intent
→ Venue
```

Not:

```text
City
→ Venue
```

Example for Buenos Aires:

- Palermo Soho
- Palermo Hollywood
- Recoleta
- San Telmo
- Puerto Madero
- Belgrano
- Colegiales
- Chacarita
- Villa Crespo
- Las Cañitas
- Retiro
- Microcentro
- Palermo Chico

Each district should store:

```json
{
  "city": "Buenos Aires",
  "district": "Palermo Soho",
  "priority": 95,
  "venue_target": 50,
  "district_identity_tags": [
    "creative",
    "design",
    "specialty_coffee",
    "trendy"
  ]
}
```

District coverage is mandatory.

If a district such as Las Cañitas or Puerto Madero has zero candidates, discovery is incomplete.

---

## 2. Discovery Engine

The Discovery Engine does not ask:

> Is this place on Google?

It asks:

> Is this place repeatedly mentioned by sources that suggest it may matter?

Sources may include:

### Editorial Sources

- Time Out
- Michelin
- 50 Best Discovery
- World's Best Bars
- Culture Trip
- Secret Buenos Aires
- Visit Buenos Aires
- local newspapers
- local lifestyle magazines
- specialty coffee guides
- wine guides
- cocktail guides
- restaurant guides

### Community Sources

- Reddit
- local blogs
- niche guides
- creator lists
- curated newsletters

### Travel / Popularity Sources

- Tripadvisor
- Wanderlog
- travel blogs
- hotel concierge guides

Tripadvisor should be included, but it must be weighted carefully because it often measures tourism popularity more than atmospheric quality.

---

## 3. Candidate Universe

The Discovery Engine creates `candidate_venues`.

Candidates are not venues yet.

They are places worth investigating.

Candidate statuses:

```text
discovered
pending_editorial_review
approved_for_enrichment
rejected
merged
```

Important rule:

No candidate should move to Google enrichment only because it exists.

It must have enough discovery evidence.

---

## 4. Source Consensus Engine

The Consensus Engine measures whether a candidate appears across independent sources.

Key metrics:

```json
{
  "source_count": 0,
  "editorial_mentions": 0,
  "community_mentions": 0,
  "travel_mentions": 0,
  "district_mentions": 0,
  "consensus_score": 0
}
```

Consensus is useful because one source can be noisy.

Repeated independent mention is stronger.

Example:

```text
Cuervo Cafe
→ Reddit
→ Specialty Coffee Blog
→ Time Out
→ Wanderlog
```

This is stronger than a single-source candidate.

---

## 5. Source Weighting

Not all sources are equal.

Source authority should be configurable.

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

These values are not final.

They should be stored in configuration and adjusted after audits.

---

## 6. Discovery Score

Discovery Score answers:

> Is this place important enough to investigate?

It should not answer:

> Is this place good for Korantis?

Suggested components:

```json
{
  "editorial_score": 0,
  "community_score": 0,
  "frequency_score": 0,
  "district_relevance_score": 0,
  "category_confidence_score": 0,
  "discovery_score": 0
}
```

Suggested weights:

```text
Editorial Authority      35%
Community Authority      20%
Frequency                20%
District Relevance       15%
Category Confidence      10%
```

Discovery Score should produce a candidate universe.

It should not be the final venue decision.

---

## 7. Cultural Relevance Engine

Google review count matters, but not as an atmosphere signal.

It is a cultural relevance signal.

A place with 12,000 reviews is not the same as a place with 50 reviews.

However:

```text
High review count ≠ high Korantis quality
```

Example:

```json
{
  "rating": 4.7,
  "review_count": 12000,
  "review_count_log_score": 94,
  "cultural_relevance_score": 88
}
```

Review count should be log-scaled.

Suggested model:

```text
50 reviews       → low relevance
500 reviews      → moderate relevance
5,000 reviews    → high relevance
50,000 reviews   → very high relevance
```

This should not be linear.

Cultural relevance must remain separate from experience quality.

Example:

```json
{
  "popularity_score": 95,
  "experience_score": 20
}
```

This could describe a massively popular but poor-fit venue.

Another example:

```json
{
  "popularity_score": 35,
  "experience_score": 90
}
```

This could describe a small but excellent hidden café.

Both may belong in Korantis, but for different reasons.

---

## 8. Google Places Enrichment

Google Places should enrich only approved candidates.

Google provides:

- Place ID
- rating
- userRatingCount
- categories
- opening hours
- address
- location
- website
- phone
- photos
- limited reviews
- price level

Google enrichment answers:

> What does Google know about this already-selected candidate?

It should not decide the candidate universe alone.

---

## 9. Venue Intelligence Engine

This is the most important layer for scaling Korantis.

It answers:

> What kind of experience does this place offer?

Inputs:

```text
Discovery signals
Google metadata
Google photos
Google review count
Google rating
Limited Google reviews
External source mentions
Vision model analysis
```

Outputs should be signals, not final labels.

Do not store rigid editorial labels too early.

Store evidence and scores.

---

## 10. Signal-Based Model

Do not store final categories such as:

```text
classic
emerging
contracultural
imperdible
hidden gem
```

as fixed truths.

Instead store underlying signals:

```json
{
  "heritage_signal": 0,
  "landmark_signal": 0,
  "tourist_signal": 0,
  "community_signal": 0,
  "specialty_signal": 0,
  "design_signal": 0,
  "novelty_signal": 0,
  "local_signal": 0,
  "independent_signal": 0,
  "luxury_signal": 0,
  "mainstream_signal": 0
}
```

Labels can be derived later.

Example:

High heritage + high cultural relevance + high tourist signal:

```text
classic city landmark
```

High specialty + high community + low tourist + high novelty:

```text
emerging specialty venue
```

Store signals.

Derive labels.

---

## 11. Intent / Experience Scoring

Korantis should rank venues by intent.

The machine must understand use cases.

Initial intent scores:

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
  "night_score": 0,
  "creative_score": 0,
  "long_stay_score": 0,
  "quick_stop_score": 0
}
```

Example:

A place can be culturally important but bad for working.

```json
{
  "cultural_relevance_score": 96,
  "work_score": 20,
  "heritage_signal": 95,
  "tourist_signal": 90
}
```

Another place can be less famous but perfect for working:

```json
{
  "cultural_relevance_score": 45,
  "work_score": 92,
  "community_signal": 88,
  "specialty_signal": 91
}
```

This distinction is central to Korantis.

---

## 12. Photo / Vision Analysis

Photo analysis is required before editorial eligibility.

A vision model should evaluate:

```json
{
  "interior_visible": true,
  "seating_visible": true,
  "counter_only": false,
  "product_only": false,
  "storefront_only": false,
  "natural_light": 80,
  "spatial_depth": 75,
  "design_quality": 85,
  "long_stay_potential": 90,
  "work_friendly_visual_signal": 80,
  "hero_photo_score": 88
}
```

A venue with no acceptable hero photo should not be published.

Product-only and storefront-only photos should not be used as hero images.

---

## 13. Editorial Eligibility Gate

This gate decides whether a place belongs in Korantis.

Technical completeness is not enough.

A venue can have:

- rating
- reviews
- photos
- prose
- embeddings

and still be rejected.

Eligibility should require:

```json
{
  "technical_completeness": true,
  "discovery_confidence": 0,
  "cultural_relevance_score": 0,
  "experience_quality_score": 0,
  "photo_quality_score": 0,
  "intent_fit_scores": {},
  "eligibility_score": 0,
  "status": "active | pending_review | rejected"
}
```

Reject or downgrade if:

- takeaway-first
- product-only
- store-like
- no seating signal
- weak atmosphere
- no acceptable hero photo
- chain/generic venue
- poor district/category fit

---

## 14. Separation of Scores

Korantis should never collapse all intelligence into one score too early.

Keep these separate:

```text
Discovery Score
Cultural Relevance Score
Experience Quality Score
Intent Scores
Photo Quality Score
Eligibility Score
Atmosphere Confidence
Korantis Rank Score
```

Each score answers a different question.

### Discovery Score

Is this place important enough to investigate?

### Cultural Relevance Score

Does this place matter in the city?

### Experience Quality Score

Does this place offer a meaningful atmosphere?

### Intent Scores

What is this place good for?

### Photo Quality Score

Can we visually represent this place well?

### Eligibility Score

Should this place be allowed into Korantis?

### Korantis Rank Score

Where should this place appear for a specific user intent?

---

## 15. Example Venue Archetypes

### Classic City Landmark

Example type:

```text
Cafe Tortoni / La Biela / Las Violetas
```

Likely signals:

```json
{
  "heritage_signal": 95,
  "tourist_signal": 85,
  "cultural_relevance_score": 95,
  "work_score": 25,
  "date_score": 55
}
```

Should it belong in Korantis?

Possibly yes.

But not as:

```text
best café for working
```

It belongs as:

```text
classic Buenos Aires café
historic atmosphere
cultural landmark
```

---

### Specialty Work Café

Example type:

```text
Cuervo / LAB / Lattente
```

Likely signals:

```json
{
  "specialty_signal": 95,
  "community_signal": 85,
  "work_score": 85,
  "long_stay_score": 75,
  "tourist_signal": 25
}
```

Belongs in:

```text
work cafés
specialty coffee
quiet morning
creative solo time
```

---

### Popular Generic Chain

Example type:

```text
Pani / La Panera Rosa
```

Likely signals:

```json
{
  "popularity_score": 70,
  "mainstream_signal": 90,
  "experience_quality_score": 35,
  "discovery_score": 30
}
```

Usually reject or downgrade unless a specific branch has strong evidence.

---

### Emerging / Countercultural Venue

Likely signals:

```json
{
  "novelty_signal": 85,
  "community_signal": 80,
  "independent_signal": 90,
  "tourist_signal": 10,
  "source_count": 1,
  "discovery_momentum": 80
}
```

Important caveat:

Emerging venues may have low review count and low source count.

The system must not reject them automatically.

They should be discovered through community signals, niche guides, local lists, and visual/experience quality.

---

## 16. Machine Over Manual Review

The goal is not to build a manual editorial workflow.

The goal is to build a machine.

Manual review is allowed only as:

```text
calibration
debugging
spot-checking
training signal
```

Manual review must not be required for city expansion.

If Korantis requires one person to manually approve every venue, the model does not scale.

The machine must eventually be able to process:

```text
Buenos Aires
New York
Mexico City
London
Tokyo
Paris
Barcelona
```

with the same architecture.

---

## 17. Current Phase Learnings

Phase D.6 audit showed:

```text
112 candidates
10 approved
80 questionable
22 rejected
7 candidates with discovery_score >= 60
80 candidates supported by only one source
```

This means:

- Consensus Engine is working.
- Source diversity is still too thin.
- District coverage is incomplete.
- Discovery alone is not enough.
- We need more sources and a Venue Intelligence layer.

---

## 18. Next Implementation Direction

Do not go directly to Google enrichment at scale.

Next steps:

### Step 1

Expand source coverage.

Add:

- Tripadvisor
- Michelin
- 50 Best Discovery
- World's Best Bars
- Culture Trip
- Secret Buenos Aires
- Visit Buenos Aires
- better local guides

### Step 2

Add source weighting.

### Step 3

Add district coverage scoring.

### Step 4

Preserve Google rating and userRatingCount during enrichment.

### Step 5

Add cultural relevance scoring using log-scaled review count.

### Step 6

Add Venue Intelligence Engine.

### Step 7

Add intent scores.

### Step 8

Only then begin controlled enrichment.

---

## 19. Codex Implementation Rule

Before modifying code, Codex should identify which layer is being worked on:

```text
Discovery
Consensus
Cultural Relevance
Google Enrichment
Venue Intelligence
Intent Scoring
Eligibility
Atmosphere
Publishing
```

No script should mix responsibilities across layers.

---

## 20. Final Product Principle

Korantis should not be a prettier Google Maps.

Korantis should be a machine that understands urban atmosphere.

The product wins if it can answer:

```text
Where should I go to work quietly with my notebook in Palermo?
Where should I go for a classic Buenos Aires café?
Where should I go for a low-lit wine night?
Where should I go for a creative morning alone?
Where should I go for a first date that feels intimate but not formal?
```

The architecture must support those answers.

