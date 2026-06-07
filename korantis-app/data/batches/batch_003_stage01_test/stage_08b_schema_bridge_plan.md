# Stage 08B Schema Bridge Plan

- Batch: `batch_003_stage01_test`
- Mode: plan only
- SQL proposal: `supabase/migrations/06_pipeline_staging_bridge.sql`
- Status: do not run Stage 08 apply until the SQL is manually reviewed, applied, and a new dry-run confirms compatibility.

## Current Live Schema Summary

Stage 08 already performed read-only Supabase table/column probes. The probe succeeded and found:

| Table | Found | Current compatible columns |
| --- | --- | --- |
| `staging_venues` | yes | `id`, `name`, `city`, `category_seed`, `status`, `canonical_data`, `atmosphere_prose` |
| `venue_images` | yes | `id`, `venue_id`, `photo_reference`, `google_photo_reference`, `width`, `height`, `is_cover`, `status`, `url`, `role`, `source`, `quality_score`, `hero_suitability_score`, `sort_order` |
| `quality_scores` | yes | `venue_id`, `review_count`, `has_images`, `has_prose`, `has_embeddings`, `resonance_score`, `editorial_themes`, `interpretation_notes`, `atmosphere_word_count`, `last_processed_at` |
| `venue_quality` | yes | `id`, `venue_id`, `review_count`, `has_atmosphere`, `has_embedding`, `has_images`, `completeness_score`, `ready_for_review` |
| `venue_atmosphere` | yes | `id`, `venue_id`, `prose`, `word_count`, `model` |

Local schema review shows `venue_atmosphere.venue_id` was defined as `REFERENCES public.venues(id)`. It should not receive `staging_venues.id` values during Stage 08 apply.

## Missing Columns

- `staging_venues`: needs `enrichment_data`, `pipeline_batch_id`, `pipeline_status`, `eligibility_score`, `primary_atmosphere`, `mood_tags`.
- `venue_images`: needs `selection_data`, `rights_status`, `is_selected_hero`.
- `quality_scores`: needs `pipeline_quality_data`.
- `venue_atmosphere`: not missing columns, but not staging-compatible based on local FK definition.

## Proposed Additive Columns

| Table | Column | Type | Why needed | Stage 08 mapping |
| --- | --- | --- | --- | --- |
| `staging_venues` | `enrichment_data` | `jsonb` | Stores raw facts, editorial content, selected image metadata, source provenance, evidence, warnings, and gate details without fragile typed schema churn. | `canonical_data_payload_preview`, evidence, warnings, hero classification, source URLs |
| `staging_venues` | `pipeline_batch_id` | `text` | Enables batch reconciliation and rollback. | `batch_id` |
| `staging_venues` | `pipeline_status` | `text` | Preserves quality-gate status separately from existing staging workflow status. | `candidate.status` |
| `staging_venues` | `eligibility_score` | `numeric` | Stores deterministic Stage 06 score. | `candidate.staging_score` |
| `staging_venues` | `primary_atmosphere` | `text` | Stores the primary atmosphere signal from image/editorial evidence. | selected hero `atmosphere_signal` or generated `primary_atmosphere` |
| `staging_venues` | `mood_tags` | `text[]` | Makes Stage 05 mood tags queryable. | `venue.editorial.mood_tags` |
| `venue_images` | `selection_data` | `jsonb` | Stores Stage 03/04/selection metadata including scene, quality, rights risk, dimensions, M3 provenance, and source URLs. | selected `hero_image` metadata and classification |
| `venue_images` | `rights_status` | `text` | Makes image rights explicit without approving publication. | `not_approved_for_publication` |
| `venue_images` | `is_selected_hero` | `boolean` | Marks the selected staging hero reference. | `true` for Stage 04 selected image only |
| `quality_scores` | `pipeline_quality_data` | `jsonb` | Stores Stage 06 score breakdown, blockers, warnings, review reason, and scored timestamp. | `candidate.score_breakdown`, `errors`, `warnings`, `review_reason`, `scored_at` |

All proposed columns are nullable and additive. Existing columns are not altered.

## Venue Atmosphere Decision

Do not use `venue_atmosphere` in Stage 08 apply yet.

Reason: local schema defines `venue_atmosphere.venue_id` as a FK to `public.venues(id)`, while Stage 08 approved records are staging records keyed by `staging_venues.id`. Writing staging IDs there could create FK failures or incorrectly attach pre-publication prose to public venue records. Use `staging_venues.atmosphere_prose` and `staging_venues.enrichment_data` instead.

## Rollback Safety

This proposal is rollback-safe because it only adds nullable columns and non-unique helper indexes. It does not drop tables, rename columns, change constraints on existing columns, modify `public.venues`, or alter consumer runtime behavior.

If rollback is required before data is written, manually drop the added indexes and columns. If data has been written, first export rows for the affected `pipeline_batch_id`.

## Real Sync Readiness

Stage 08 apply should wait.

Before any real apply:

1. Manually review `supabase/migrations/06_pipeline_staging_bridge.sql`.
2. Apply it outside Codex, for example with `supabase db push --include-all`, or by running the SQL in the Supabase SQL editor.
3. Re-run Stage 08 dry-run and confirm the new columns are detected.
4. Confirm Stage 08 apply mapping writes `enrichment_data`, `selection_data`, `rights_status`, `is_selected_hero`, and `pipeline_quality_data`.
5. Keep `venue_atmosphere` disabled for staging apply.

## Safety Confirmations

- No migration was applied.
- No Supabase writes were performed.
- No `public.venues` changes were made.
- No Cloudinary upload was performed.
- No external model call was made.
- No consumer UI files were changed.
