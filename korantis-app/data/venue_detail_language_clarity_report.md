# Venue Detail Language Clarity Report

Generated: 2026-06-01

## Localization Root Cause

The locale store and rerender mechanism were functional: `korantis.locale` is persisted in `localStorage`, `setLanguage("es")` / `setLanguage("en")` update that key, and `useSyncExternalStore` rerenders subscribed components.

The runtime issue was product-surface access: the only visible ES/EN toggle lived inside the authenticated Taste surface, so unauthenticated users could not switch language from the auth panel. In addition, several venue-detail labels were dictionary-driven but too abstract, and atmosphere presentation could expose canonical values such as `golden-hour`.

## Files Changed

- `src/app/components/AuthPanel.tsx`
- `src/app/components/VenueDetail.tsx`
- `src/lib/i18n/index.ts`
- `src/lib/i18n/dictionaries/en.ts`
- `src/lib/i18n/dictionaries/es.ts`
- `scripts/i18n/verify_locale_runtime.ts`

## ES Toggle Result

- Pressing ES updates visible UI to Spanish without reload.
- `localStorage.korantis.locale` becomes `es`.
- Refresh preserves Spanish.
- Pressing EN restores English without reload.
- Venue names, districts, city names, and canonical search values remain unchanged.

## Labels Changed

- Atmospheric Vignettes -> Scenes from the place / Escenas del ambiente
- Circadian Atmospheric Shifts -> Moments of the day / Momentos del día
- Temporal Pace -> Pace / Ritmo
- Investment -> Price level / Nivel de gasto
- Golden Hour Atmosphere -> Golden hour / Tarde dorada
- Atmospheric Character -> Atmosphere / Ambiente
- Spatial Placement -> Where it is / Ubicación
- Where this atmosphere lives -> Where it is / Dónde está
- Explore Nearby Atmospheres -> Explore nearby places / Explorar lugares cercanos

## Copy Changed

- Static pace copy now uses clearer grounded language.
- Static map placement copy now says the venue is located in the given area instead of describing an abstract atmospheric point.
- Unknown price now says: `Price not confirmed yet.` / `Precio todavía no confirmado.`
- Daypart blocks now use direct descriptions for Morning, Afternoon, and Night.

## Deferred

Canonical venue taglines and narratives remain unchanged. If a venue has no safe Spanish variant, descriptions still fall back to English by design.

## Verification

See:

- `data/localization_runtime_debug_report.md`
- `data/localization_runtime_verification.md`

