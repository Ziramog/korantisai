# Supabase Staging Dry Run Report

## Summary

- Batch id: batch_006_nyc_rooftop
- Approved count: 7
- Blocked count: 5
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
- Partial writes detected: no
- staging_venues rows for batch: 0
- venue_images rows for approved venues: 0
- selected hero image rows for approved venues: 0
- quality_scores rows for approved venues: 0
- 0 staging_venues rows found for batch batch_006_nyc_rooftop.
- 0 venue_images rows found for approved venue ids.
- 0 selected Stage 08 hero image rows found for approved venue ids.
- 0 quality_scores rows found for approved venue ids.

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

- Maison Provence Restaurant: target ChIJM83r0aZZwokRg1mla_ag7Rw; category bar; neighborhood Williamsburg; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPfI9V_PCeuMtUOwz6JnX8gyrhUxaDTE6vSmkM3DTezRf-cR_81aRxoWP14APq98xkkdZD_spMehwt56Q856CCh4BgYiGGsB-b3HBbOP8csQH4H5s6OFbepIxUp2wEW4mg0getS9XtfGwgahTymi4y4Sg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- With Others: target ChIJPygkVEZZwokRKQzWA9zRYcA; category bar; neighborhood Williamsburg; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNo3ty_waF-w-jxuThgYx_zhVQnQ_UmlwG8gf1ifjFKUgj9zhWiLZNrh8qurwwX626r9CgPAHRz9_DpXoocN-Auysgje5Lznr2F2qk5ws5Ov5aut82u_QUYRzESAzIIlwTeTvQ2L7nsnk7ceCpPHz2P6A=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Olympia: target ChIJdxDMsTNawokR8-y6Eqqz4T8; category bar; neighborhood DUMBO; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNeuFRwJrV7Sp55oBMBq-bxOFPKwYsxpVjItsVAvR3xFxV5aHxUbrVgLYNmGvitSm8LoiUHIwZvuBwiM5MXN659kOg2-PGjFJIdtDemAejQnWbe0S_ViUtO3CsfsOocIKRS7LS9UC7ROU4N1Mc=s4800-w1600-h1535; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Anaïs: target ChIJR9uKg5tbwokR-45Jeyx40ms; category bar; neighborhood Brooklyn Bridge Park; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPTYFzbfRNRnbxzxfMYLtwZLTNxRruEQsdfNW4Gj8GeXEXJk6gCw3IC2e-5QvxvvH09X1VObkHFkGpbdInG-xb2B2mU_WkVqdRthwF-FVuL64G9WFToWjLBv4o7RVOG23qOIstI3P9y92wRAMoKdK2fCQ=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Balvanera: target ChIJvRNghoFZwokR8r6CDQqyalA; category bar; neighborhood Lower East Side; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNPv2xcrNsXn9ADUBBaKdw2pnrOgVJk8rXoM2qx4q5N3aw-J6le7ld_SjSOqzec3BFSqifRXgUdHs_BvKIljDmnD5X16GDIqgF8AVUzdM_sqsTMeoEg9tCKKVpCfDff0czvbHGTYFZ2SOAwxBg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Brick Wine Bar: target ChIJZ3m5L6xZwokRq3Gyu3EDuuE; category bar; neighborhood Lower East Side; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMyz1BEmjI1rx1MSAO-JjpUrnla7ECO-bDdvOkRFBKknd9DH22CmvYmImcBJuxH3WoQBzfe6ND8WqyI5h1utKSWEbVXAYlOjRjbDQSl073d1aH7q7NhhGG8vSAHZk-DxFvcIeS3IPJZGle1b9U=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Ainslie Bowery: target ChIJYX4u-qRZwokRzEn18urM0vM; category bar; neighborhood Bowery; hero https://ainsliebowery.com/wp-content/uploads/2026/05/hpSlide-BeerGarden.jpg; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings missing_instagram

## Skipped Venues

- Woodhul Wine Bar: no_hero_image
- Pinkerton Wine Bar: no_hero_image
- Black Mountain Wine House: no_hero_image
- Somm Time: no_hero_image
- Jadis: no_hero_image

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
