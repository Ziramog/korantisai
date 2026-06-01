# F.8 Frontend Feed Debug

Generated: 2026-06-01T22:19:50.027Z

## Data Path

- CircadianProvider fetches `/api/venues` on mount in `src/app/contexts/CircadianContext.tsx`.
- The client stores the response in `dbVenues` and computes `rankedVenues` with BUE city filtering: `lat < 0`.
- `page.tsx` renders every `rankedVenues` item; no fixed slice is applied in the Explore feed.
- `VenueCard` renders `venue.heroImage` with Next/Image.
- `next.config.ts` already allows `res.cloudinary.com`.

## Production UI Result

- Cards rendered in DOM: 64.
- API venues: 66.
- Feed cards after BUE filter: 64, because 2 API venues are NYC coordinates and are filtered out by the existing city rule.
- F.8 venues found in DOM: 16/16.
- F.8 venues with Cloudinary-rendered images: 16/16.
- Image request failures: 0.
- Bad image HTTP responses: 0.

## F.8 Ranking Positions

| Venue | Rank | Cloudinary |
|---|---:|---:|
| Blanca Deco and Cafe | 64 | yes |
| Julia | 22 | yes |
| Roux | 27 | yes |
| Anchoita | 23 | yes |
| El Cuartito | 24 | yes |
| Reliquia | 20 | yes |
| Apu Nena | 28 | yes |
| Corte Comedor | 29 | yes |
| Guerrin | 17 | yes |
| Cabaña Las Lilas | 25 | yes |
| Vini Bar | 21 | yes |
| Gran Bar Danzon | 26 | yes |
| 878 Bar | 18 | yes |
| Milion | 19 | yes |
| Plaza Bar | 30 | yes |
| Mixtape Bar | 31 | yes |

## Diagnosis

Production is not stale at API or image level. The new image-rich venues are present and render correctly, but the initial feed view looks unchanged because the first F.8 venue is rank 17. Most F.8 venues are clustered between ranks 17 and 31, while Blanca Deco and Cafe is rank 64.

No ranking change was applied because the task only authorizes reporting unless ranking is explicitly approved for adjustment.
