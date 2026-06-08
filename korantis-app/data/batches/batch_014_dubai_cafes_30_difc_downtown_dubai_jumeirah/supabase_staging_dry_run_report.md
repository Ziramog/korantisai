# Supabase Staging Dry Run Report

## Summary

- Batch id: batch_014_dubai_cafes_30_difc_downtown_dubai_jumeirah
- Approved count: 23
- Blocked count: 7
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
- 0 staging_venues rows found for batch batch_014_dubai_cafes_30_difc_downtown_dubai_jumeirah.
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

- Caju Coffee House: target ChIJAd4hBttpXz4RgU0Osdvtd4Y; category cafe; neighborhood Downtown Dubai; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOExB-EShY1nEHrQqadhJXAOxnuJLP5nP3_26VX9HJMj7hzKEpxJPj0M9HmyaoeGjLi5myk6xiFu4Og-m1v6ODdn-c-yydezZCl82_kAMT-zX_Zgxhrml96vSt9FaVEDVKNQDQ5eWy5M2Yvurpm9Cs0=s4800-w1600-h1365; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Mokha 1450 Coffee Lounge: target ChIJuwG5IGNrXz4RAucY1xKuvsk; category cafe; neighborhood Palm Jumeirah; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNSdKOyyB839cK9OLukxsYcx7HqNs9-_fRUoOcnm5b3uay2iuFOdwFKO2sSVJiJkOu1AhWZ9m-mhUun5fB15V6VDcH9k7nFZTHGv8pU2eAkMPUTVCSVlMCxX_gLj-XJJjIA1_HtkKbKaUeQpw=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Roasters Specialty Coffee House Palm Jumeirah Mall: target ChIJ3UefQjBrXz4RMjKz9hsBiVE; category cafe; neighborhood Palm Jumeirah; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMKQBM3P888DWwwLYRWf3wf-XFMYgPFUNfM-L0INiF8KG0ynzfTvsrhvIHb1SSBMYQLXi59z4fr5a-PsU0xFO3_vSV_rSVjZYDyi4Dh1NyQkCKtweaD_zSENGre9plNDMPTHFTKP-a93nlThnjDXkVM2w=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Cafe Wayfarer: target ChIJVdjGRhFDXz4RJsyA5G7IUxY; category cafe; neighborhood DIFC; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNWFWNQCnKnlSOH6JNe1XRU3LUUbgqBT0bES8V92C8OUwtXsHCSeyf6a2g_SHp3U5fy0AsIOMMZ4DRHVztlNVyR4JnFrfJGJoLSSAAGPv92NKjeJ8H55upbi7rH_SUCEMg1O161BXl8wDfIGA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Orijins: target ChIJddeXXQJDXz4RZ5arWL-5NbY; category cafe; neighborhood DIFC; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNtwE1IXbThv94HUuDfO2C-DTC5TMJdBL3RWUc8tMPkszwzzDgCy7L4aEp4aQ0zBsxIJ4NAT_ruSZEJFwjzv3thCptjzP8kf6RXpQ98npUyxAfp3q-WQeXXtKlGTVCJW7D3hBDL65vesGxXhA2URiBjjQ=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Have Coffee - DIFC: target ChIJsdzetbdDXz4RekMZD5STjGQ; category cafe; neighborhood DIFC; hero https://images.squarespace-cdn.com/content/v1/61a881e4f23025786b03b6c9/d0a569e0-d7dd-4c9f-b7ae-20b63fddcfc9/Interior.jpeg?format=2500w; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings missing_instagram, missing_price_hint
- Coffee Planet - Foundry Downtown: target ChIJHzv3R0BpXz4RmNkldot8DjY; category cafe; neighborhood Downtown Dubai; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNvExlgOyhrRtrK52sBR3gsMfNX8D4s5Unf_iXeMhepYRSqIe3wjZmYHsIe4_6k5zDBcqhJQe99J2p3XInlNcBgI3soMqkgR-bTX9abAj0CPQ8QIFyuOYOjhfvftai5eeObvZUn7dizkhrMe4M=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- The Coffee Merchant: target ChIJjbP3zj5pXz4RMN-Upw9VHHM; category cafe; neighborhood Downtown Dubai; hero https://lh3.googleusercontent.com/place-photos/AJRVUZO_D_Ns4o6Ed82NEbzrhgK5y2Aj7vfIWdhW_eRB97jQUSTuJheL4lWT66Bb16SI50ZmtkuLeToYnZOtsuuJUSMDm1BkWggC8mVMFR9hUzWr2B22C1bobr6R6f0W4gFFFui2ydYeb0Q9usZx54RUj6Mz=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Summer Soul Boutique - West Beach: target ChIJNc3JynZDXz4RHokaKJMvs7I; category cafe; neighborhood Palm Jumeirah; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOxdmBGd89HbLognZHzYHt6os80oVV2-S4ZRSBj8tDqnlE6viM2fiwdb0rQY5c8deIRLlIbt14kwuERfZPWAFYRuJmVsU8Xf_21oGVs-xfa7LILSLw4D2GAcq7iYXFDs7u85agYBHUPh7LimBo=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Brews Cafe: target ChIJk1GdBdNpXz4RnZlaoZa6Bns; category cafe; neighborhood Business Bay; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMJ45ZGowY0xrdE4D1S6jE8J7oRJmewTmDTWf9a-qwyZ5Zmgz6EhsxceKfX28tTnmIygOPIp_LYs_HYQnZe078qmkzmfLBcPMXPeSXnIg_YWU_xZter909Uj6SqjcSC7vx_Xlx7-7XzvElgkQ=s4800-w1600-h1135; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Roasters Specialty Coffee House Al Wasl: target ChIJQboZtNhfXz4RFvKQyydmFDg; category cafe; neighborhood DIFC; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPKL6Foo_hEvId405YUE-bSAy7CO6MXH2ztQ0yYyx7E6t6nulHWpcepjblV8oRsK0T5RmKR-p_ZTq-qut9Uqzc_mAFY0eeosw8SoYTb1D_Ktck0P-NFBR8J6nMrP94oDiZaXX0FYbUkMZWrbXcb6MTs1w=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Risen Café and Artisanal Bakery, Palm Jumeirah: target ChIJhU5HmbdrXz4R3BN2VNh367A; category cafe; neighborhood Jumeirah; hero https://risendubai.com/wp-content/uploads/2022/08/gallery-locations-17.jpg; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings missing_instagram, missing_price_hint
- Risen Café and Artisanal Bakery, Business Bay: target ChIJzyz4ZHhpXz4RG2CLve4U-rU; category cafe; neighborhood Business Bay; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNIpZB2oGKgm1sHGN1zhAMjDnfv0TW6CORit1-6PUOh6RvCmS8cMK93sNZ3rreEUf_1QuJNBQEWbiNC1BDA6JdCTImQ8zl9jdxbK8J2esFbueaXe9nMr_hpFrWiLps5h8p7ix3R60HwPYl2uSF3CDO0=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- % ARABICA DIFC LIMESTONE HOUSE: target ChIJfaoS6OlDXz4RnTwOXA60M6I; category cafe; neighborhood DIFC; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMiLHnBYceWikX58Tx4rNmKoFBRSkgoAhEt3_7kM4Be9LwacMWVfTv-g72FRhgg6dT5MLe8NE9_SZ_ogpU-quUtqV2kg69OI7pAnmU4cyTOJDb8r17_owQWPoMXWwc4SqOXtWbZhdcxQiTsK_w=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Boon Coffee Roasters Downtown: target ChIJY4w1meRDXz4RGC3bxG2Lzfo; category cafe; neighborhood Downtown Dubai; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNwT5XfR7pJPtVgB7MR85YCLmRnvcDE_VAWGCISQKMve8cYLg2PlWYU8pIWwDpc88OBQFebBLSvot3b2U2wQyFuSQbqULH-dh1bHD3LRpmM03FanRGM6AetA6yVpbSV4jsIXHaFeT8tTyZQomNGig-A=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Caffeine Coffee Roaster: target ChIJE4472mBDXz4RN-EvO5WYtsQ; category cafe; neighborhood Downtown Dubai; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOf0e-4t-_X7QPUGv_lYZAR4GbZo0ZpUl4YCzMVV0ax_4JKUhNCVNYkZgrWmWK_zetoyw6g8oVxfteI1V5dCKNI-Q2RhpDaQUoPXKWOefWeJZuUNoLGAyWSfce1OUYuDPgU9sZl_XSD5ZJeyUzEIhzTuQ=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- MOY SPECIALTY COFFEE: target ChIJY1S67ZlrXz4RjgYIKAZP5n4; category cafe; neighborhood Jumeirah; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPPnhH-Tf8EIRuXuRU89SmZvns7M32GCYJ6x8w-LjW-EfH9MrdFZVMBXikVKmYjB-aM0a2-tY18rS0rfNiLj3CTv0nEWwHPvz0vTUSLFMlwK6wo7Yplig2ZYRdKdURDt-pEp55qwX8Cb-JsWHLrFqPynA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Roasters Specialty Coffee House Dubai Hills: target ChIJ30cOMQBpXz4RiIqnBGaUbFs; category cafe; neighborhood Jumeirah; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPr4VFfpWyCmX0UnhxefnsyCcycOoVn3gYwHOQw_EotZ6NRJO4YmDHCONURGdAPS5xv8gL61ZtRS9QXyXVdO1AnQFYswVEkGKuZX-RS4k2PEr9OuTO_sFmtBfgtV0PvIKvB0zDThzB-ppatclLFfO5C9g=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Boon Coffee Roasters - Palm Jumeirah Mall: target ChIJQ6zxD4xrXz4R7RHttLovnSQ; category cafe; neighborhood Palm Jumeirah; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOJucPuwFDifdVBH5eGxJ2znxtZeJ2t43Y7zD6jnZOCILWPU04enNXYlCr5WW1rdu1VukqA9nynhqlCtWbSLZFiAiAI0_ILzmG1fIHWBUDipcfrTuhed_xh3CUgj3JrYZ7dMMailMxT2iSIx9OZ4MrGzg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- % ARABICA DUBAI ROASTERY: target ChIJU_1y5pBrXz4R8Ukftad3mL8; category cafe; neighborhood Palm Jumeirah; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPMMZFfhp4cadu-39Bs5PNS3llP5jJZLTCAma-JUjWhtfXcy68Gto_hOtTXUHWH7WGcHCr16tof9YztKOraIoDTFoOSE8Ocg_OsgflJMeDyJuozkKv-MtoVnzcXsod8YjqD2AKXMg9N-BmZD7EvdSaC=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Ores Cafe: target ChIJh_3J4UNDXz4Rk_Q7lARKhYY; category cafe; neighborhood Jumeirah; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOPLMca-Te9neMzJmUCB1kI5N9MZljv5EcBvunwfLEEue0HBrEgTURLYVc1gm-El1AhkcD3j8VX_tJXc0MMo6H8WHGlwt6wQSbGFl4gRe4K017mrx4RLThBCiuy6GF2iGEN59B4eVMKKnAdZHI=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Kimi - Speciality Coffee and Food: target ChIJfc-CWUtpXz4R5NFEr1RVyJY; category cafe; neighborhood Business Bay; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPiwhkV-DTBP6VrYojMn2UvYxB8O2v447s9mAKLbDsdGS0pW3lF3U8qkI38_dWMvx9GCVKdRiBFtb0eh7CI48ZrPiM6ZVRi-kYYTB3-o9aMsW6SO9kkQBuZ_2J26vZMhP0stA-GsxIZCPtljJSXaWuptw=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Circle Cafe (Bay Square): target ChIJqYALXjBoXz4R90--rnBoPBY; category cafe; neighborhood Business Bay; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOexMzLV8n7mmcxSpCVpA3um8dbejvgq7esWjqBG17sdo8_7xPZ8ErbR1TdA_qP1HuusXVMOY7okpKFNXoj9LFNTYUrshY362yqMRh33LDQ7PtqQdBG69bNc4U_DGxGSwS3kZMOm_Uq-8PM17ludW3C=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed

## Skipped Venues

- Kulture House Dubai: no_hero_image
- Roasters Specialty Coffee House Emaar Beachfront: no_hero_image
- Roast Speciality Coffee, Marina: no_hero_image
- Drinkit: no_hero_image
- The lost Restaurant and Specialty coffee: no_hero_image
- Fuze Cafe Marina | Specialty Coffee: no_hero_image
- Roasters Specialty Coffee House Sobha Hartland: no_hero_image

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
