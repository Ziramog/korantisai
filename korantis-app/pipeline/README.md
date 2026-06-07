# Korantis Pipeline

Local defensive staging pipeline for Korantis venue ingestion.

## Current Stage Map

| Stage | Script | Status |
| --- | --- | --- |
| 01 Venue Seed | `pipeline/stages/01_extract_data.ts` | Google Places seed extraction |
| 02 Source Discovery | `pipeline/stages/02_discover_sources.ts` | Report-only official-source discovery |
| 03 Image Discovery | `pipeline/stages/03_discover_images.ts` | Image candidate preflight |
| 04 Vision Classification | `pipeline/stages/04_classify_images.ts` | MiniMax M3 image classification when explicitly run |
| Connector | `pipeline/stages/connect_selected_images.ts` | Connects selected Stage 04 hero images |
| 05 Editorial | `pipeline/stages/05_generate_editorial.ts` | MiniMax M2.7 editorial generation when explicitly run |
| 05B Retry | `pipeline/stages/05b_retry_failed_editorial.ts` | Retries failed editorial JSON only |
| 06 Quality Gate | `pipeline/stages/06_quality_gate.ts` | Deterministic staging readiness |
| 07 Approval Manifest | `pipeline/stages/07_generate_approval_manifest.ts` | Deterministic approval boundary |
| 08 Supabase Staging | `pipeline/stages/08_sync_supabase_staging.ts` | Dry-run by default; apply requires explicit `--apply` |
| 09 Publication Review | `pipeline/stages/09_generate_publication_review.ts` | Review-only dashboard and decision manifest; no publish |

## Common Commands

```bash
npx tsx pipeline/stages/00_build_venue_seed.ts batch_004_buenos_aires_50 --count 50 --continue
npx tsx pipeline/stages/00_build_venue_seed.ts batch_custom_25 --count 25 --city "Buenos Aires" --neighborhoods "Palermo,Recoleta,San Telmo" --type-mix "cafes=6,restaurants=5,bars=5,cocktails=4,wine=3,hybrids=2"
npx tsx pipeline/stages/00_build_venue_seed.ts batch_004_buenos_aires_50 --count 50 --plan
npx tsx pipeline/run_full_batch.ts batch_004_buenos_aires_50
npx tsx pipeline/run_full_batch.ts batch_004_buenos_aires_50 --plan
npx tsx pipeline/stages/02_discover_sources.ts batch_003_stage01_test
npx tsx pipeline/stages/08_sync_supabase_staging.ts batch_003_stage01_test --dry-run
npx tsx pipeline/stages/09_generate_publication_review.ts batch_004_buenos_aires_50
npx eslint pipeline scripts/pipeline
```

`run_full_batch.ts` runs Stage 01 through Stage 08 dry-run in order. It is resumable by default: existing stage outputs are skipped unless `--force` is passed. It refuses `--apply`, `--publish`, and `--cloudinary-upload`.

`00_build_venue_seed.ts` is the reusable candidate detector/selector. It supports arbitrary `batch_id`, target count, city, neighborhoods, and type mix. It checks existing Supabase/local batch venues, discovers a larger Google Places candidate pool, excludes known venues, scores and balances candidates, writes `venue_seed.json`, copies it to `pipeline/input/<batch>.json`, and prints the next pipeline command. `--continue` is explicit and still only reaches Stage 08 dry-run through `run_full_batch.ts`.

## Safety Boundaries

- No consumer UI changes are required for pipeline stages.
- Stage 08 defaults to dry-run.
- Stage 08 apply must be explicit and must not write `public.venues`.
- Cloudinary upload is not wired into `pipeline/stages` yet.
- Public projection is future-only and must not be inferred from staging sync.
- Stage 09 is review-only. It generates decision JSON, but does not publish.

See `docs/KORANTIS_PIPELINE_AUDIT_AND_50_BA_PLAN.md` for the current audit, bottleneck, and 50 Buenos Aires rollout plan.
