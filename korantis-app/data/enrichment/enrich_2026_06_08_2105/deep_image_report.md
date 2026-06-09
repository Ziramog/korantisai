# Deep Image Discovery - enrich_2026_06_08_2105

- Generated: 2026-06-09T02:38:41.518Z
- Deep discovery batch: enrich_2026_06_08_2105_deep_gallery
- Venues targeted: 5
- Candidates found/probed: 52
- Rejected before M3: 27
- Final M3 queue size: 25

## Candidates Per Venue

- Ancora Buenos Aires: 5
- BOCANADA: 5
- Cobre Café: 6
- Dada Bistró: 3
- Farmacia Lezama - Bistrot: 6

## Venues With Zero Candidates

- none

## Source Breakdown

- google_places: 25

## Next Command

```powershell
npx tsx pipeline/stages/04_classify_images.ts enrich_2026_06_08_2105_deep_gallery --max-images-per-venue 12
```

## Safety

- no_supabase_writes: true
- no_cloudinary_uploads: true
- no_publication_changes: true
- no_m3_calls: true
