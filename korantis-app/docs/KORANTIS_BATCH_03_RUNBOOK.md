# Korantis Batch 03 Runbook

## Prepare 25 Venues

1. Edit `pipeline/input/batch_003_ba.json`.
2. Keep the venue list to 25 records.
3. Include `name` for every venue.
4. Include `neighborhood`, `type`, notes, coordinates, address, and Google Maps URL when known.
5. Do not add production IDs unless they are explicitly validated.

## Run Pipeline

From `F:/KORANTIS/korantis-app`:

```bash
npx tsx pipeline/run_batch.ts batch_003_ba
```

The MVP orchestrator does not call external APIs. Stages 1-5 are stubs unless `prebuilt_venues` are provided in the input JSON.

## Expected Files

- `data/batches/batch_003_ba/batch_result.json`
- `data/batches/batch_003_ba/dashboard.html`

## Review Dashboard

Open `data/batches/batch_003_ba/dashboard.html` locally. Review:

- Summary cards.
- Venue preview grid.
- Status badges.
- Hero image placeholders.
- Needs-review section.
- Blocked section.
- Mood distribution.
- Neighborhood distribution.

Buttons are disabled placeholders. There is no live API in this MVP.

## Pass Criteria

- Batch result JSON is written.
- Dashboard HTML is written.
- `npx eslint pipeline scripts/pipeline` passes.
- Added-file TypeScript check passes.
- Protected consumer UI files remain untouched.
- No Supabase, Cloudinary, M3, or deploy calls are made.

## Fail Criteria

- Input JSON fails schema validation.
- Batch output directory is missing.
- Dashboard is not generated.
- Scoring stage throws.
- Consumer UI files are modified.
- Any production write, upload, M3 call, or deploy happens.

## After Pass

Use the dashboard and `batch_result.json` to inspect missing data and decide which real stages should be plugged in first. The most likely next stage is real `03_discover_images` plus final queue validation.

## After Fail

Fix input shape first. If scoring fails, inspect the specific `VenueComplete` record and update `pipeline/types.ts` or `pipeline/stages/06_score_and_stage.ts` only if the contract is wrong. Do not bypass hard errors by lowering thresholds.
