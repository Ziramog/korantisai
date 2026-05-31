# Publication Validation Report

## Scope

- Publication script: `scripts/ingestion/7_publish.ts`
- Mapping document: `data/publication_field_mapping.md`
- Validation venue: `Origen Coffee House`
- Google Place ID: `ChIJi0KSF-DLvJURYWbYvNEknrg`
- Source: `staging_venues`
- Target: `public.venues`
- Publication count: exactly 1 Phase A venue

## Public Schema Audit

Live `public.venues` columns available for publication:

- `id`
- `name`
- `city`
- `category`
- `location`
- `coordinates`
- `card_size`
- `spacing`
- `atmosphere`
- `quality`
- `tagline`
- `narrative`
- `tags`
- `l2_vector`
- `l3_vector`
- `created_at`
- `updated_at`

Columns expected by parts of the consumer API but not present in the live schema:

- `hero_image`
- `taste_vector`

Current `/api/venues` behavior handles those missing columns with fallbacks:

- `heroImage`: `/venue_invernadero.png`
- `tasteVector`: `[0,0,0,0,0,0,0,0]`
- `lat/lng`: static mock lookup by ID, then fallback `-34.6, -58.4`

## Field Mapping

Detailed mapping is documented in `data/publication_field_mapping.md`.

Summary:

| Source | Target | Transformation |
| --- | --- | --- |
| `staging_venues.id` | `venues.id` | Direct copy; Google Place ID. |
| `staging_venues.name` | `venues.name` | Direct copy. |
| Constant | `venues.city` | `Buenos Aires`. |
| `staging_venues.category_seed` | `venues.category` | Display label mapping. |
| `staging_venues.canonical_data.formattedAddress` | `venues.location` | Address fallback chain. |
| `staging_venues.canonical_data.location` | `venues.coordinates` | `{ lat, lng }`. |
| `staging_venues.category_seed` | `venues.card_size`, `venues.spacing`, `venues.atmosphere` | Deterministic category defaults. |
| Reviews/prose/images/embedding presence | `venues.quality` | Completeness-derived score. |
| `staging_venues.atmosphere_prose` | `venues.tagline`, `venues.narrative` | First sentence for tagline; full prose for narrative. |
| `venue_embeddings.layer = L3` | `venues.l3_vector` | Direct copy of 384D vector. |
| No Phase A L2 | `venues.l2_vector` | `null`. |

## Dry Run

Command:

```bash
npx tsx scripts/ingestion/7_publish.ts --place-id=ChIJi0KSF-DLvJURYWbYvNEknrg
```

Result:

- Mode: `dry-run`
- Source row found in `staging_venues`
- Source status: `ready_for_review`
- Target payload generated for `public.venues`
- No write performed
- ESLint passed for `7_publish.ts`

## Publish Run

Command:

```bash
npx tsx scripts/ingestion/7_publish.ts --place-id=ChIJi0KSF-DLvJURYWbYvNEknrg --publish
```

Result:

- Published `Origen Coffee House` to `public.venues`
- Script now requires explicit `--place-id` when `--publish` is used
- No other Phase A venues were published

Published record summary:

| Field | Value |
| --- | --- |
| `id` | `ChIJi0KSF-DLvJURYWbYvNEknrg` |
| `name` | `Origen Coffee House` |
| `city` | `Buenos Aires` |
| `category` | `Specialty Coffee` |
| `location` | `Montevideo 426, C1019 Cdad. Autonoma de Buenos Aires, Argentina` |
| `coordinates` | `{ "lat": -34.6039861, "lng": -58.38957789999999 }` |
| `card_size` | `compact` |
| `spacing` | `breathe` |
| `atmosphere` | `morning` |
| `quality` | `0.9` |
| `l2_vector` | `null` |
| `l3_vector` | present |

## End-to-End Verification

### `public.venues`

Read from Supabase:

- `public.venues` contains `ChIJi0KSF-DLvJURYWbYvNEknrg`
- Name: `Origen Coffee House`
- Category: `Specialty Coffee`
- Quality: `0.9`

### `/api/venues`

Request:

```text
GET http://127.0.0.1:3100/api/venues
```

Result:

- Response status: `200`
- Venue count: `26`
- `Origen Coffee House` present: yes
- API-mapped fields present: `id`, `name`, `category`, `location`, `cardSize`, `spacing`, `heroImage`, `atmosphere`, `quality`, `tagline`, `narrative`, `tags`, `tasteVector`, `lat`, `lng`

### `CircadianProvider -> rankedVenues -> VenueCard`

Playwright validation against the running app:

- `/api/venues` network response observed by browser: yes
- API response included `Origen Coffee House`: yes
- DOM body contained `Origen Coffee House`: yes
- `Origen Coffee House` visible: yes
- `article.k-card` count: `26`
- `article.k-card` containing `Origen Coffee House`: `1`

This confirms the published venue flows through:

`public.venues -> /api/venues -> CircadianProvider -> rankedVenues -> VenueCard`

## Result

Publication validation succeeded for exactly one Phase A venue. The system is now technically capable of promoting selected `ready_for_review` staging records into the consumer feed, but Phase B should not proceed until the publication defaults are accepted.

## Follow-Up Before 25 Venue Expansion

- Decide whether `public.venues` should gain explicit `hero_image` and `taste_vector` columns later. No migration was performed for this validation.
- Decide whether `1_fetch_places.ts` should preserve Google rating and total review count in `canonical_data` before scaling.
- Decide whether publication should use curated editorial fields instead of deterministic defaults for `card_size`, `spacing`, `atmosphere`, and `tags`.
