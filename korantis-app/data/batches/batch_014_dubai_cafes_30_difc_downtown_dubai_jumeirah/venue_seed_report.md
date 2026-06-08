# Stage 00 Venue Seed Selection Report

- Batch: batch_014_dubai_cafes_30_difc_downtown_dubai_jumeirah
- Generated: 2026-06-08T14:45:17.202Z
- City: Dubai
- Configured neighborhoods: DIFC, Downtown Dubai, Jumeirah, Dubai Marina, Palm Jumeirah, Business Bay
- Existing known venues indexed: 756
- Discovery mode: automated_google_places
- Total candidates discovered: 554
- Candidates after dedupe: 213
- Candidates after hard filters: 204
- Final selected count: 30
- Rejected count: 8
- Already-known excluded count: 1
- Existing sources checked: supabase:staging_venues, supabase:venues, local_batch:batch_003_stage01_test:stage_01, local_batch:batch_003_stage01_test:batch_result_with_editorial, local_batch:batch_003_stage01_test:batch_result_quality_gated, local_batch:batch_004_buenos_aires_50:venue_seed, local_batch:batch_004_buenos_aires_50:stage_01, local_batch:batch_004_buenos_aires_50:batch_result_with_editorial, local_batch:batch_004_buenos_aires_50:batch_result_quality_gated, local_batch:batch_005_buenos_aires_restaurants_50:venue_seed, local_batch:batch_005_buenos_aires_restaurants_50:stage_01, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_with_editorial, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_quality_gated, local_batch:batch_006_nyc_rooftop:venue_seed, local_batch:batch_006_nyc_rooftop:stage_01, local_batch:batch_006_nyc_rooftop:batch_result_with_editorial, local_batch:batch_006_nyc_rooftop:batch_result_quality_gated, local_batch:batch_008_new_york_cafes_25_williamsburg_dumbo_lower_east_side:venue_seed, local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:venue_seed, local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:stage_01, local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:batch_result_with_editorial, local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:batch_result_quality_gated

## Scoring Formula

`candidate_score = google_presence_score * 0.15 + review_volume_score * 0.10 + visual_strength_score * 0.18 + category_fit_score * 0.14 + neighborhood_balance_score * 0.08 + atmosphere_potential_score * 0.16 + source_diversity_score * 0.04 + local_identity_score * 0.10 + editorial_discovery_score * 0.08 - generic_chain_penalty * 0.13`

## Counts By Type

- cafe: 28
- bakery_cafe: 2

## Counts By Neighborhood

- Downtown Dubai: 5
- Jumeirah: 5
- Dubai Marina: 5
- Palm Jumeirah: 5
- DIFC: 5
- Business Bay: 5

## Selected Venues

| Name | Neighborhood | Type | Score | Selection Reason | Source Signals |
| --- | --- | --- | ---: | --- | --- |
| Caju Coffee House | Downtown Dubai | cafe | 96.4 | score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Kulture House Dubai | Jumeirah | cafe | 96.4 | score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query |
| Roasters Specialty Coffee House Emaar Beachfront | Dubai Marina | cafe | 96.4 | score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query |
| Mokha 1450 Coffee Lounge | Palm Jumeirah | cafe | 96.4 | score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Roasters Specialty Coffee House Palm Jumeirah Mall | Palm Jumeirah | cafe | 96.4 | score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Cafe Wayfarer | DIFC | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Orijins | DIFC | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query |
| Have Coffee - DIFC | DIFC | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Coffee Planet - Foundry Downtown | Downtown Dubai | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query |
| The Coffee Merchant | Downtown Dubai | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Roast Speciality Coffee, Marina | Dubai Marina | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query |
| Drinkit | Dubai Marina | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Summer Soul Boutique - West Beach | Palm Jumeirah | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Brews Cafe | Business Bay | cafe | 95.4 | score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Roasters Specialty Coffee House Al Wasl | DIFC | cafe | 94.6 | score=94.6; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Risen Café and Artisanal Bakery, Palm Jumeirah | Jumeirah | bakery_cafe | 94.28 | score=94.28; google=1.00; visual=1.00; category=0.82; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| Risen Café and Artisanal Bakery, Business Bay | Business Bay | bakery_cafe | 94.28 | score=94.28; google=1.00; visual=1.00; category=0.82; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial |
| % ARABICA DIFC LIMESTONE HOUSE | DIFC | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Boon Coffee Roasters Downtown | Downtown Dubai | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Caffeine Coffee Roaster | Downtown Dubai | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| MOY SPECIALTY COFFEE | Jumeirah | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Roasters Specialty Coffee House Dubai Hills | Jumeirah | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| The lost Restaurant and Specialty coffee | Dubai Marina | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Fuze Cafe Marina \| Specialty Coffee | Dubai Marina | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query |
| Boon Coffee Roasters - Palm Jumeirah Mall | Palm Jumeirah | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| % ARABICA DUBAI ROASTERY | Palm Jumeirah | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Roasters Specialty Coffee House Sobha Hartland | Business Bay | cafe | 94 | score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Ores Cafe | Jumeirah | cafe | 93.4 | score=93.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.70; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query |
| Kimi - Speciality Coffee and Food | Business Bay | cafe | 91.5 | score=91.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=0.75; editorial=0.75 | google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query |
| Circle Cafe (Bay Square) | Business Bay | cafe | 90.6 | score=90.6; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.60; editorial=0.75; curated_boost | google_places, official_website_from_google, google_photo_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query |

## Why These Are Korantis Venues

- Caju Coffee House: cafe in Downtown Dubai; score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Kulture House Dubai: cafe in Jumeirah; score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query
- Roasters Specialty Coffee House Emaar Beachfront: cafe in Dubai Marina; score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query
- Mokha 1450 Coffee Lounge: cafe in Palm Jumeirah; score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Roasters Specialty Coffee House Palm Jumeirah Mall: cafe in Palm Jumeirah; score=96.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Cafe Wayfarer: cafe in DIFC; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Orijins: cafe in DIFC; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query
- Have Coffee - DIFC: cafe in DIFC; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Coffee Planet - Foundry Downtown: cafe in Downtown Dubai; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query
- The Coffee Merchant: cafe in Downtown Dubai; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Roast Speciality Coffee, Marina: cafe in Dubai Marina; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query
- Drinkit: cafe in Dubai Marina; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Summer Soul Boutique - West Beach: cafe in Palm Jumeirah; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Brews Cafe: cafe in Business Bay; score=95.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Roasters Specialty Coffee House Al Wasl: cafe in DIFC; score=94.6; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=1.00; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Risen Café and Artisanal Bakery, Palm Jumeirah: bakery_cafe in Jumeirah; score=94.28; google=1.00; visual=1.00; category=0.82; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- Risen Café and Artisanal Bakery, Business Bay: bakery_cafe in Business Bay; score=94.28; google=1.00; visual=1.00; category=0.82; atmosphere=0.95; local=0.90; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query, editorial_source:whats_on_dubai, editorial_kind:local_editorial
- % ARABICA DIFC LIMESTONE HOUSE: cafe in DIFC; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Boon Coffee Roasters Downtown: cafe in Downtown Dubai; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Caffeine Coffee Roaster: cafe in Downtown Dubai; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- MOY SPECIALTY COFFEE: cafe in Jumeirah; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Roasters Specialty Coffee House Dubai Hills: cafe in Jumeirah; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- The lost Restaurant and Specialty coffee: cafe in Dubai Marina; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Fuze Cafe Marina | Specialty Coffee: cafe in Dubai Marina; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query, atmosphere_query
- Boon Coffee Roasters - Palm Jumeirah Mall: cafe in Palm Jumeirah; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- % ARABICA DUBAI ROASTERY: cafe in Palm Jumeirah; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Roasters Specialty Coffee House Sobha Hartland: cafe in Business Bay; score=94; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=1.00; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Ores Cafe: cafe in Jumeirah; score=93.4; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.70; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, editorial_discovery_query, atmosphere_query, editorial_source_query_candidate, editorial_source:timeout_dubai, editorial_kind:city_guide, editorial_source_query
- Kimi - Speciality Coffee and Food: cafe in Business Bay; score=91.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; local=0.75; editorial=0.75; signals google_places, official_website_from_google, google_photo_signal, local_identity_signal, editorial_discovery_query
- Circle Cafe (Bay Square): cafe in Business Bay; score=90.6; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; local=0.60; editorial=0.75; curated_boost; signals google_places, official_website_from_google, google_photo_signal, editorial_discovery_query, editorial_source_query_candidate, editorial_source:whats_on_dubai, editorial_kind:local_editorial, editorial_source_query

## Rejected Candidates Summary

- Kurasu DIFC (DIFC): low_evidence_quality
- Baristas' Corner The Palm Jumeirah (Palm Jumeirah): low_evidence_quality
- Presidente Bar (Recoleta): missing_or_unsupported_neighborhood
- Tres Monos (Palermo): missing_or_unsupported_neighborhood
- Los Galgos Bar (Centro): missing_or_unsupported_neighborhood
- La Fuerza (Chacarita): missing_or_unsupported_neighborhood
- Cochinchina (Palermo): missing_or_unsupported_neighborhood
- Sacro (Palermo): missing_or_unsupported_neighborhood, missing_google_place_id, missing_coordinates, missing_rating, missing_review_count, no_photo_signal

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
- local_batch:batch_008_new_york_cafes_25_williamsburg_dumbo_lower_east_side:venue_seed
- local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:venue_seed
- local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:stage_01
- local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:batch_result_with_editorial
- local_batch:batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side:batch_result_quality_gated

## Deviations From Target Mix

- none

## Warnings

- none

## Validation

- venue_seed.json contains exactly selected venues: 30
- every selected venue has name, neighborhood, and type
- duplicate normalized name + neighborhood removed
- existing Supabase/local batch venues excluded when detected

## Next Command

```powershell
npx tsx pipeline/run_full_batch.ts batch_014_dubai_cafes_30_difc_downtown_dubai_jumeirah
```
