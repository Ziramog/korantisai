# Stage 00 Venue Seed Selection Report

- Batch: batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side
- Generated: 2026-06-08T13:10:28.487Z
- City: New York City
- Configured neighborhoods: Williamsburg, DUMBO, Lower East Side, NoMad, Chelsea, West Village
- Existing known venues indexed: 656
- Discovery mode: automated_google_places
- Total candidates discovered: 127
- Candidates after dedupe: 113
- Candidates after hard filters: 81
- Final selected count: 25
- Rejected count: 7
- Already-known excluded count: 25
- Existing sources checked: supabase:staging_venues, supabase:venues, local_batch:batch_003_stage01_test:stage_01, local_batch:batch_003_stage01_test:batch_result_with_editorial, local_batch:batch_003_stage01_test:batch_result_quality_gated, local_batch:batch_004_buenos_aires_50:venue_seed, local_batch:batch_004_buenos_aires_50:stage_01, local_batch:batch_004_buenos_aires_50:batch_result_with_editorial, local_batch:batch_004_buenos_aires_50:batch_result_quality_gated, local_batch:batch_005_buenos_aires_restaurants_50:venue_seed, local_batch:batch_005_buenos_aires_restaurants_50:stage_01, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_with_editorial, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_quality_gated, local_batch:batch_006_nyc_rooftop:venue_seed, local_batch:batch_006_nyc_rooftop:stage_01, local_batch:batch_006_nyc_rooftop:batch_result_with_editorial, local_batch:batch_006_nyc_rooftop:batch_result_quality_gated, local_batch:batch_008_new_york_cafes_25_williamsburg_dumbo_lower_east_side:venue_seed

## Scoring Formula

`candidate_score = google_presence_score * 0.20 + review_volume_score * 0.15 + visual_strength_score * 0.20 + category_fit_score * 0.15 + neighborhood_balance_score * 0.10 + atmosphere_potential_score * 0.15 + source_diversity_score * 0.05`

## Counts By Type

- cafe: 9
- bakery_cafe: 16

## Counts By Neighborhood

- Lower East Side: 4
- Chelsea: 4
- West Village: 4
- Williamsburg: 5
- DUMBO: 4
- NoMad: 4

## Selected Venues

| Name | Neighborhood | Type | Score | Selection Reason | Source Signals |
| --- | --- | --- | ---: | --- | --- |
| Paper Sons Cafe | Lower East Side | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Café Colmado | Lower East Side | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Yanni's Coffee | Chelsea | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Sip Coffee & Matcha | Chelsea | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Intelligentsia Coffee High Line Hotel Coffeebar | Chelsea | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| RHYTHM ZERO \| WEST VILLAGE | West Village | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Bakeri | Williamsburg | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| A&C Super | Williamsburg | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Paris Baguette | Williamsburg | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Black Star Bakery & Cafe | Williamsburg | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Dawn’s Til Dusk | DUMBO | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Tous Les Jours | DUMBO | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Almondine Bakery | DUMBO | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Burrow | DUMBO | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Rex | Lower East Side | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Kaida Coffee and Bakery | Lower East Side | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Bourke Street Bakery | NoMad | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| La Bergamote (Chelsea) | Chelsea | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Claude Bakery West Village | West Village | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| maman | West Village | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Aux Merveilleux de Fred | West Village | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| maman | NoMad | cafe | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Stumptown Coffee Roasters | NoMad | cafe | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Pura Vida - NoMad | NoMad | cafe | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Nick + Sons Bakery | Williamsburg | bakery_cafe | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |

## Why These Are Korantis Venues

- Paper Sons Cafe: cafe in Lower East Side; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Café Colmado: cafe in Lower East Side; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Yanni's Coffee: cafe in Chelsea; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Sip Coffee & Matcha: cafe in Chelsea; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Intelligentsia Coffee High Line Hotel Coffeebar: cafe in Chelsea; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- RHYTHM ZERO | WEST VILLAGE: cafe in West Village; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Bakeri: bakery_cafe in Williamsburg; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- A&C Super: bakery_cafe in Williamsburg; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Paris Baguette: bakery_cafe in Williamsburg; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Black Star Bakery & Cafe: bakery_cafe in Williamsburg; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Dawn’s Til Dusk: bakery_cafe in DUMBO; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Tous Les Jours: bakery_cafe in DUMBO; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Almondine Bakery: bakery_cafe in DUMBO; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Burrow: bakery_cafe in DUMBO; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Rex: bakery_cafe in Lower East Side; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Kaida Coffee and Bakery: bakery_cafe in Lower East Side; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Bourke Street Bakery: bakery_cafe in NoMad; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- La Bergamote (Chelsea): bakery_cafe in Chelsea; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Claude Bakery West Village: bakery_cafe in West Village; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- maman: bakery_cafe in West Village; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Aux Merveilleux de Fred: bakery_cafe in West Village; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- maman: cafe in NoMad; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Stumptown Coffee Roasters: cafe in NoMad; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Pura Vida - NoMad: cafe in NoMad; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Nick + Sons Bakery: bakery_cafe in Williamsburg; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal

## Rejected Candidates Summary

- Hole In The Wall Cafe - Lower East Side (Lower East Side): low_evidence_quality
- Presidente Bar (Recoleta): missing_or_unsupported_neighborhood
- Tres Monos (Palermo): missing_or_unsupported_neighborhood
- Los Galgos Bar (Centro): missing_or_unsupported_neighborhood
- La Fuerza (Chacarita): missing_or_unsupported_neighborhood
- Cochinchina (Palermo): missing_or_unsupported_neighborhood
- Caffé Palermo (Palermo): missing_or_unsupported_neighborhood

## Already-Known Venues Excluded

- Blue Brown Cafe (Williamsburg): already_exists_name_neighborhood, already_exists_name_city
- 11:11 Cafe (Williamsburg): already_exists_name_neighborhood, already_exists_name_city
- Devoción (Williamsburg): already_exists_name_city
- Copper Mug Coffee (Williamsburg): already_exists_name_neighborhood, already_exists_name_city
- Caffè Valencia (Williamsburg): already_exists_name_neighborhood, already_exists_name_city
- Butler (Williamsburg): already_exists_name_city
- Butler (DUMBO): already_exists_name_neighborhood, already_exists_name_city
- Devoción (DUMBO): already_exists_name_neighborhood, already_exists_name_city
- Pura Vida - Dumbo (DUMBO): already_exists_name_neighborhood, already_exists_name_city
- Red Coffee Stand (DUMBO): already_exists_name_neighborhood, already_exists_name_city
- Black Cat LES (Lower East Side): already_exists_name_neighborhood, already_exists_name_city
- A’more Caffe & Matcha - East Village (Lower East Side): already_exists_name_neighborhood, already_exists_name_city
- Café Grumpy - Lower East Side (Lower East Side): already_exists_name_neighborhood, already_exists_name_city
- Copper Mug Coffee (NoMad): already_exists_name_neighborhood, already_exists_name_city
- Angelina Bakery Nomad (NoMad): already_exists_name_neighborhood, already_exists_name_city
- NY Bakery and Desserts NoMad (NoMad): already_exists_name_neighborhood, already_exists_name_city
- Dominique Ansel Workshop (NoMad): already_exists_name_neighborhood, already_exists_name_city
- Urbana Cafe and Gallery (Chelsea): already_exists_name_neighborhood, already_exists_name_city
- Bluestone Lane Chelsea Piers Café (Chelsea): already_exists_name_neighborhood, already_exists_name_city
- Café-Flor / Bar 21 (Chelsea): already_exists_name_neighborhood, already_exists_name_city
- Fellini Coffee Chelsea (Chelsea): already_exists_name_neighborhood, already_exists_name_city
- Cafe Luna (West Village): already_exists_name_neighborhood, already_exists_name_city
- Hungry Llama (West Village): already_exists_name_neighborhood, already_exists_name_city
- 11th Street Cafe (West Village): already_exists_name_neighborhood, already_exists_name_city
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
- local_batch:batch_008_new_york_cafes_25_williamsburg_dumbo_lower_east_side:venue_seed

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
npx tsx pipeline/run_full_batch.ts batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side
```
