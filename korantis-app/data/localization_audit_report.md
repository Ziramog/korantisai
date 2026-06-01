# Localization Audit Report

Generated: 2026-06-01T16:50:33.054Z

## Localized Surfaces

- src/lib/i18n
- src/app/contexts/CircadianContext.tsx
- src/app/components/SearchBar.tsx
- src/app/components/VenueCard.tsx
- src/app/components/VenueDetail.tsx
- src/app/components/map/SpatialAtlas.tsx
- src/app/components/map/VenueDetailMapBlock.tsx
- src/app/components/AuthPanel.tsx
- src/app/components/GlobalNav.tsx
- src/app/components/MapExplorer.tsx
- src/app/components/HeaderControls.tsx
- src/app/components/AtmosphereDebug.tsx
- src/app/page.tsx

## Remaining Hardcoded User-Facing Candidates

- No likely hardcoded user-facing English strings found by the lightweight scanner.

## Intentional English / Proper Nouns

- Venue names, district names, city names, source names, and proper nouns are intentionally preserved.
- Uber and Maps are treated as product/source labels and are intentionally preserved.
- Unknown tags and intents intentionally fall back to their canonical English value.

## Fields Intentionally Left English

- Canonical venue descriptions remain English unless a safe Spanish variant exists.
- Source evidence and internal intelligence labels remain English.
- Search/ranking values remain canonical English even when displayed labels are Spanish.

## Deferred Description Translation

- Venue-facing narrative copy needs curated Spanish variants or a deterministic translation cache.
- This audit does not recommend destructive translation of database canonical records.

## Next Steps

- Add curated Spanish description fields or a deterministic translation cache for venue-facing copy.
- Expand tag/category mappings as new production tags appear.
- Add an automated UI smoke test that toggles EN/ES and checks persistence.
