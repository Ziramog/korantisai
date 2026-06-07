# Supabase Staging Mapping Dry Run

- Batch: batch_003_stage01_test
- Generated: 2026-06-07T18:37:51.089Z
- Dry-run only: yes
- venue_images conflict key for apply: venue_id,photo_reference
- venue_atmosphere excluded from apply: yes

## Required venue_images Index

```sql
create unique index if not exists venue_images_venue_photo_reference_uidx
on venue_images (venue_id, photo_reference);
```

## Venue Mapping

### Oporto Almacén

- Source id/name: ChIJ9_Wpip-2vJURSyBdySgpgsM
- Target staging id: ChIJ9_Wpip-2vJURSyBdySgpgsM
- Category: restaurant
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOgdv00ehatYmLrTbHtDjxh97vc2uJ1xct6xt6E8REZMPsyAbsOG0YBLsc3vaQZwvvz6Scj4yIgo7crjv7qkXZh2IqsIEHWY35gUhFBtqYAg_5SWrBqKHiKohHdI6rMsRhnkMRamnw4hQQA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, date_night
- Tagline: Oporto Almacén: warm restaurant character in Palermo
- Description: Oporto Almacén is a restaurant in Palermo with a warm, cozy atmosphere. The selected interior image shows usable venue atmosphere; Google Places support is strong, with 4.2 stars across 2,937 reviews.
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

### Gran Bar Danzon

- Source id/name: ChIJh9Qpx7nKvJURLoDB8VNMen8
- Target staging id: ChIJh9Qpx7nKvJURLoDB8VNMen8
- Category: bar
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMe7ZK04hhcFZpmum5-VX-3D20w2pYdTYPS9wpx9l852OZR7fmd-v4DMBYFByyxUhC6TiwN4VJl-f-u6K1raP3oP8b38EyZ2nFyjzKL9dxSHKlIVYtLVLyW_2hXttif2hFu0dYiegejKB4KFW21cueoog=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, late_night, cinematic, social
- Tagline: Gran Bar Danzon: intimate bar energy in Retiro
- Description: Gran Bar Danzon is a bar in Retiro with a dark, intimate atmosphere. The selected interior image shows usable venue atmosphere; Google Places support is strong, with 4.4 stars across 4,427 reviews.
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

### La Biela

- Source id/name: ChIJPXhNCKPKvJUREtJrc0ejdKs
- Target staging id: ChIJPXhNCKPKvJUREtJrc0ejdKs
- Category: cafe
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZP3JAAzYrl7uxp-dt4TT1mFER_wen6NyADvRwyqZY-b0eR_ftb03KGAGiquII0Qfc53cGntZQo3JPmHxSEos_zzE_DJ4fO-Q3YI7qh-y_dX-TxvOen8nM8K9JOMBTDdLwnMeT5em9aJo50KtkdgsGL0Iw=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, historic
- Tagline: La Biela: warm cafe character in Recoleta
- Description: La Biela is a cafe in Recoleta with a warm, cozy atmosphere. The selected exterior image shows usable venue atmosphere; Google Places support is strong, with 4.2 stars across 13,184 reviews.
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

### Floreria Atlántico

- Source id/name: ChIJJY8xLrHKvJURGgoMqdg8pXE
- Target staging id: ChIJJY8xLrHKvJURGgoMqdg8pXE
- Category: cocktail_bar
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZM6lrlD79XbHm_drZPNel-U_afqj9TDr9JvKGf__UD_HJajx0RwevxCnmLc0uEQli1-1SksLIkOQGGcreIDJj_gqDCpgh8Sj103e3gqqjQcqLIhXnfEKW55aY7r-FX5EZsTcA6ZcHo1QZQMsBlBnkMljg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, late_night, cinematic, social
- Tagline: Floreria Atlántico: intimate cocktail bar energy in Retiro
- Description: Floreria Atlántico is a cocktail bar in Retiro with a dark, intimate atmosphere. The selected interior image shows usable venue atmosphere; Google Places support is strong, with 4.2 stars across 7,842 reviews.
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

