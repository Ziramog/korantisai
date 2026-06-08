# Stage 00 Venue Seed Selection Report

- Batch: batch_006_nyc_rooftop
- Generated: 2026-06-08T03:02:22.903Z
- City: New York City
- Configured neighborhoods: Williamsburg, DUMBO, Brooklyn Bridge Park, Lower East Side, Bowery, NoMad, Flatiron, Chelsea, Meatpacking District, SoHo, Tribeca, Financial District, Seaport, Midtown, Times Square
- Existing known venues indexed: 583
- Discovery mode: automated_google_places
- Total candidates discovered: 1636
- Candidates after dedupe: 728
- Candidates after hard filters: 508
- Final selected count: 12
- Rejected count: 219
- Already-known excluded count: 1
- Existing sources checked: supabase:staging_venues, supabase:venues, local_batch:batch_003_stage01_test:stage_01, local_batch:batch_003_stage01_test:batch_result_with_editorial, local_batch:batch_003_stage01_test:batch_result_quality_gated, local_batch:batch_004_buenos_aires_50:venue_seed, local_batch:batch_004_buenos_aires_50:stage_01, local_batch:batch_004_buenos_aires_50:batch_result_with_editorial, local_batch:batch_004_buenos_aires_50:batch_result_quality_gated, local_batch:batch_005_buenos_aires_restaurants_50:venue_seed, local_batch:batch_005_buenos_aires_restaurants_50:stage_01, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_with_editorial, local_batch:batch_005_buenos_aires_restaurants_50:batch_result_quality_gated

## Scoring Formula

`candidate_score = google_presence_score * 0.20 + review_volume_score * 0.15 + visual_strength_score * 0.20 + category_fit_score * 0.15 + neighborhood_balance_score * 0.10 + atmosphere_potential_score * 0.15 + source_diversity_score * 0.05`

## Counts By Type

- wine_bar: 12

## Counts By Neighborhood

- Williamsburg: 4
- DUMBO: 2
- Brooklyn Bridge Park: 1
- Lower East Side: 4
- Bowery: 1

## Selected Venues

| Name | Neighborhood | Type | Score | Selection Reason | Source Signals |
| --- | --- | --- | ---: | --- | --- |
| Maison Provence Restaurant | Williamsburg | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Woodhul Wine Bar | Williamsburg | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Pinkerton Wine Bar | Williamsburg | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| With Others | Williamsburg | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Olympia | DUMBO | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Black Mountain Wine House | DUMBO | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Anaïs | Brooklyn Bridge Park | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Balvanera | Lower East Side | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Brick Wine Bar | Lower East Side | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Somm Time | Lower East Side | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Jadis | Lower East Side | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Ainslie Bowery | Bowery | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |

## Why These Are Korantis Venues

- Maison Provence Restaurant: wine_bar in Williamsburg; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Woodhul Wine Bar: wine_bar in Williamsburg; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Pinkerton Wine Bar: wine_bar in Williamsburg; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- With Others: wine_bar in Williamsburg; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Olympia: wine_bar in DUMBO; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Black Mountain Wine House: wine_bar in DUMBO; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Anaïs: wine_bar in Brooklyn Bridge Park; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Balvanera: wine_bar in Lower East Side; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Brick Wine Bar: wine_bar in Lower East Side; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Somm Time: wine_bar in Lower East Side; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Jadis: wine_bar in Lower East Side; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal
- Ainslie Bowery: wine_bar in Bowery; score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90; signals google_places, official_website_from_google, google_photo_signal

## Rejected Candidates Summary

- Blue Brown Cafe (Williamsburg): irrelevant_google_category
- Hole In The Wall (Williamsburg): irrelevant_google_category
- 11:11 Cafe (Williamsburg): irrelevant_google_category
- Devoción (Williamsburg): irrelevant_google_category
- Copper Mug Coffee (Williamsburg): irrelevant_google_category
- Caffè Valencia (Williamsburg): irrelevant_google_category
- Café Miguel (Williamsburg): irrelevant_google_category
- Qahwah House Coffee - Williamsburg Brooklyn (Williamsburg): irrelevant_google_category
- Social House Cafe & Coffee (Williamsburg): irrelevant_google_category
- 787 Coffee (Williamsburg): irrelevant_google_category
- Martha's Country Bakery (Williamsburg): irrelevant_google_category
- Bakeri (Williamsburg): irrelevant_google_category
- Levain Bakery (Williamsburg): irrelevant_google_category
- Butler (Williamsburg): irrelevant_google_category
- Paris Baguette (Williamsburg): irrelevant_google_category
- Nick + Sons Bakery (Williamsburg): irrelevant_google_category
- A&C Super (Williamsburg): irrelevant_google_category
- Black Star Bakery & Cafe (Williamsburg): irrelevant_google_category
- Paloma Coffee & Bakery, Williamsburg (Williamsburg): irrelevant_google_category
- Martha's Country Bakery (Williamsburg): irrelevant_google_category
- Hide & Seek (Williamsburg): irrelevant_google_category
- The Walk Inn (Williamsburg): irrelevant_google_category
- The West Brooklyn (Williamsburg): irrelevant_google_category
- Fiction Bar/Cafe (Williamsburg): irrelevant_google_category
- Isla & Co - Williamsburg (Williamsburg): irrelevant_google_category
- Hidden Grounds Chai & Coffee House (Williamsburg): irrelevant_google_category
- Cafe Colette (Williamsburg): irrelevant_google_category
- Butler (DUMBO): irrelevant_google_category
- % Arabica (DUMBO): irrelevant_google_category
- Bluestone Lane DUMBO Café (DUMBO): irrelevant_google_category
- Devoción (DUMBO): irrelevant_google_category
- Dawn’s Til Dusk (DUMBO): irrelevant_google_category
- maman (DUMBO): irrelevant_google_category
- Red Coffee Stand (DUMBO): irrelevant_google_category
- Pura Vida - Dumbo (DUMBO): irrelevant_google_category
- fontainhas + (/du.kaan/) (DUMBO): irrelevant_google_category
- Almondine Bakery (DUMBO): irrelevant_google_category
- Tous Les Jours (DUMBO): irrelevant_google_category
- Burrow (DUMBO): irrelevant_google_category
- Mia's Brooklyn Bakery (DUMBO): irrelevant_google_category
- Clinton St. Baking Co - Dumbo (DUMBO): irrelevant_google_category
- Paris Baguette (DUMBO): irrelevant_google_category
- Lassen & Hennigs (DUMBO): irrelevant_google_category
- Shake Shack Dumbo (DUMBO): irrelevant_google_category
- MeatUp Gyro — Dumbo (DUMBO): irrelevant_google_category
- Front Street Pizza (DUMBO): irrelevant_google_category
- Evil Twin Brewing NYC - DUMBO (DUMBO): irrelevant_google_category
- Dumbo Station (DUMBO): low_evidence_quality
- The Little Shop (DUMBO): irrelevant_google_category
- BEEPUBLIC (DUMBO): irrelevant_google_category
- Kaigo Coffee Room (Brooklyn Bridge Park): irrelevant_google_category
- Neighbors (Brooklyn Bridge Park): irrelevant_google_category
- Breads Bakery (Brooklyn Bridge Park): irrelevant_google_category
- Brooklyn Bread Cafe (Brooklyn Bridge Park): irrelevant_google_category
- Bakery by Textbook (Brooklyn Bridge Park): irrelevant_google_category
- La Bicyclette Bakery (Brooklyn Bridge Park): irrelevant_google_category
- Baked In Brooklyn (Brooklyn Bridge Park): irrelevant_google_category
- Bakeri (Brooklyn Bridge Park): irrelevant_google_category
- Elephant District (Brooklyn Bridge Park): irrelevant_google_category
- Nana Cocktail Bar (Brooklyn Bridge Park): low_evidence_quality
- Hole In The Wall Cafe - Lower East Side (Lower East Side): irrelevant_google_category, low_evidence_quality
- Pause Cafe (Lower East Side): irrelevant_google_category
- Rex (Lower East Side): irrelevant_google_category
- Dialogue Coffee & Flowers (Lower East Side): irrelevant_google_category
- Black Cat LES (Lower East Side): irrelevant_google_category
- Clinton St. Baking Company (Lower East Side): irrelevant_google_category
- Urban Backyard (Lower East Side): irrelevant_google_category
- Kaida Coffee and Bakery (Lower East Side): irrelevant_google_category
- Supermoon Bakehouse (Lower East Side): irrelevant_google_category
- Paris Baguette (Lower East Side): irrelevant_google_category
- La Cabra Bakery (Lower East Side): irrelevant_google_category
- Allan's Bakery (Lower East Side): irrelevant_google_category
- Librae Bakery (Lower East Side): irrelevant_google_category
- Café d’Avignon (Lower East Side): irrelevant_google_category
- Red Beard Coffee & Bakery (Lower East Side): irrelevant_google_category
- Russ & Daughters (Lower East Side): irrelevant_google_category
- Trapizzino (Lower East Side): irrelevant_google_category
- Katz's Delicatessen (Lower East Side): irrelevant_google_category
- Isla & Co - Lower East Side (Lower East Side): irrelevant_google_category
- El Castillo De Jagua Restaurant (Lower East Side): irrelevant_google_category

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

## Deviations From Target Mix

- rooftop: selected 0, target 12

## Warnings

- none

## Validation

- venue_seed.json contains exactly selected venues: 12
- every selected venue has name, neighborhood, and type
- duplicate normalized name + neighborhood removed
- existing Supabase/local batch venues excluded when detected

## Next Command

```powershell
npx tsx pipeline/run_full_batch.ts batch_006_nyc_rooftop
```
