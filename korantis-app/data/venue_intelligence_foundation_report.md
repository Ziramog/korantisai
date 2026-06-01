# Venue Intelligence Foundation Report

Generated: 2026-05-31T22:07:52.011Z

## Scope

- Phase: E.0 / E.1 foundation only.
- No real candidates processed.
- No Google API calls.
- No LLM or vision calls.
- No publishing, staging promotion, or UI changes.

## Shape Validation

- VenueIntelligence contract valid for all mocks: yes
- Version: venue_intelligence_v1

## Mock Venue Results

### Classic landmark cafe

Assumptions: High review count; historic landmark signal; tourist-heavy constraints; not optimized for work

Scores: discovery 78, consensus 88, cultural relevance 90, source authority 81, photo quality 78, eligibility 71

Intent scores: work 18, reading 42, date 24, dinner 33, wine 15, cocktail 28, classic city 89, hidden gem 7, premium destination 36, long stay 30, quick stop 51

Eligibility: pending_review

Reasons: eligibility score 71 requires calibration or missing validation gates

Warnings: experience quality score is weak; constraint: tourist-heavy; constraint: crowded at peak hours

Derived archetypes: classic_city_landmark (93)

### Specialty work cafe

Assumptions: Strong specialty coffee evidence; community signal; seating and light support work intent

Scores: discovery 86, consensus 91, cultural relevance 59, source authority 88, photo quality 84, eligibility 79

Intent scores: work 83, reading 86, date 27, dinner 27, wine 37, cocktail 29, classic city 24, hidden gem 62, premium destination 51, long stay 80, quick stop 14

Eligibility: active

Reasons: strong enough for intelligence-level eligibility

Warnings: none

Derived archetypes: specialty_work_cafe (91)

### Premium destination restaurant

Assumptions: Premium editorial authority; dinner destination; not intended as work-friendly

Scores: discovery 90, consensus 95, cultural relevance 79, source authority 98, photo quality 88, eligibility 82

Intent scores: work 25, reading 23, date 76, dinner 97, wine 53, cocktail 56, classic city 41, hidden gem 21, premium destination 92, long stay 40, quick stop 18

Eligibility: pending_review

Reasons: eligibility score 82 requires calibration or missing validation gates

Warnings: constraint: reservation recommended

Derived archetypes: premium_destination (93)

### Tourist-heavy venue

Assumptions: High public footprint; tourism-dominant evidence; local fit uncertain

Scores: discovery 68, consensus 76, cultural relevance 81, source authority 75, photo quality 72, eligibility 66

Intent scores: work 22, reading 22, date 29, dinner 74, wine 22, cocktail 50, classic city 50, hidden gem 7, premium destination 54, long stay 36, quick stop 47

Eligibility: pending_review

Reasons: eligibility score 66 requires calibration or missing validation gates

Warnings: tourist-heavy with weak local fit; experience quality score is weak; constraint: tourist-heavy; constraint: possible low local fit

Derived archetypes: none

### Generic mainstream venue

Assumptions: High mainstream signal; weak experience quality; no acceptable hero photo

Scores: discovery 42, consensus 46, cultural relevance 55, source authority 65, photo quality 34, eligibility 38

Intent scores: work 26, reading 22, date 12, dinner 19, wine 12, cocktail 16, classic city 19, hidden gem 14, premium destination 28, long stay 28, quick stop 76

Eligibility: rejected

Reasons: no acceptable hero photo; product-only or storefront-only visual risk; photo quality too weak; generic chain/mainstream signal too high

Warnings: counter-only risk; seating signal is unclear; experience quality score is weak; constraint: generic chain/mainstream signal; constraint: product-focused imagery

Derived archetypes: generic_mainstream_risk (92)

## Intentionally Scaffolded

- Intent scores are deterministic v0 heuristics, not final ranking logic.
- Eligibility decisions are dry-run scaffold outputs and do not update database status.
- Photo intelligence uses mock structured inputs; no vision model was called.
- Cultural relevance separates public footprint from experience quality.
- Derived archetypes are versioned outputs from signals, not permanent editorial truth.