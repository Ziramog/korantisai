# Korantis Buenos Aires Ingestion - Phase A Validation

Generated after running the existing staging ingestion pipeline for 10 Buenos Aires venues.

## Scope

- Target: 10 Buenos Aires venues
- Composition target: 5 cafes, 3 restaurants, 1 wine bar, 1 cocktail bar
- Publish behavior: no records published into `public.venues`
- Staging status flow used: `pending -> processing -> ready_for_review`
- Schema policy: no migrations; existing hybrid schema preserved

## Pipeline Run

1. `scripts/ingestion/0_discover_ba50.ts --phase=A`
2. `scripts/ingestion/1_fetch_places.ts`
3. `scripts/ingestion/2_fetch_reviews.ts`
4. `scripts/ingestion/3_extract_atmosphere.ts`
5. `scripts/ingestion/4_generate_embeddings.ts`
6. `scripts/ingestion/5_resonance_analysis.ts`
7. `scripts/ingestion/6_quality_check.ts`

## Discovery Summary

- Text Search queries executed: 4
- Venues selected: 10
- Duplicate Google Place IDs skipped: 7
- Repeated branches skipped: 0
- Obvious chains skipped: 0
- API errors: 0

The discovery run did not persist raw candidate totals beyond the selected/skipped counters. Future Phase B reporting should persist raw candidate counts if exact discovery funnel metrics are required.

## Category Breakdown

| Category | Count | Target |
| --- | ---: | ---: |
| cafe | 5 | 5 |
| restaurant | 3 | 3 |
| wine_bar | 1 | 1 |
| cocktail_bar | 1 | 1 |

## Validation Summary

| Metric | Count |
| --- | ---: |
| Staging records created for Phase A | 10 |
| `ready_for_review` | 10 |
| Venues with reviews | 10 |
| Venues with atmospheric prose | 10 |
| Venues with L3 embeddings | 10 |
| Venues with photo references | 10 |
| Venues with insufficient L2 for resonance | 10 |
| Venues with computed resonance | 0 |
| Average validation completeness score | 1.00 |

Quality check now requires reviews, atmosphere prose, and embeddings. Resonance is not required for `ready_for_review`.

## Venue Results

| Venue | Category | Status | Reviews | Photos | Prose Words | L3 Embeddings | Resonance |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Import Coffee Co. | cafe | ready_for_review | 5 | 10 | 152 | 1 | insufficient_l2 |
| Kaldi | cafe | ready_for_review | 5 | 10 | 148 | 1 | insufficient_l2 |
| Koofi | Cafe de especialidad | cafe | ready_for_review | 5 | 10 | 138 | 1 | insufficient_l2 |
| Origen Coffee House | cafe | ready_for_review | 3 | 10 | 135 | 1 | insufficient_l2 |
| RITA Specialty Coffee Armenia | cafe | ready_for_review | 5 | 10 | 139 | 1 | insufficient_l2 |
| Don Julio Parrilla | restaurant | ready_for_review | 5 | 10 | 131 | 1 | insufficient_l2 |
| El Preferido de Palermo | restaurant | ready_for_review | 5 | 10 | 131 | 1 | insufficient_l2 |
| Ciro Palermo | restaurant | ready_for_review | 5 | 10 | 147 | 1 | insufficient_l2 |
| Wine Window Argentina (Palermo Soho) | wine_bar | ready_for_review | 5 | 10 | 133 | 1 | insufficient_l2 |
| CICHAUS | cocktail_bar | ready_for_review | 5 | 10 | 141 | 1 | insufficient_l2 |

## Schema Notes

- Google Place ID is stored as `staging_venues.id`.
- Google Places details are stored in `staging_venues.canonical_data`.
- `quality_scores` does not have a `resonance_status` column. Per the no-migration constraint, missing L2 is recorded as `interpretation_notes = "resonance_status: insufficient_l2"` with `resonance_score = null`.
- `1_fetch_places.ts` currently overwrites `canonical_data` with Place Details fields that do not include `rating` or `userRatingCount`. The Phase A records therefore validate details/photos/reviews/prose/embeddings, but rating and total Google review count are not preserved after Step 1.

## Phase A Result

Phase A passed the requested validation gates:

- 10 unique Buenos Aires venues are in staging.
- 10 have review data.
- 10 have generated atmospheric prose.
- 10 have L3 embeddings.
- 10 successful venues are marked `ready_for_review`.
- No venues were published.

Recommended decision before Phase B: approve a minimal update to `1_fetch_places.ts` so Place Details preserves `rating`, `userRatingCount`, and any other canonical fields needed in `canonical_data` during the 50-venue run.
