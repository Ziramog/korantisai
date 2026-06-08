# Supabase Staging Mapping Dry Run

- Batch: batch_006_nyc_rooftop
- Generated: 2026-06-08T03:16:50.440Z
- Dry-run only: yes
- venue_images conflict key for apply: venue_id,photo_reference
- venue_atmosphere excluded from apply: yes

## Required venue_images Index

```sql
create unique index if not exists venue_images_venue_photo_reference_uidx
on venue_images (venue_id, photo_reference);
```

## Venue Mapping

### Maison Provence Restaurant

- Source id/name: ChIJM83r0aZZwokRg1mla_ag7Rw
- Target staging id: ChIJM83r0aZZwokRg1mla_ag7Rw
- Category: bar
- Neighborhood: Williamsburg
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPfI9V_PCeuMtUOwz6JnX8gyrhUxaDTE6vSmkM3DTezRf-cR_81aRxoWP14APq98xkkdZD_spMehwt56Q856CCh4BgYiGGsB-b3HBbOP8csQH4H5s6OFbepIxUp2wEW4mg0getS9XtfGwgahTymi4y4Sg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, romantic, intimate, hidden_gem, refined
- Tagline: A cozy French bistro with a lush, plant-filled interior in the heart of Williams
- Description: Maison Provence presents a charming French bistro aesthetic with its plant-filled interior, blue-and-white striped awning, and warm lighting. The eclectic shelves and cozy distressed wooden chairs create an intimate, refined atmosphere in the heart of Williamsburg.
- Quality status: ready_for_db_staging
- Warnings: medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed

#### staging_venues
- Operation: upsert
- Unique key: id
- Fields: id, name, city, category_seed, status, canonical_data, atmosphere_prose, enrichment_data, pipeline_batch_id, pipeline_status, eligibility_score, primary_atmosphere, mood_tags
- Skipped: curation_status (Column curation_status not found on live staging_venues schema probe.); eligibility (Column eligibility not found on live staging_venues schema probe.); evidence (Column evidence not found on live staging_venues schema probe.); best_for (Column best_for not found on live staging_venues schema probe.); grounded_description (Column grounded_description not found on live staging_venues schema probe.); curation_notes (Column curation_notes not found on live staging_venues schema probe.)

#### venue_images
- Operation: upsert
- Unique key: venue_id + photo_reference
- Fields: venue_id, photo_reference, google_photo_reference, width, height, is_cover, status, url, role, source, quality_score, hero_suitability_score, selection_data, rights_status, is_selected_hero, sort_order
- Skipped: photo_scores (Column photo_scores not found on live venue_images schema probe.)

#### quality_scores
- Operation: upsert
- Unique key: venue_id
- Fields: venue_id, review_count, has_images, has_prose, has_embeddings, editorial_themes, interpretation_notes, atmosphere_word_count, last_processed_at, pipeline_quality_data
- Skipped: none

#### venue_atmosphere
- Operation: insert
- Unique key: venue_id
- Fields: venue_id, prose, word_count, model
- Skipped: * (Skipped for real sync unless confirmed compatible: known venue_atmosphere schema references public.venues, not staging_venues.)

### With Others

- Source id/name: ChIJPygkVEZZwokRKQzWA9zRYcA
- Target staging id: ChIJPygkVEZZwokRKQzWA9zRYcA
- Category: bar
- Neighborhood: Williamsburg
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNo3ty_waF-w-jxuThgYx_zhVQnQ_UmlwG8gf1ifjFKUgj9zhWiLZNrh8qurwwX626r9CgPAHRz9_DpXoocN-Auysgje5Lznr2F2qk5ws5Ov5aut82u_QUYRzESAzIIlwTeTvQ2L7nsnk7ceCpPHz2P6A=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, social, late_night
- Tagline: A warm corner bar in Williamsburg for lingering over drinks
- Description: The interior features a curved white bar counter as the focal point, flanked by warm wall sconces and ambient candles that create soft lighting throughout. Acoustic ceiling panels and a ceiling fan add to the comfortable, lived-in feel, while patrons seated at the bar and in booths suggest a lively but not overwhelming social energy.
- Quality status: ready_for_db_staging
- Warnings: medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed

#### staging_venues
- Operation: upsert
- Unique key: id
- Fields: id, name, city, category_seed, status, canonical_data, atmosphere_prose, enrichment_data, pipeline_batch_id, pipeline_status, eligibility_score, primary_atmosphere, mood_tags
- Skipped: curation_status (Column curation_status not found on live staging_venues schema probe.); eligibility (Column eligibility not found on live staging_venues schema probe.); evidence (Column evidence not found on live staging_venues schema probe.); best_for (Column best_for not found on live staging_venues schema probe.); grounded_description (Column grounded_description not found on live staging_venues schema probe.); curation_notes (Column curation_notes not found on live staging_venues schema probe.)

#### venue_images
- Operation: upsert
- Unique key: venue_id + photo_reference
- Fields: venue_id, photo_reference, google_photo_reference, width, height, is_cover, status, url, role, source, quality_score, hero_suitability_score, selection_data, rights_status, is_selected_hero, sort_order
- Skipped: photo_scores (Column photo_scores not found on live venue_images schema probe.)

#### quality_scores
- Operation: upsert
- Unique key: venue_id
- Fields: venue_id, review_count, has_images, has_prose, has_embeddings, editorial_themes, interpretation_notes, atmosphere_word_count, last_processed_at, pipeline_quality_data
- Skipped: none

#### venue_atmosphere
- Operation: insert
- Unique key: venue_id
- Fields: venue_id, prose, word_count, model
- Skipped: * (Skipped for real sync unless confirmed compatible: known venue_atmosphere schema references public.venues, not staging_venues.)

### Olympia

- Source id/name: ChIJdxDMsTNawokR8-y6Eqqz4T8
- Target staging id: ChIJdxDMsTNawokR8-y6Eqqz4T8
- Category: bar
- Neighborhood: DUMBO
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNeuFRwJrV7Sp55oBMBq-bxOFPKwYsxpVjItsVAvR3xFxV5aHxUbrVgLYNmGvitSm8LoiUHIwZvuBwiM5MXN659kOg2-PGjFJIdtDemAejQnWbe0S_ViUtO3CsfsOocIKRS7LS9UC7ROU4N1Mc=s4800-w1600-h1535
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, refined, date_night
- Tagline: An intimate wine bar in DUMBO with warm candlelit ambiance
- Description: Olympia occupies a warm, inviting space in DUMBO with a curved wooden bar, pendant lighting, and candlelight casting a soft glow across yellow-cushioned stools and a back bar lined with bottles.
- Quality status: ready_for_db_staging
- Warnings: medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed

#### staging_venues
- Operation: upsert
- Unique key: id
- Fields: id, name, city, category_seed, status, canonical_data, atmosphere_prose, enrichment_data, pipeline_batch_id, pipeline_status, eligibility_score, primary_atmosphere, mood_tags
- Skipped: curation_status (Column curation_status not found on live staging_venues schema probe.); eligibility (Column eligibility not found on live staging_venues schema probe.); evidence (Column evidence not found on live staging_venues schema probe.); best_for (Column best_for not found on live staging_venues schema probe.); grounded_description (Column grounded_description not found on live staging_venues schema probe.); curation_notes (Column curation_notes not found on live staging_venues schema probe.)

#### venue_images
- Operation: upsert
- Unique key: venue_id + photo_reference
- Fields: venue_id, photo_reference, google_photo_reference, width, height, is_cover, status, url, role, source, quality_score, hero_suitability_score, selection_data, rights_status, is_selected_hero, sort_order
- Skipped: photo_scores (Column photo_scores not found on live venue_images schema probe.)

#### quality_scores
- Operation: upsert
- Unique key: venue_id
- Fields: venue_id, review_count, has_images, has_prose, has_embeddings, editorial_themes, interpretation_notes, atmosphere_word_count, last_processed_at, pipeline_quality_data
- Skipped: none

#### venue_atmosphere
- Operation: insert
- Unique key: venue_id
- Fields: venue_id, prose, word_count, model
- Skipped: * (Skipped for real sync unless confirmed compatible: known venue_atmosphere schema references public.venues, not staging_venues.)

### Anaïs

- Source id/name: ChIJR9uKg5tbwokR-45Jeyx40ms
- Target staging id: ChIJR9uKg5tbwokR-45Jeyx40ms
- Category: bar
- Neighborhood: Brooklyn Bridge Park
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPTYFzbfRNRnbxzxfMYLtwZLTNxRruEQsdfNW4Gj8GeXEXJk6gCw3IC2e-5QvxvvH09X1VObkHFkGpbdInG-xb2B2mU_WkVqdRthwF-FVuL64G9WFToWjLBv4o7RVOG23qOIstI3P9y92wRAMoKdK2fCQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, date_night, refined, quiet
- Tagline: A neighborhood wine bar with warm light and curated bottles
- Description: Anaïs is a neighborhood wine bar in Brooklyn with a warm interior featuring tall wine shelving, candlelit high-top tables, and large street-facing windows. Open daily from morning to late night, it offers a curated wine selection in an intimate setting.
- Quality status: ready_for_db_staging
- Warnings: medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed

#### staging_venues
- Operation: upsert
- Unique key: id
- Fields: id, name, city, category_seed, status, canonical_data, atmosphere_prose, enrichment_data, pipeline_batch_id, pipeline_status, eligibility_score, primary_atmosphere, mood_tags
- Skipped: curation_status (Column curation_status not found on live staging_venues schema probe.); eligibility (Column eligibility not found on live staging_venues schema probe.); evidence (Column evidence not found on live staging_venues schema probe.); best_for (Column best_for not found on live staging_venues schema probe.); grounded_description (Column grounded_description not found on live staging_venues schema probe.); curation_notes (Column curation_notes not found on live staging_venues schema probe.)

#### venue_images
- Operation: upsert
- Unique key: venue_id + photo_reference
- Fields: venue_id, photo_reference, google_photo_reference, width, height, is_cover, status, url, role, source, quality_score, hero_suitability_score, selection_data, rights_status, is_selected_hero, sort_order
- Skipped: photo_scores (Column photo_scores not found on live venue_images schema probe.)

#### quality_scores
- Operation: upsert
- Unique key: venue_id
- Fields: venue_id, review_count, has_images, has_prose, has_embeddings, editorial_themes, interpretation_notes, atmosphere_word_count, last_processed_at, pipeline_quality_data
- Skipped: none

#### venue_atmosphere
- Operation: insert
- Unique key: venue_id
- Fields: venue_id, prose, word_count, model
- Skipped: * (Skipped for real sync unless confirmed compatible: known venue_atmosphere schema references public.venues, not staging_venues.)

### Balvanera

- Source id/name: ChIJvRNghoFZwokR8r6CDQqyalA
- Target staging id: ChIJvRNghoFZwokR8r6CDQqyalA
- Category: bar
- Neighborhood: Lower East Side
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNPv2xcrNsXn9ADUBBaKdw2pnrOgVJk8rXoM2qx4q5N3aw-J6le7ld_SjSOqzec3BFSqifRXgUdHs_BvKIljDmnD5X16GDIqgF8AVUzdM_sqsTMeoEg9tCKKVpCfDff0czvbHGTYFZ2SOAwxBg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: outdoor, cinematic, social, late_night, hidden_gem
- Tagline: A Lower East Side patio with exposed brick, murals, and string lights
- Description: Balvanera anchors the Lower East Side with a sidewalk patio framed by exposed brick, a bold mural, and soft string lighting overhead. Metal bistro chairs and wooden tables create an unpretentious yet atmospheric setting for evening drinks and weekend brunches.
- Quality status: ready_for_db_staging
- Warnings: medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed

#### staging_venues
- Operation: upsert
- Unique key: id
- Fields: id, name, city, category_seed, status, canonical_data, atmosphere_prose, enrichment_data, pipeline_batch_id, pipeline_status, eligibility_score, primary_atmosphere, mood_tags
- Skipped: curation_status (Column curation_status not found on live staging_venues schema probe.); eligibility (Column eligibility not found on live staging_venues schema probe.); evidence (Column evidence not found on live staging_venues schema probe.); best_for (Column best_for not found on live staging_venues schema probe.); grounded_description (Column grounded_description not found on live staging_venues schema probe.); curation_notes (Column curation_notes not found on live staging_venues schema probe.)

#### venue_images
- Operation: upsert
- Unique key: venue_id + photo_reference
- Fields: venue_id, photo_reference, google_photo_reference, width, height, is_cover, status, url, role, source, quality_score, hero_suitability_score, selection_data, rights_status, is_selected_hero, sort_order
- Skipped: photo_scores (Column photo_scores not found on live venue_images schema probe.)

#### quality_scores
- Operation: upsert
- Unique key: venue_id
- Fields: venue_id, review_count, has_images, has_prose, has_embeddings, editorial_themes, interpretation_notes, atmosphere_word_count, last_processed_at, pipeline_quality_data
- Skipped: none

#### venue_atmosphere
- Operation: insert
- Unique key: venue_id
- Fields: venue_id, prose, word_count, model
- Skipped: * (Skipped for real sync unless confirmed compatible: known venue_atmosphere schema references public.venues, not staging_venues.)

### Brick Wine Bar

- Source id/name: ChIJZ3m5L6xZwokRq3Gyu3EDuuE
- Target staging id: ChIJZ3m5L6xZwokRq3Gyu3EDuuE
- Category: bar
- Neighborhood: Lower East Side
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMyz1BEmjI1rx1MSAO-JjpUrnla7ECO-bDdvOkRFBKknd9DH22CmvYmImcBJuxH3WoQBzfe6ND8WqyI5h1utKSWEbVXAYlOjRjbDQSl073d1aH7q7NhhGG8vSAHZk-DxFvcIeS3IPJZGle1b9U=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, refined, date_night, romantic
- Tagline: A perfectly-rated wine bar in the Lower East Side with warm, candlelit evenings.
- Description: Brick Wine Bar occupies a candlelit space on Clinton Street in the Lower East Side, featuring wine bottles lining the shelves and an intimate bar setup. The cozy interior, highlighted by hanging glassware and warm lighting, creates a refined setting for evening wine experiences.
- Quality status: ready_for_db_staging
- Warnings: medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed

#### staging_venues
- Operation: upsert
- Unique key: id
- Fields: id, name, city, category_seed, status, canonical_data, atmosphere_prose, enrichment_data, pipeline_batch_id, pipeline_status, eligibility_score, primary_atmosphere, mood_tags
- Skipped: curation_status (Column curation_status not found on live staging_venues schema probe.); eligibility (Column eligibility not found on live staging_venues schema probe.); evidence (Column evidence not found on live staging_venues schema probe.); best_for (Column best_for not found on live staging_venues schema probe.); grounded_description (Column grounded_description not found on live staging_venues schema probe.); curation_notes (Column curation_notes not found on live staging_venues schema probe.)

#### venue_images
- Operation: upsert
- Unique key: venue_id + photo_reference
- Fields: venue_id, photo_reference, google_photo_reference, width, height, is_cover, status, url, role, source, quality_score, hero_suitability_score, selection_data, rights_status, is_selected_hero, sort_order
- Skipped: photo_scores (Column photo_scores not found on live venue_images schema probe.)

#### quality_scores
- Operation: upsert
- Unique key: venue_id
- Fields: venue_id, review_count, has_images, has_prose, has_embeddings, editorial_themes, interpretation_notes, atmosphere_word_count, last_processed_at, pipeline_quality_data
- Skipped: none

#### venue_atmosphere
- Operation: insert
- Unique key: venue_id
- Fields: venue_id, prose, word_count, model
- Skipped: * (Skipped for real sync unless confirmed compatible: known venue_atmosphere schema references public.venues, not staging_venues.)

### Ainslie Bowery

- Source id/name: ChIJYX4u-qRZwokRzEn18urM0vM
- Target staging id: ChIJYX4u-qRZwokRzEn18urM0vM
- Category: bar
- Neighborhood: Bowery
- Hero image reference: https://ainsliebowery.com/wp-content/uploads/2026/05/hpSlide-BeerGarden.jpg
- Image rights status: not_approved_for_publication
- Tags: warm, social, late_night, creative
- Tagline: A lush Bowery bar with communal tables, brick arches, and hanging greenery
- Description: A welcoming bar on Bowery featuring long communal wooden tables beneath exposed brick arches, framed by hanging greenery and stylized artwork. Natural light filters through side windows while string lights add warmth after dark.
- Quality status: ready_for_db_staging
- Warnings: missing_instagram

#### staging_venues
- Operation: upsert
- Unique key: id
- Fields: id, name, city, category_seed, status, canonical_data, atmosphere_prose, enrichment_data, pipeline_batch_id, pipeline_status, eligibility_score, primary_atmosphere, mood_tags
- Skipped: curation_status (Column curation_status not found on live staging_venues schema probe.); eligibility (Column eligibility not found on live staging_venues schema probe.); evidence (Column evidence not found on live staging_venues schema probe.); best_for (Column best_for not found on live staging_venues schema probe.); grounded_description (Column grounded_description not found on live staging_venues schema probe.); curation_notes (Column curation_notes not found on live staging_venues schema probe.)

#### venue_images
- Operation: upsert
- Unique key: venue_id + photo_reference
- Fields: venue_id, photo_reference, google_photo_reference, width, height, is_cover, status, url, role, source, quality_score, hero_suitability_score, selection_data, rights_status, is_selected_hero, sort_order
- Skipped: photo_scores (Column photo_scores not found on live venue_images schema probe.)

#### quality_scores
- Operation: upsert
- Unique key: venue_id
- Fields: venue_id, review_count, has_images, has_prose, has_embeddings, editorial_themes, interpretation_notes, atmosphere_word_count, last_processed_at, pipeline_quality_data
- Skipped: none

#### venue_atmosphere
- Operation: insert
- Unique key: venue_id
- Fields: venue_id, prose, word_count, model
- Skipped: * (Skipped for real sync unless confirmed compatible: known venue_atmosphere schema references public.venues, not staging_venues.)

