# Korantis Seed Quality Policy

Stage 00 must select venues for Korantis, not generic Google Maps popularity.

## Venue Fit

Korantis prioritizes places where atmosphere is the product:

- Bars: cocktail bars, speakeasies, wine bars, neighborhood bars, listening bars.
- Cafes: specialty coffee, independent cafes, roasters, design cafes, quiet cafes, cafe-bars.
- Restaurants: atmosphere-forward restaurants only, where room, light, service mood, or social setting is a primary reason to go.

Rooftop is a spatial attribute, not a primary venue type. A rooftop bar is still a bar. A terrace or rooftop can win as hero imagery when it is the actual experience space, but Stage 00 should not over-select rooftops as a standalone aesthetic.

## Chain Policy

Obvious chains are rejected before selection. Examples include Starbucks, Dunkin, McDonald's, Pret a Manger, Joe & The Juice, Costa Coffee, Tim Hortons, Subway, KFC, Burger King, Chipotle, Shake Shack, and similar high-standardization brands.

Some multi-location brands are not automatically rejected because they may still have local relevance, but they receive a generic/chain penalty and require stronger signals to enter. Examples include Blue Bottle, Blank Street, Gregorys Coffee, Bluestone Lane, Le Pain Quotidien, Paris Baguette, Maman, Paul, and local multi-location operators.

## Scoring Direction

Stage 00 now reduces the weight of raw Google popularity and adds:

- `local_identity_score`: website, independent-feeling naming, roaster/speakeasy/wine/patio/atelier/etc. signals.
- `editorial_discovery_score`: queries and metadata that suggest discovery value, such as specialty coffee, independent, design, quiet, neighborhood, cocktail, natural wine, listening bar, atmosphere, romantic.
- `generic_chain_penalty`: soft penalty for chain-like venues that are not hard rejected.

This makes high-review generic venues less likely to beat smaller but more Korantis-relevant places.

## Stage 00B Editorial Source Enrichment

Stage 00B builds a prestige/source-weighted candidate layer before the normal seed selection.

Standalone audit command:

```powershell
npx tsx pipeline/stages/00b_editorial_source_enrichment.ts <batch_id> --city "New York City" --neighborhoods "Williamsburg,DUMBO,Lower East Side" --type cafes --max-source-queries 40
```

Normal Stage 00 now consumes Stage 00B automatically unless disabled:

```powershell
npx tsx pipeline/stages/00_build_venue_seed.ts <batch_id> --count 50 --city "New York City" --neighborhoods "Williamsburg,DUMBO,Lower East Side,NoMad,Chelsea,West Village" --type-mix "cafes=50" --continue
```

Optional comparison mode:

```powershell
npx tsx pipeline/stages/00_build_venue_seed.ts <batch_id> --count 50 --city "New York City" --neighborhoods "Williamsburg,DUMBO,Lower East Side,NoMad,Chelsea,West Village" --type-mix "cafes=50" --skip-editorial-sources
```

Stage 00B writes:

- `stage_00b_editorial_source_enrichment.json`
- `stage_00b_editorial_source_enrichment_report.md`

## Current Limitation

Stage 00B currently uses source-weighted Google Places text queries such as Eater/Infatuation/Michelin/Time Out query intent. This is not proof that the venue appears in the exact source article. It is a stronger candidate signal than generic Google Places, but confirmed source verification still needs URL-level extraction.

## Recommended Next Upgrade

Add URL-level source verification inside Stage 00B:

- Read official/editorial sources in read-only mode.
- Extract candidate mentions and source URLs.
- Add confirmed source signals like `michelin_confirmed`, `eater_confirmed`, `timeout_confirmed`, `local_press_confirmed`, `coffee_publication_confirmed`.
- Boost candidates only when the mention maps safely by normalized name and city/neighborhood.
- Preserve source URLs in the seed report.

Do not let editorial mentions override hard safety rules: duplicates, chains, closed venues, missing coordinates, and unsupported neighborhoods remain blocked.
