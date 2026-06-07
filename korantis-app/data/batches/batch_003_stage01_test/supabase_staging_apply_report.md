# Supabase Staging Apply Report

- Batch id: batch_003_stage01_test
- Generated: 2026-06-07T18:03:39.847Z
- Approved venues synced: 4
- Blocked venues skipped: 1
- Intended writes: 12
- venue_images conflict key: venue_id,photo_reference
- Required venue_images unique index verified: no
- Required venue_images unique index manually assumed: yes

## Required Unique Index SQL

```sql
create unique index if not exists venue_images_venue_photo_reference_uidx
on venue_images (venue_id, photo_reference);
```

## Partial Writes Before Apply

- Checked: yes
- Partial writes detected: yes
- staging_venues rows for batch: 4
- venue_images rows for approved venues: 10
- selected hero image rows for approved venues: 0
- quality_scores rows for approved venues: 0

## Rows Upserted Per Table

- staging_venues: upsert, attempted 4, affected 4
- venue_images: upsert, attempted 4, affected 4
- quality_scores: upsert, attempted 4, affected 4

## Venue IDs Synced

- ChIJ9_Wpip-2vJURSyBdySgpgsM
- ChIJh9Qpx7nKvJURLoDB8VNMen8
- ChIJPXhNCKPKvJUREtJrc0ejdKs
- ChIJJY8xLrHKvJURGgoMqdg8pXE

## Skipped Venues

- Verne Club: no_hero_image

## Warnings

- staging_venues skipped unavailable optional columns: curation_status, eligibility, evidence, best_for, grounded_description, curation_notes
- venue_images skipped unavailable optional columns: photo_scores
- venue_images unique index was manually confirmed via --confirm-venue-images-index; metadata verification is not exposed through current Supabase read APIs.
- venue_atmosphere skipped because it references public.venues, not staging_venues.
- Images remain not_approved_for_publication; publication rights were not approved.

## Idempotency

- staging_venues uses upsert on id.
- venue_images uses upsert on venue_id,photo_reference after normalizing photo_reference to a stable non-null value.
- quality_scores uses upsert on venue_id.
- venue_atmosphere is not written.

## How Stage 08 Works

- Reads `approval_manifest.json` and `batch_result_quality_gated.json` for the batch.
- Qualifies only venues listed in `approved_for_db_staging`; blocked and needs-review venues are skipped.
- Dry-run probes live schema, builds deterministic payload previews, detects partial writes, and writes only local JSON/Markdown reports.
- Apply requires explicit `--apply`, service-role credentials, successful preflight, required bridge columns, and manual confirmation of the venue image unique index.
- Apply writes only `staging_venues`, `venue_images`, and `quality_scores`.
- Apply intentionally does not write `public.venues`, `venues`, `venue_atmosphere`, Cloudinary, image storage, public publication state, auth, ranking, API, Mapbox, or consumer UI.
- Image rights remain `not_approved_for_publication`; selected heroes are staging references only.
- Idempotency comes from upserts on `staging_venues.id`, `venue_images(venue_id, photo_reference)`, and `quality_scores.venue_id`.
- After a partial failure, rerun dry-run first, confirm the required index exists, then rerun apply; existing partial rows are updated rather than duplicated.

## Path To 50 Buenos Aires Venues

1. Finish Stage 08 test apply for `batch_003_stage01_test` after the required `venue_images` unique index is in place.
2. Confirm the 4 approved venues are staged correctly in `staging_venues`, `venue_images`, and `quality_scores`.
3. Prepare a new Buenos Aires batch of 50 venues.
4. Run Stages 01-08 in dry-run mode first.
5. Review blocked venues and missing hero images before any apply.
6. Apply only approved venues to staging.
7. Do not publish to `public.venues` until image rights and editorial review are complete.

Ready for 50 venues means Stage 08 apply is idempotent, reports are clear, failed venues do not block valid venues, skipped venues have actionable reasons, no public tables are touched, and image rights remain blocked for publication.

## Safety Confirmations

- no_public_venues_writes: yes
- no_cloudinary_uploads: yes
- no_image_rights_approval: yes
- no_external_model_calls: yes
- no_consumer_ui_changes: yes
- no_publication: yes
- venue_atmosphere_skipped: yes
