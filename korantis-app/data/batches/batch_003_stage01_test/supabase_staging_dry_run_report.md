# Supabase Staging Dry Run Report

## Summary

- Batch id: batch_003_stage01_test
- Approved count: 4
- Blocked count: 1
- Dry-run only: yes
- venue_images conflict key: venue_id,photo_reference
- venue_atmosphere excluded from apply: yes
- Apply idempotent after required index: yes

## Required Unique Index

- Verified through schema introspection: no
- Manually assumed: no
- Note: Index metadata is not exposed through the current Supabase/PostgREST schemas; --apply must fail before writes unless explicitly confirmed.

```sql
create unique index if not exists venue_images_venue_photo_reference_uidx
on venue_images (venue_id, photo_reference);
```

## Partial Write Detection

- Checked: yes
- Partial writes detected: yes
- staging_venues rows for batch: 4
- venue_images rows for approved venues: 14
- selected hero image rows for approved venues: 4
- quality_scores rows for approved venues: 4
- 4 staging_venues rows found for batch batch_003_stage01_test.
- 14 venue_images rows found for approved venue ids.
- 4 selected Stage 08 hero image rows found for approved venue ids.
- 4 quality_scores rows found for approved venue ids.

## Schema Compatibility

- Read-only live probe attempted: yes
- Read-only live probe succeeded: yes

| Table | Found | Columns Found | Missing Columns | Fallback Decision |
| --- | --- | --- | --- | --- |
| staging_venues | yes | id, name, city, category_seed, status, canonical_data, atmosphere_prose, enrichment_data, pipeline_batch_id, pipeline_status, eligibility_score, primary_atmosphere, mood_tags | curation_status, eligibility, evidence, best_for, grounded_description, curation_notes | Map only found columns and skip missing columns: curation_status, eligibility, evidence, best_for, grounded_description, curation_notes. |
| venue_images | yes | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, status, url, role, source, quality_score, hero_suitability_score, selection_data, rights_status, is_selected_hero, sort_order | photo_scores | Map only found columns and skip missing columns: photo_scores. |
| venue_atmosphere | yes | id, venue_id, prose, word_count, model | none | Treat as not staging-compatible unless FK compatibility with staging venue ids is confirmed; use staging_venues.atmosphere_prose fallback. |
| quality_scores | yes | venue_id, review_count, has_images, has_prose, has_embeddings, resonance_score, editorial_themes, interpretation_notes, atmosphere_word_count, last_processed_at, pipeline_quality_data | none | All expected dry-run columns found. |
| venue_quality | yes | id, venue_id, review_count, has_atmosphere, has_embedding, has_images, completeness_score, ready_for_review | none | All expected dry-run columns found. |

## Venue Mapping

- Oporto Almacén: target ChIJ9_Wpip-2vJURSyBdySgpgsM; category restaurant; neighborhood Palermo; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOgdv00ehatYmLrTbHtDjxh97vc2uJ1xct6xt6E8REZMPsyAbsOG0YBLsc3vaQZwvvz6Scj4yIgo7crjv7qkXZh2IqsIEHWY35gUhFBtqYAg_5SWrBqKHiKohHdI6rMsRhnkMRamnw4hQQA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Gran Bar Danzon: target ChIJh9Qpx7nKvJURLoDB8VNMen8; category bar; neighborhood Retiro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMe7ZK04hhcFZpmum5-VX-3D20w2pYdTYPS9wpx9l852OZR7fmd-v4DMBYFByyxUhC6TiwN4VJl-f-u6K1raP3oP8b38EyZ2nFyjzKL9dxSHKlIVYtLVLyW_2hXttif2hFu0dYiegejKB4KFW21cueoog=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- La Biela: target ChIJPXhNCKPKvJUREtJrc0ejdKs; category cafe; neighborhood Recoleta; hero https://lh3.googleusercontent.com/place-photos/AJRVUZP3JAAzYrl7uxp-dt4TT1mFER_wen6NyADvRwyqZY-b0eR_ftb03KGAGiquII0Qfc53cGntZQo3JPmHxSEos_zzE_DJ4fO-Q3YI7qh-y_dX-TxvOen8nM8K9JOMBTDdLwnMeT5em9aJo50KtkdgsGL0Iw=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Floreria Atlántico: target ChIJJY8xLrHKvJURGgoMqdg8pXE; category cocktail_bar; neighborhood Retiro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZM6lrlD79XbHm_drZPNel-U_afqj9TDr9JvKGf__UD_HJajx0RwevxCnmLc0uEQli1-1SksLIkOQGGcreIDJj_gqDCpgh8Sj103e3gqqjQcqLIhXnfEKW55aY7r-FX5EZsTcA6ZcHo1QZQMsBlBnkMljg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed

## Skipped Venues

- Verne Club: no_hero_image

## Safety Checks

- no_supabase_writes: yes
- no_public_venues_writes: yes
- no_cloudinary_uploads: yes
- no_image_rights_approval: yes
- no_ui_files_touched: yes
- no_external_model_calls: yes
- no_migrations_created_or_applied: yes

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
