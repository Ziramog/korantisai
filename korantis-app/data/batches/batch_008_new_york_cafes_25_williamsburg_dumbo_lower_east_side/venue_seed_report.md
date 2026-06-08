# Stage 00 Venue Seed Selection Report

- Batch: batch_008_new_york_cafes_25_williamsburg_dumbo_lower_east_side
- Generated: 2026-06-08T12:56:31.788Z
- City: New York City
- Configured neighborhoods: Williamsburg, DUMBO, Lower East Side, NoMad, Chelsea, West Village
- Existing known venues indexed: 631
- Discovery mode: automated_google_places
- Total candidates discovered: 127
- Candidates after dedupe: 113
- Candidates after hard filters: 105
- Final selected count: 25
- Rejected count: 7
- Already-known excluded count: 1
- Existing sources checked: supabase:staging_venues, supabase:venues, local_batch:batch_003_stage01_test:stage_01, local_batch:batch_003_stage01_test:batch_result_with_editorial, local_batch:batch_003_stage01_test:batch_result_quality_gated, local_batch:batch_004_buenos_aires_50:venue_seed, local_batch:batch_004_buenos_aires_50:stage_01, local_batch:batch_004_buenos_aires_50:batch_result_with_editorial, local_batch:batch_004_buenos_aires_50:batch_result_quality_gated, local_batch:batch_005_buenos_aires_restaurants_50:venue_seed, local_batch:batch_005_buenos_aires_restaurants_50:stage_01, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_with_editorial, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_quality_gated, local_batch:batch_006_nyc_rooftop:venue_seed, local_batch:batch_006_nyc_rooftop:stage_01, local_batch:batch_006_nyc_rooftop:batch_result_with_editorial, local_batch:batch_006_nyc_rooftop:batch_result_quality_gated

## Scoring Formula

`candidate_score = google_presence_score * 0.20 + review_volume_score * 0.15 + visual_strength_score * 0.20 + category_fit_score * 0.15 + neighborhood_balance_score * 0.10 + atmosphere_potential_score * 0.15 + source_diversity_score * 0.05`

## Counts By Type

- cafe: 16
- bakery_cafe: 9

## Counts By Neighborhood

- Williamsburg: 4
- DUMBO: 4
- Lower East Side: 5
- NoMad: 4
- Chelsea: 4
- West Village: 4

## Selected Venues

| Name | Neighborhood | Type | Score | Selection Reason | Source Signals |
| --- | --- | --- | ---: | --- | --- |
| 11:11 Cafe | Williamsburg | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Caffè Valencia | Williamsburg | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Devoción | DUMBO | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Pura Vida - Dumbo | DUMBO | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Red Coffee Stand | DUMBO | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Dialogue Coffee & Flowers | Lower East Side | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Black Cat LES | Lower East Side | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Café Grumpy - Lower East Side | Lower East Side | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| A’more Caffe & Matcha - East Village | Lower East Side | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Copper Mug Coffee | NoMad | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Urbana Cafe and Gallery | Chelsea | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Bluestone Lane Chelsea Piers Café | Chelsea | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Café-Flor / Bar 21 | Chelsea | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Fellini Coffee Chelsea | Chelsea | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Hungry Llama | West Village | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Blue Brown Cafe | Williamsburg | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Copper Mug Coffee | Williamsburg | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Butler | DUMBO | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Angelina Bakery Nomad | NoMad | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| NY Bakery and Desserts NoMad | NoMad | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Dominique Ansel Workshop | NoMad | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Cafe Luna | West Village | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| 11th Street Cafe | West Village | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Bedford Studio | West Village | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Ludlow Coffee Supply | Lower East Side | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |

## Why These Are Korantis Venues

- 11:11 Cafe: cafe in Williamsburg; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Caffè Valencia: cafe in Williamsburg; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Devoción: cafe in DUMBO; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Pura Vida - Dumbo: cafe in DUMBO; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Red Coffee Stand: cafe in DUMBO; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Dialogue Coffee & Flowers: cafe in Lower East Side; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Black Cat LES: cafe in Lower East Side; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Café Grumpy - Lower East Side: cafe in Lower East Side; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- A’more Caffe & Matcha - East Village: cafe in Lower East Side; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Copper Mug Coffee: cafe in NoMad; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Urbana Cafe and Gallery: cafe in Chelsea; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Bluestone Lane Chelsea Piers Café: cafe in Chelsea; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Café-Flor / Bar 21: cafe in Chelsea; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Fellini Coffee Chelsea: cafe in Chelsea; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Hungry Llama: cafe in West Village; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Blue Brown Cafe: bakery_cafe in Williamsburg; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Copper Mug Coffee: bakery_cafe in Williamsburg; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Butler: bakery_cafe in DUMBO; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Angelina Bakery Nomad: bakery_cafe in NoMad; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- NY Bakery and Desserts NoMad: bakery_cafe in NoMad; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Dominique Ansel Workshop: bakery_cafe in NoMad; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Cafe Luna: bakery_cafe in West Village; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- 11th Street Cafe: bakery_cafe in West Village; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Bedford Studio: bakery_cafe in West Village; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Ludlow Coffee Supply: cafe in Lower East Side; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal

## Rejected Candidates Summary

- Hole In The Wall Cafe - Lower East Side (Lower East Side): low_evidence_quality
- Presidente Bar (Recoleta): missing_or_unsupported_neighborhood
- Tres Monos (Palermo): missing_or_unsupported_neighborhood
- Los Galgos Bar (Centro): missing_or_unsupported_neighborhood
- La Fuerza (Chacarita): missing_or_unsupported_neighborhood
- Cochinchina (Palermo): missing_or_unsupported_neighborhood
- Caffé Palermo (Palermo): missing_or_unsupported_neighborhood

## Already-Known Venues Excluded

- El Preferido de Palermo (Palermo): missing_or_unsupported_neighborhood, already_exists_place_id

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
- local_batch:batch_006_nyc_rooftop:venue_seed
- local_batch:batch_006_nyc_rooftop:stage_01
- local_batch:batch_006_nyc_rooftop:batch_result_with_editorial
- local_batch:batch_006_nyc_rooftop:batch_result_quality_gated

## Deviations From Target Mix

- none

## Warnings

- none

## Validation

- venue_seed.json contains exactly selected venues: 25
- every selected venue has name, neighborhood, and type
- duplicate normalized name + neighborhood removed
- existing Supabase/local batch venues excluded when detected

## Next Command

```powershell
npx tsx pipeline/run_full_batch.ts batch_008_new_york_cafes_25_williamsburg_dumbo_lower_east_side
```
