# Supabase Staging Dry Run Report

## Summary

- Batch id: batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side
- Approved count: 14
- Blocked count: 11
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
- 0 staging_venues rows found for batch batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side.
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

- Café Colmado: target ChIJxes_BwBZwokRMzXp44W-WiQ; category cafe; neighborhood Lower East Side; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNMTWttVtUwsjGK9rY8biSEKqzfBMS3z4__83SqutvApyrkj4oKvfeM8o0DUOGUdauD2ByQxbbWcJySJDm2BJoiLiuwjoW_p-A4jEje7qtN8ofzhgOgjYr-2NYlhPXLYE2rjlgys4EY_RejIw9cnyIy-w=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Intelligentsia Coffee High Line Hotel Coffeebar: target ChIJy6rdX7hZwokRYmiVJWN3XmQ; category cafe; neighborhood Chelsea; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOqWJ1f9Vr77lhu8ZSHg9MaaVYE0P9HspEHNLa4bQHinDoSrQGuQyrJ8jIJFLm-u4KbaM73IeJ9vcfQTCKmdNr4z60TAmigx_GMvP5rVXK5cjUoMH9B-_PmjH3Wrim1HBkLUnKSbnQxuf3kupU7zfRXGQ=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- RHYTHM ZERO | WEST VILLAGE: target ChIJHZO-cABZwokRP3Gty-exVkU; category cafe; neighborhood West Village; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMztCXgHyqc7TrZT6cZlOhqyLtolZCstGnU8CK5H1QByzS8iVmOKIFk8b9sFCI55ubcCfAJqOwOJJfMwXN7H08jRB1KdrZ46rZDv_-gDAko70oeHO67tYIyt-cYuoyWNYGt2XXTmpsVtRZGy_0diHSl=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Bakeri: target ChIJYRmchGdZwokRSTHrwrsym5M; category bakery_cafe; neighborhood Williamsburg; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNAnMjxA8OJSKJueLDAas0q6LSzdF0glLyQG3zN6eI4l-yx_g-xklOOVoPp_qMxLqs5hBDmJK2bJLiZ47RKo7M7KTp-2L5ha0hPAvGCPovKnuxW2H2duv1Fdc4e2lr0A94hyK-mZNwGFnvX_d0=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- A&C Super: target ChIJd4UuECFZwokRnGsyMaQn42Y; category cafe; neighborhood Williamsburg; hero https://lh3.googleusercontent.com/place-photos/AJRVUZM1Wl6tk5H2RSW57rNvbwGv1hTvK7AS-hDTQyFYWAHclm4GkFBQ_12Y1O1g7xXlZ3ZNtmB8fUwijZrAHdLcKhJ41-iNJhQOKR6pfSM0pUcHzec5CQU7pEa4ZZyZCbRMj4H-oudkghZhtus3-q-BwHrk=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Paris Baguette: target ChIJ7bjlk1VZwokRBK24C19g_0c; category cafe; neighborhood Williamsburg; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMBnyUY5ja3s8EDycgm4P_h3N-s2xBRXh6t_t7bMJCv7m-kk2_XSkcfkVz0yjMdhmgarWYnKJ9XMyfKoCd6IBEgB6miG3de5llMovoMFT7sRaoes1G6XZLt_lLYlusPKCb0_ILUyPK_aIbz3ZvQPRtbSA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Dawn’s Til Dusk: target ChIJFTVDEzFawokRp53c_hL03Bg; category cafe; neighborhood DUMBO; hero https://lh3.googleusercontent.com/place-photos/AJRVUZN15fLjG4T0QjOIZ0NU9V2D7fy7658O1oKkmZE7M3KIDnw82ODwynkIoRQt5Q-5Na3A78h_qtXwWFc18Xv7BX8r6JkvC3IC6wf2hfcB89eczKrKWVa3ztD1PTOF_RgZ8xnuutDfOIGovTEpNE3YVqLoUA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Kaida Coffee and Bakery: target ChIJkzkqDABZwokRl-Jxqks-gq4; category cafe; neighborhood Lower East Side; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNFRmudyf8HJViCW1Jo61gxVrV_AtDXc80lue7He7OpR23M1Xft3aDfzSmYGMIFaf6xuDs_wzXpdrvxeiz36LK6BRlMCW2_fLUJ-Y3n2BuYwqOEGXoG2JJNXz6kstKd9_gnuC2ucuKq3-Fq6ylscJLR=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- maman: target ChIJBTRVgQNZwokRCZlgLnLCbvg; category cafe; neighborhood West Village; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNTvNUdQGX1wnQQ-WAl0KBfFHoks8Z3k43azgdwe8gwCRDAtK2NQQkuXt4bRMsrY6RqimKQHGmrl7CMv7ku5qwVQivwXPo_D2Gx75HsRtecQJQa78-vIO_UfQ_PE4Rzt4QGPMKqLmr3Zm_D=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Aux Merveilleux de Fred: target ChIJzQKlfZVZwokRlYqgTIq1Pu0; category cafe; neighborhood West Village; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOczeaeVq7Kcq5rSsXuW6T3jLwn9PVtFGqfYPEi4e85245ID9MPnV15gAela7UBx8qtdF8f9hMI13q79_BTnofbbMXH5tiyWz6sAxo-oo6vTcCmP2yI74i2FNrpcM2iPC-9wGc2odZJ6R9DapKPxFU7dA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- maman: target ChIJPR-8N6RZwokROvrr-k3dqcw; category cafe; neighborhood NoMad; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNTvNUdQGX1wnQQ-WAl0KBfFHoks8Z3k43azgdwe8gwCRDAtK2NQQkuXt4bRMsrY6RqimKQHGmrl7CMv7ku5qwVQivwXPo_D2Gx75HsRtecQJQa78-vIO_UfQ_PE4Rzt4QGPMKqLmr3Zm_D=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Stumptown Coffee Roasters: target ChIJT2h1HKZZwokR0kgzEtsa03k; category cafe; neighborhood NoMad; hero https://lh3.googleusercontent.com/place-photos/AJRVUZO2jGTXIAcBj-MCXXVg-b9Pk5VctyBDwkflDkUlAq84Ffg1X1-6qYcBpg5YyjTDYNxPd6VTcJy6YI123nh7yaZXdAytItF5A_aljKPOHoZJ1WIT7WBfIhCigbtcXxpEdm-ymrdNQz3G4UqqM-qYYsb0=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Pura Vida - NoMad: target ChIJK-CuuZVZwokRBPbPoomm2Ig; category cafe; neighborhood NoMad; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMbshrwHUkT4qSxb-vZHGsF_nI_FYp57RvfbHT6CxIdxOPsEJLsOFLZsPRpuyXTAgVGcI_1TzmdIgWFadXkKwWkJ4mHsQtw2zUNU5AWVS_clwa_zl7VUMKIijAKjKuOD9D5_uiwu2sJw01NFyqpaAr1jg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Nick + Sons Bakery: target ChIJnZ5rvZRZwokRKXfBDWnfSW0; category bakery_cafe; neighborhood Williamsburg; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMCIXepgRVD66zR6gZvxbs91tXk0f_oF4qoxqhEg7Rjjt1zlsjcy9agMC8pkc-isAtcryikJgwyi080TUMG3DjcII15Yq2QDg7iAUmpzVN6x0k6MdQcOjxhKugV3KPKecBqJFIAQIU9LvkomDlDNAby=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed

## Skipped Venues

- Paper Sons Cafe: no_hero_image
- Yanni's Coffee: no_hero_image
- Sip Coffee & Matcha: no_hero_image
- Black Star Bakery & Cafe: no_hero_image
- Tous Les Jours: no_hero_image
- Almondine Bakery: no_hero_image
- Burrow: no_hero_image
- Rex: no_hero_image
- Bourke Street Bakery: no_hero_image
- La Bergamote (Chelsea): no_hero_image
- Claude Bakery West Village: no_hero_image

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
