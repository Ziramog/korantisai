# Publication Field Mapping

Mapping used by `scripts/ingestion/7_publish.ts` to promote one `ready_for_review` staging venue into `public.venues`.

| Source | Target | Transformation |
| --- | --- | --- |
| `staging_venues.id` | `venues.id` | Direct copy. This is the Google Place ID. |
| `staging_venues.name` | `venues.name` | Direct copy. |
| Constant | `venues.city` | Set to `Buenos Aires` for BA validation. |
| `staging_venues.category_seed` | `venues.category` | Mapped to display label: `cafe -> Specialty Coffee`, `restaurant -> Restaurant`, `wine_bar -> Wine Bar`, `cocktail_bar -> Cocktail Bar`. |
| `staging_venues.canonical_data.formattedAddress` | `venues.location` | Direct copy, falling back to `canonical_data.address`, then `Buenos Aires, Argentina`. |
| `staging_venues.canonical_data.location` | `venues.coordinates` | Converted to `{ lat, lng }`, falling back to central Buenos Aires coordinates if missing. |
| `staging_venues.category_seed` | `venues.card_size` | Deterministic defaults: cafe `compact`, restaurant `layered`, bars `cinematic`. |
| `staging_venues.category_seed` | `venues.spacing` | Deterministic defaults: cafe/restaurant `breathe`, bars `isolated`. |
| `staging_venues.category_seed` | `venues.atmosphere` | Deterministic defaults: cafe `morning`, restaurant `night`, wine/cocktail bars `late-night`. |
| Review/prose/image/embedding presence | `venues.quality` | Completeness score from review count, prose, L3 embedding, and images. |
| `staging_venues.atmosphere_prose` | `venues.tagline` | First sentence, truncated to 22 words. |
| `staging_venues.atmosphere_prose` | `venues.narrative` | Direct copy. |
| `staging_venues.category_seed` + constant labels | `venues.tags` | `["Buenos Aires", category label, "Validation"]`. |
| None at validation time | `venues.l2_vector` | `null`; L2 is not available for Phase A venues. |
| `venue_embeddings.embedding where layer = L3` | `venues.l3_vector` | Direct copy of existing 384D L3 vector. |

Current schema note: `public.venues` does not have `hero_image` or `taste_vector`. `/api/venues` currently falls back to `/venue_invernadero.png` for `heroImage` and an all-zero `tasteVector`.
