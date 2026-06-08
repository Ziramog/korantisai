# Stage 00 Venue Seed Selection Report

- Batch: batch_006_nyc_rooftop
- Generated: 2026-06-08T03:00:20.367Z
- City: New York City
- Configured neighborhoods: Williamsburg, DUMBO, Brooklyn Bridge Park, Lower East Side, Bowery, NoMad, Flatiron, Chelsea, Meatpacking District, SoHo, Tribeca, Financial District, Seaport, Midtown, Times Square
- Existing known venues indexed: 583
- Discovery mode: semi_automated
- Total candidates discovered: 0
- Candidates after dedupe: 0
- Candidates after hard filters: 0
- Final selected count: 0
- Rejected count: 0
- Already-known excluded count: 0
- Existing sources checked: supabase:staging_venues, supabase:venues, local_batch:batch_003_stage01_test:stage_01, local_batch:batch_003_stage01_test:batch_result_with_editorial, local_batch:batch_003_stage01_test:batch_result_quality_gated, local_batch:batch_004_buenos_aires_50:venue_seed, local_batch:batch_004_buenos_aires_50:stage_01, local_batch:batch_004_buenos_aires_50:batch_result_with_editorial, local_batch:batch_004_buenos_aires_50:batch_result_quality_gated, local_batch:batch_005_buenos_aires_restaurants_50:venue_seed, local_batch:batch_005_buenos_aires_restaurants_50:stage_01, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_with_editorial, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_quality_gated

## Scoring Formula

`candidate_score = google_presence_score * 0.20 + review_volume_score * 0.15 + visual_strength_score * 0.20 + category_fit_score * 0.15 + neighborhood_balance_score * 0.10 + atmosphere_potential_score * 0.15 + source_diversity_score * 0.05`

## Counts By Type

- none

## Counts By Neighborhood

- none

## Selected Venues

| Name | Neighborhood | Type | Score | Selection Reason | Source Signals |
| --- | --- | --- | ---: | --- | --- |

## Why These Are Korantis Venues


## Rejected Candidates Summary


## Already-Known Venues Excluded

- none

## Sources Used

- supabase:staging_venues
- supabase:venues
- local_batch:batch_003_stage01_test:stage_01
- local_batch:batch_003_stage01_test:batch_result_with_editorial
- local_batch:batch_003_stage01_test:batch_result_quality_gated
- local_batch:batch_004_buenos_aires_50:venue_seed
- local_batch:batch_004_buenos_aires_50:stage_01
- local_batch:batch_004_buenos_aires_50:batch_result_with_editorial
- local_batch:batch_004_buenos_aires_50:batch_result_quality_gated
- local_batch:batch_005_buenos_aires_restaurants_50:venue_seed
- local_batch:batch_005_buenos_aires_restaurants_50:stage_01
- local_batch:batch_005_buenos_aires_restaurants_50:batch_result_with_editorial
- local_batch:batch_005_buenos_aires_restaurants_50:batch_result_quality_gated

## Deviations From Target Mix

- plan only; requested 12 venues

## Warnings

- plan_only_no_candidate_discovery_or_external_calls

## Validation

- venue_seed.json contains exactly selected venues: 0
- every selected venue has name, neighborhood, and type
- duplicate normalized name + neighborhood removed
- existing Supabase/local batch venues excluded when detected

## Next Command

```powershell
npx tsx pipeline/run_full_batch.ts batch_006_nyc_rooftop
```
