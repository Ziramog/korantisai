# Mock Venue Runtime Dependency Report

## Scope

Goal: remove hidden runtime dependencies on `MOCK_VENUES` before additional Buenos Aires ingestion.

Files changed:

- `src/app/api/venues/route.ts`
- `src/app/contexts/CircadianContext.tsx`

No UI components were modified. Ranking logic was not changed.

## API Coordinate Source

`/api/venues` previously imported `MOCK_VENUES` and used it for coordinate lookup:

- `MOCK_VENUES.find(mv => mv.id === v.id)`
- fallback `lat = -34.6`
- fallback `lng = -58.4`

That dependency has been removed.

Current behavior:

- Source table: `public.venues`
- Source field: `public.venues.coordinates`
- API fields emitted: `lat = coordinates.lat`, `lng = coordinates.lng`
- Venues without valid canonical coordinates are skipped instead of assigned mock or central fallback coordinates.
- If `public.venues` is empty, `/api/venues` returns `[]` instead of `MOCK_VENUES`.

## Runtime Validation

Runtime endpoint checked:

```text
GET http://127.0.0.1:3000/api/venues
```

Result:

- API venue count: `26`
- Invalid coordinate count: `0`
- `Origen Coffee House` present: yes
- `Origen Coffee House` API coordinates:
  - `lat`: `-34.6039861`
  - `lng`: `-58.38957789999999`

These match `public.venues.coordinates` for `ChIJi0KSF-DLvJURYWbYvNEknrg`.

## City Filtering Validation

`CircadianProvider` city filtering was not changed:

```ts
if (city === 'BUE') return v.lat < 0;
if (city === 'NYC') return v.lat > 0;
```

Validation using `/api/venues` output:

- BUE count: `24`
- NYC count: `2`
- `Origen Coffee House` passes BUE filter: yes

This now uses database coordinates only.

## rankedVenues Validation

Ranking logic was not changed.

Validation using `/api/venues` output and current ranking formula:

- `Origen Coffee House` rank: `18 / 24` within BUE filtered venues
- `lat`: `-34.6039861`
- `lng`: `-58.38957789999999`
- `atmosphere`: `morning`
- `quality`: `0.9`
- computed score at validation time: `0.221`

The venue is not filtered out. Its lower rank is due to existing circadian ranking logic: it is a `morning` venue evaluated during night hours.

## MapExplorer Validation

`MapExplorer` was not changed. It consumes `rankedVenues`:

- Initial map center uses the average `lat/lng` of top 5 ranked venues.
- Markers use each venue's `venue.lat` and `venue.lng`.

Validation using `/api/venues` output and current ranking:

- Top-5-derived initial latitude: `-34.589259999999996`
- Top-5-derived initial longitude: `-58.415620000000004`
- Marker count from top 20: `20`
- All top 20 markers have numeric coordinates: yes
- `Origen Coffee House` is included in top 20 map markers: yes

This now traces back to `public.venues.coordinates`, not mock coordinates.

## Remaining MOCK_VENUES References

Search command:

```bash
rg -n 'MOCK_VENUES|data/venues' src scripts tests -g '*.ts' -g '*.tsx'
```

Remaining references:

| File | Runtime path? | Purpose |
| --- | --- | --- |
| `src/app/data/venues.ts` | No by itself | Defines the legacy static dataset and `Venue` type. |
| `src/app/contexts/CircadianContext.tsx` | No | Type-only import: `import type { Venue } from '../data/venues'`. |
| `scripts/seedSupabase.ts` | No consumer runtime | Legacy seed script using `MOCK_VENUES`. |
| `scripts/seedSupabasePhase5.ts` | No consumer runtime | Legacy Phase 5 seed script using `MOCK_VENUES`. |
| `scripts/phase5/generate_embeddings.ts` | No consumer runtime | Legacy local phase script using static venues. |
| `scripts/phase5/fetch_reviews.ts` | No consumer runtime | Legacy local phase script using static venues. |

Consumer runtime references to `MOCK_VENUES`: none found.

## Verification Notes

- `npx eslint src/app/api/venues/route.ts` passed.
- Running ESLint on `CircadianContext.tsx` still reports pre-existing lint issues unrelated to this change. The only change in that file was converting `Venue` to a type-only import to avoid any runtime import of `data/venues`.

## Result

Hidden consumer runtime dependency on `MOCK_VENUES` has been removed for venue loading and coordinates.

Current consumer flow:

```text
public.venues.coordinates
-> /api/venues lat/lng
-> CircadianProvider dbVenues
-> city filtering
-> rankedVenues
-> MapExplorer markers / VenueCard feed
```
