# Stage 00 Venue Seed Selection Report

- Batch: batch_011_buenos_aires_cafes_25_palermo_chacarita_recoleta
- Generated: 2026-06-08T14:42:09.065Z
- City: Buenos Aires
- Configured neighborhoods: Palermo, Chacarita, Recoleta
- Existing known venues indexed: 756
- Discovery mode: automated_google_places
- Total candidates discovered: 312
- Candidates after dedupe: 136
- Candidates after hard filters: 114
- Final selected count: 15
- Rejected count: 3
- Already-known excluded count: 19
- Existing sources checked: supabase:staging_venues, supabase:venues, local_batch:batch_003_stage01_test:stage_01, local_batch:batch_003_stage01_test:batch_result_with_editorial, local_batch:batch_003_stage01_test:batch_result_quality_gated, local_batch:batch_004_buenos_aires_50:venue_seed, local_batch:batch_004_buenos_aires_50:stage_01, local_batch:batch_004_buenos_aires_50:batch_result_with_editorial, local_batch:batch_004_buenos_aires_50:batch_result_quality_gated, local_batch:batch_005_buenos_aires_restaurants_50:venue_seed, local_batch:batch_005_buenos_aires_restaurants_50:stage_01, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_with_editorial, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_quality_gated, local_batch:batch_006_nyc_rooftop:venue_seed, local_batch:batch_006_nyc_rooftop:stage_01, local_batch:batch_006_nyc_rooftop:batch_result_with_editorial, local_batch:batch_006_nyc_rooftop:batch_result_quality_gated, local_batch:batch_008_new_york_cafes_25_williamsburg_dumbo_lower_east_side:venue_seed, local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:venue_seed, local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:stage_01, local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:batch_result_with_editorial, local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:batch_result_quality_gated

## Scoring Formula

`candidate_score = google_presence_score * 0.15 + review_volume_score * 0.10 + visual_strength_score * 0.18 + category_fit_score * 0.14 + neighborhood_balance_score * 0.08 + atmosphere_potential_score * 0.16 + source_diversity_score * 0.04 + local_identity_score * 0.10 + editorial_discovery_score * 0.08 - generic_chain_penalty * 0.13`

## Counts By Type

- cafe: 15

## Counts By Neighborhood

- Palermo: 5
- Chacarita: 5
- Recoleta: 5

## Selected Venues

| Name | Neighborhood | Type | Score | Selection Reason | Source Signals |
| --- | --- | --- | ---: | --- | --- |
| Moksha Café Studio | Palermo | cafe | 96.4 | score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query, editorial_source:lanacion_gastronomia, editorial_kind:local_editorial |
| Amelia Café de Especialidad | Chacarita | cafe | 96.4 | score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query, editorial_source:lanacion_gastronomia, editorial_kind:local_editorial, editorial_source:infobae_gastronomia |
| Inedito Coffee House | Chacarita | cafe | 96.4 | score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query |
| El Porta Café de Especialidad | Recoleta | cafe | 96.4 | score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query |
| Aromas Brunch & Coffee - Palermo | Palermo | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query |
| I Love Palermo Specialty Coffee | Palermo | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:infobae_gastronomia, editorial_kind:local_editorial, editorial_source_query |
| TRIBU Coffee & Roasters | Palermo | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Silvestre pan & café | Chacarita | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query |
| Olbia café de especialidad | Chacarita | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query |
| Inspire Café De Especialidad | Recoleta | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:lanacion_gastronomia, editorial_kind:local_editorial, editorial_source_query, editorial_source:infobae_gastronomia |
| Cat beans Coffee - Café de Especialidad | Recoleta | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Capsulas Kapselmaker | Recoleta | cafe | 92.2 | score=92.2; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Seattle Cafe | Palermo | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Pura - Café de Especialidad | Chacarita | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Sabores Puros | Recoleta | cafe | 91.5 | score=91.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=0.75; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:infobae_gastronomia, editorial_kind:local_editorial, editorial_source_query |

## Why These Are Korantis Venues

- Moksha Café Studio: cafe in Palermo; score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query, editorial_source:lanacion_gastronomia, editorial_kind:local_editorial
- Amelia Café de Especialidad: cafe in Chacarita; score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query, editorial_source:lanacion_gastronomia, editorial_kind:local_editorial, editorial_source:infobae_gastronomia
- Inedito Coffee House: cafe in Chacarita; score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query
- El Porta Café de Especialidad: cafe in Recoleta; score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query
- Aromas Brunch & Coffee - Palermo: cafe in Palermo; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_ba, editorial_kind:city_guide, editorial_source_query
- I Love Palermo Specialty Coffee: cafe in Palermo; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:infobae_gastronomia, editorial_kind:local_editorial, editorial_source_query
- TRIBU Coffee & Roasters: cafe in Palermo; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Silvestre pan & café: cafe in Chacarita; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query
- Olbia café de especialidad: cafe in Chacarita; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query
- Inspire Café De Especialidad: cafe in Recoleta; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:lanacion_gastronomia, editorial_kind:local_editorial, editorial_source_query, editorial_source:infobae_gastronomia
- Cat beans Coffee - Café de Especialidad: cafe in Recoleta; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Capsulas Kapselmaker: cafe in Recoleta; score=92.2; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Seattle Cafe: cafe in Palermo; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Pura - Café de Especialidad: cafe in Chacarita; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Sabores Puros: cafe in Recoleta; score=91.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=0.75; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:infobae_gastronomia, editorial_kind:local_editorial, editorial_source_query

## Rejected Candidates Summary

- MATT CAFE - Premium Roasters (Chacarita): low_evidence_quality
- Los Galgos Bar (Centro): missing_or_unsupported_neighborhood
- Sacro (Palermo): not_operational

## Already-Known Venues Excluded

- Vive Café Cafe de especialidad , cafés de campeonatos (Palermo): already_exists_name_city
- Kaldi (Palermo): already_exists_place_id, already_exists_name_city
- TERRASOHO - Specialty Coffee (Palermo): already_exists_name_city
- Rita Specialty Coffee Soler (Palermo): already_exists_name_city
- RITA® Specialty Coffee Armenia (Palermo): already_exists_place_id, already_exists_name_city
- Ciao Cacao Specialty coffee (Palermo): already_exists_name_city
- Backroom Bar (Palermo): already_exists_name_city
- The Hole Bar - Alcatraz Speakeasy Hidden Bar (Palermo): already_exists_name_city
- Ciro Palermo (Palermo): already_exists_place_id, already_exists_name_city
- Salvaje Bakery (Palermo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Cuervo Café (Chacarita): already_exists_name_city
- Roster Cafe Recoleta (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Bicho Café de Especialidad Recoleta (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- La Biela (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Tona Café (Recoleta): already_exists_name_city
- BORJA SPECIALTY COFFEE (Recoleta): already_exists_name_city
- Jardín de Invierno (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- El Preferido de Palermo (Palermo): already_exists_place_id, already_exists_name_city
- Toki Moment - Specialty Coffee (Recoleta): already_exists_name_city

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
- local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:venue_seed
- local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:stage_01
- local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:batch_result_with_editorial
- local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:batch_result_quality_gated

## Deviations From Target Mix

- cafes: selected 15, target 25

## Warnings

- selected_count_15_does_not_match_requested_25
- target_mix_deviation:cafes: selected 15, target 25

## Validation

- venue_seed.json contains exactly selected venues: 15
- every selected venue has name, neighborhood, and type
- duplicate normalized name + neighborhood removed
- existing Supabase/local batch venues excluded when detected

## Next Command

```powershell
npx tsx pipeline/run_full_batch.ts batch_011_buenos_aires_cafes_25_palermo_chacarita_recoleta
```
