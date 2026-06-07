# Supabase Staging Mapping Dry Run

- Batch: batch_004_buenos_aires_50
- Generated: 2026-06-07T20:38:06.208Z
- Dry-run only: yes
- venue_images conflict key for apply: venue_id,photo_reference
- venue_atmosphere excluded from apply: yes

## Required venue_images Index

```sql
create unique index if not exists venue_images_venue_photo_reference_uidx
on venue_images (venue_id, photo_reference);
```

## Venue Mapping

### Roster Cafe Recoleta

- Source id/name: ChIJk6WY8AjLvJURBfDnSDcMHxs
- Target staging id: ChIJk6WY8AjLvJURBfDnSDcMHxs
- Category: cafe
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPmjdIyGxM4x9LgA21OEzeaGFCyBh8sb0VXDjPdEaiXiDCMZQbUtPQJNxEhQowqK0EReIzhRb6gpKNDc3CXsfPEfIEmln-RCjkFnoFvYHPD7Md5so8OiTm5PvS7jkEoJRQudsUpT-pPZ3U8mq0iBfqb=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: refined, work_friendly, creative, social, quiet
- Tagline: Industrial warmth in Recoleta's heart
- Description: The interior features exposed pipe pendant lighting illuminating a wooden counter and round tables, with yellow metal stools and a bench with coffee sack cushions adding to the industrial character softened by warm wood tones and dark teal walls.
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

### Cobre Café

- Source id/name: ChIJYXJkJ6DLvJUR-aTBW9ihoQs
- Target staging id: ChIJYXJkJ6DLvJUR-aTBW9ihoQs
- Category: cafe
- Neighborhood: Villa Crespo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNgkD9LE1lpAGyygtfjUZIC3gx0LJs26F0ilDi4w3OdmjXQLmXesOd5XPE8vSt7H7-R6aLct5oCQ3M_3jpJV5egMvsdulWxIqnUBDoRRK2ot4LxYcPFWMR0RK1mPibuBsVebzopTUENmtbaPnA=s4800-w1600-h1573
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, creative, refined, quiet
- Tagline: Industrial café warmth in Villa Crespo with quality coffee focus
- Description: The hero interior reveals an industrial café space with exposed distressed concrete walls, professional espresso equipment, and a dedicated barista working behind the counter. Greenery and a pastry display add warmth to the industrial aesthetic, creating a refined yet approachable coffee environment.
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

### Borja Specialty Coffee

- Source id/name: ChIJeTwWI0G1vJURXiwf_rzAgNI
- Target staging id: ChIJeTwWI0G1vJURXiwf_rzAgNI
- Category: cafe
- Neighborhood: Belgrano
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOdU-f8GCKBwvEy8dQYBlo2Z9Z2Rm9O5nGEor6QIvjzBzXGN03ukNUA2YsHvS1UxnGhK9DnZjOYavsA4pVDToT5XsvHMEeKJS5FEjkJGZdTE8nmO0knhyoq3I6kqWHUR2AaA_38dFeJ1gLT37OHHYkPEQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, hidden_gem, creative, work_friendly
- Tagline: Specialty coffee that turns Belgrano evenings golden
- Description: This specialty coffee shop on Av. Juramento draws Belgrano locals with its warm evening glow and carefully sourced beans. The intimate space, marked by a distinctive mural and professional espresso setup, offers a refined coffee experience without pretension.
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

### Cosecha Almagro

- Source id/name: ChIJw9bL_ibLvJURgZNN0l0xwK8
- Target staging id: ChIJw9bL_ibLvJURgZNN0l0xwK8
- Category: cafe
- Neighborhood: Almagro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOMlDriSkP5lKRVcenkyGPoeCk4r9KsBRuyJHw3NwPrfiErxN20oLouKM0NGD7FKpue-sMnCMboX8zwU4zeIJpTNl7v7dYTs-4bo059N0xM6hKSvt6hoghC19wDA3Nf1oO8NJeUS_4asXR2QM-WE3vz=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, work_friendly, hidden_gem
- Tagline: Café de barrio en Almagro, donde el café se encuentra con la calidez
- Description: El interior de Cosecha Almagro presenta mesas de madera, sillas y una vitrina de vidrio que combina la oferta de café con elementos de retail. Un mural botánico en la pared y luminarias colgantes completan un espacio bien iluminado y acogedor, según la captura visual de alta calidad.
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

### Cuervo Café

- Source id/name: ChIJF19rgHjKvJURjAVINc8ud9k
- Target staging id: ChIJF19rgHjKvJURjAVINc8ud9k
- Category: cafe
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNHvociazTItNwQm6JUHuIawmsTWqG8eDka0L2t6oJO8IPIay7tVV1VYv3biAvy3-grKn4FcPYGeLdSI74-2H5WBp8MCF-uqwjc1g7Nk9qBZUgH7V7GSHXbmLk5MgWdYrAgcrp7_q9VUL-JIQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, social, creative, quiet
- Tagline: Palermo's neighborhood coffee ritual, served warm.
- Description: A neighborhood coffee shop in Palermo, Buenos Aires with an artisanal focus. The warm, cozy interior features a wooden counter, espresso machine, and display case stocked with baked goods—inviting for casual stops or unhurried mornings.
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

### Café Registrado

- Source id/name: ChIJicAeDJO1vJUR-IjBjxB3Gvk
- Target staging id: ChIJicAeDJO1vJUR-IjBjxB3Gvk
- Category: cafe
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOxXoEcjDVqiKOZYtyMXKp8JbQAYeKXF5C4Y4yhUwp9PdvP6FRBvMgTWnznwGYf332TV7QdkYQpumJ3I64wM14ilZTRwEGIqfFCir3ieccjYc1_j2Yez4URuLLHAEFlSyhsr1LVnoFSMRANeno=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: creative, work_friendly, social, intimate
- Tagline: A Palermo industrial hideaway with copper lights and concrete charm
- Description: Café Registrado anchors itself in Palermo's creative fabric with raw concrete walls and glowing copper pendant lights overhead. A neon sign adds urban edge while wooden tables and potted greenery soften the industrial space into a comfortable, work-friendly cafe.
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

### The Coffee Store Plaza Almagro

- Source id/name: ChIJN6fF8pvLvJURA4dGfXYBERc
- Target staging id: ChIJN6fF8pvLvJURA4dGfXYBERc
- Category: cafe
- Neighborhood: Almagro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNQ59qW2cnC53X0J3DTSnaWSCpjFfpjj31Jik9RhHrOrH5UE4YwhWMeUxfjvqoDcrZAOEH2h6SqxU9_WlQ49FDwxwb0ae3iahVfFeOwu0ytl-lSiLBLfBppMqpiHLMAD-2NjOPQzIiwkl3H73U=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: social, work_friendly, outdoor, refined
- Tagline: Bright coffee culture in Almagro
- Description: The Coffee Store Plaza Almagro presents a bright, modern coffeehouse facade with generous glass windows and outdoor seating on black metal furniture. The visible 'WE ARE COFFEE BELIEVERS' signage and dark gray storefront with brick upper level communicate a refined, contemporary coffee culture identity that has earned strong ratings from over 2,100 reviewers.
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

### Tostado - Puerto Madero

- Source id/name: ChIJjUnGSkM1o5URd7gTcnyE8u0
- Target staging id: ChIJjUnGSkM1o5URd7gTcnyE8u0
- Category: cafe
- Neighborhood: Puerto Madero
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNWjvw6mP1xTOexahuSM21MAl8csGQ2mjSJ_X-zhQDvsp06sogsfiCU52hp1BA3CWunh2D3p6YC1pN4Fq6dufJuCWOtKPl9a3O0jKjYCN0s8Yzcvrsv3rD2TMAvMotO1Sz3XNUl53spndSaCeFUYWVU=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, refined, work_friendly, date_night
- Tagline: Morning light on the waterfront, a quiet ritual in leather and espresso
- Description: Tostado's Puerto Madero location occupies a bright, airy space with leather seating and large windows overlooking the waterfront. Its branded espresso service and consistent 4.6 rating from over 2,600 reviews make it a reliable daily destination for locals in one of Buenos Aires' most scenic neighborhoods.
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

### Salvaje Bakery

- Source id/name: ChIJg-OHkOy1vJURFdHa5EARI14
- Target staging id: ChIJg-OHkOy1vJURFdHa5EARI14
- Category: cafe
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNJcrcimI1Wdfzjpv686sKobGUQTefRQOGslsmiAbo_anWrzFDk8l4plY84mc4e4zlWJtLTDZRVzTxK95-xJqtMxfuiZ6uskP6DLYDgi9GdAmQvj09ZYKh5FZdwu30UTVwmzM2lK5D8TUwmFLdoV1Au3Q=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, creative, intimate, quiet, hidden_gem
- Tagline: Art-covered walls, fresh pastries, Palermo's cozy corner
- Description: Salvaje Bakery occupies a warmly lit interior on Avenida Dorrego in Palermo, its walls densely covered in framed art, posters, and vinyl records beneath pendant lighting. The counter displays fresh breads and pastries in baskets with chalkboard price signs, while the overall eclectic decor creates a lived-in, neighbourhood café atmosphere.
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

### Barine - café de especialidad

- Source id/name: ChIJw18B1MK1vJURyF8zUKtXHz4
- Target staging id: ChIJw18B1MK1vJURyF8zUKtXHz4
- Category: cafe
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZORFLGoEIVayOiwRc7lCNryaA4ScGookzD97qwLo7RYGveCDXgu3yPlymIi3U_vJnlJZsumxg4mR9EHogVhegqjEzWJxZuHjwHdYQeoEO-qxDlpyAsJcXQN-dZV4YqNQLbT5Lgdk4ebI5EDU-3QKz6y=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, quiet, creative
- Tagline: Specialty coffee and pastries in a bright Palermo cafe
- Description: Barine is a specialty coffee destination in Palermo's Soler street, where the bright, open interior with warm wood furnishings creates an inviting space for coffee-focused visits. The cafe operates daily except Tuesdays, serving specialty coffee alongside pastries from early morning through evening.
- Quality status: ready_for_db_staging
- Warnings: medium_rights_risk, missing_website, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed

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

### Le Rêve Bistró

- Source id/name: ChIJE58EBl-1vJURHtsTcL9whmQ
- Target staging id: ChIJE58EBl-1vJURHtsTcL9whmQ
- Category: restaurant
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPhojQn6LqAcHdxyuimiGq7W_aY-2xTqfQb8MuM0z-KA-fQKawXPVT_26SRXXkNUTTe-8_4TJXuRv-Ly8FCZjbI4D0_YrKU7OLDONOGmHis-XTPOkQZYllXkJHXop9uSm2ZfJ2A_JRPYvM7Qjuz1766kA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, romantic, intimate, date_night
- Tagline: An intimate corner in Palermo's vibrant heart
- Description: Located on Nicaragua Street in Palermo, this bistro features warm pendant and table lamp lighting, round wooden tables, green banquette seating, and subway tile accents that create a cozy, inviting dining room.
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

### Las Pizarras bistro

- Source id/name: ChIJdX2NaIS1vJURhzjb3PlEhjA
- Target staging id: ChIJdX2NaIS1vJURhzjb3PlEhjA
- Category: restaurant
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOTFg--M_EDGy_Fq0Y1qIVNsJjXg-3BePR6LUVYybHpr4ofHg2T7aB_Pwobbaf4HJB31dTTRXqsCo5Eb46i-zKFs6zgaAaDtBau4-Nh9_RtynS6dlJmr6yNWgb8fcmJFqES7sR_2VmHg--Dtw=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, romantic, date_night, refined, quiet
- Tagline: Slate walls and candlelight in a Palermo evening bistro
- Description: Las Pizarras Bistro is a dinner-focused restaurant in Palermo where chalkboard-covered walls define the aesthetic. The dark, intimate space features careful table settings and wine glasses, creating an atmospheric environment suited for refined evening dining.
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

### Negresco Bistró

- Source id/name: ChIJB3EaEOLLvJURub8MG_gCx64
- Target staging id: ChIJB3EaEOLLvJURub8MG_gCx64
- Category: restaurant
- Neighborhood: Recoleta
- Hero image reference: https://www.palladiohotelbuenosaires.com/wp-content/uploads/sites/7/2021/12/palladio_hotel_mgallery_restaurant_slide_01-2200x1200.jpg
- Image rights status: not_approved_for_publication
- Tags: warm, refined, intimate, date_night, late_night
- Tagline: Classic bistro elegance in the heart of Recoleta
- Description: Part of Palladio Hotel in Recoleta, this bistro combines classic European elegance with warm contemporary comfort. Polished marble bar and mirrored shelving with potted plants set against white tablecloth dining create a sophisticated yet approachable atmosphere.
- Quality status: ready_for_db_staging
- Warnings: missing_instagram, missing_price_hint

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

### Piano Nobile

- Source id/name: ChIJKWs_LrvKvJURDIOS7wZ1IzY
- Target staging id: ChIJKWs_LrvKvJURDIOS7wZ1IzY
- Category: restaurant
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZON1543pHJwE6XGnG_fjiktSAPut0H3bSD0yVESZfMklPLkQQwYYw_NnxHK0qCormAOxNbTFPY0gMF6Gyr5R0wac96jngomJzA0iNrdObHPwBtC1SooiRyHEeWMzGP6B7zFrEsBCdr7htwazBfjKAUr=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, romantic, intimate, refined, historic
- Tagline: Refined dining beneath crystal in a Recoleta palace
- Description: Set within the historic Palacio Duhau, Piano Nobile presents an elegant interior where ornate crystal chandeliers illuminate classical wall paneling and parquet flooring. Round tables dressed in white linens create an intimate setting ideal for refined dining beneath soft natural light.
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

### L'Antiquario Cafe Bistro

- Source id/name: ChIJGcvjLXPLvJURQW2vbUk3gdU
- Target staging id: ChIJGcvjLXPLvJURQW2vbUk3gdU
- Category: restaurant
- Neighborhood: San Telmo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOt3xHCzjg1bzHerevSq4Zk6fzRlPyVOpOnLq1I8g_AekGSjrFMgfKdEP7eqEz8bS0tKXBjM-4YPepVSJwvjVBtOzowgXsaRhC6OJIjEmjZzw_EkvMBWQoMEKF8a1uzQ6WFf0ybPxtNwQTc9aUGAKWrwQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, historic, romantic, intimate, late_night
- Tagline: Old-world charm meets San Telmo soul.
- Description: Set in a terracotta-walled space lit by ornate chandeliers, L'Antiquario Cafe Bistro feels like stepping into a richly appointed antique salon. The wooden bar lined with bottles and candlelit tables create an intimate, unhurried atmosphere perfect for lingering into the night.
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

### Farmacia Lezama - Bistrot

- Source id/name: ChIJr80SszLLvJUROLOjL9k4U-s
- Target staging id: ChIJr80SszLLvJUROLOjL9k4U-s
- Category: restaurant
- Neighborhood: San Telmo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNS-YIfBPTzdLEKgG3DnDFBDPGuiDOC_ViSNFqBBgfxU4oTrQzSNU-h1oZwz24BX4XYbWwL7MKVyFj8RowLwWAXdx8PovP6hv4O-pmwmaEFBYzo9Q90HV-b6afClwwtP2GaxUaCXIbE4eUUJ16V-9Nd=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, warm, romantic, late_night, historic
- Tagline: An intimate evening escape in San Telmo's historic heart
- Description: Red ambient lighting and a crystal chandelier set the tone in this converted San Telmo pharmacy, where white-clothed tables are lit by candlelight and wood cabinets display rows of bottles behind the bar.
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

### A DONDE

- Source id/name: ChIJsaHkHBK1vJURYKzlteVTEXo
- Target staging id: ChIJsaHkHBK1vJURYKzlteVTEXo
- Category: restaurant
- Neighborhood: Villa Crespo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZN2QfBqxFldk7gcLfRiXLOdZ7_Rxt65Bduz2ej8MCPsy9VGPTeH_bTU8c2VHK0ADA_OJcSq6XlA769W3IQepfiDyiGaYDI07k154uaBX6O2Y4NbSLG1ix2LleaHzk0wnUxZv08k0JhYyL4EdbqYRfId=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, romantic, refined, date_night, warm
- Tagline: An intimate evening of Argentine flavors in Villa Crespo
- Description: A DONDE is a refined restaurant in Villa Crespo where Argentine flavors unfold in a dark, intimate setting of warm wood, green tile accents, and dramatic pendant lighting. Evening service starting at 7:30 PM and a 4.9 rating point to a destination for meaningful dinners.
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

### Contraluz

- Source id/name: ChIJt8n4M7bKvJURXqEoC83MiVQ
- Target staging id: ChIJt8n4M7bKvJURXqEoC83MiVQ
- Category: restaurant
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOMyna2PuRSxT3sXC_kw4GF6woEoYSJXaTnskh_ucviN2Ex-REIvqHD7xGEq-g3bZc-Ioy650VANNxDxsoglNIw6GSifhJmiX4rIjg7Z4PHBvvHp1BorARGihKMFN8aVLWjRaX6_2gzdUmgqw=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: refined, warm, romantic, intimate, date_night
- Tagline: An atrium of light in Buenos Aires' Retiro
- Description: Located in the Alvear Art Hotel, Contraluz features a spacious interior beneath a striking glass atrium ceiling, with warm lamp lighting and polished marble creating an upscale yet welcoming atmosphere for all-day dining.
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

### St. Regis Restaurant

- Source id/name: ChIJbR-vG7XKvJURFMhU7AlTlA0
- Target staging id: ChIJbR-vG7XKvJURFMhU7AlTlA0
- Category: restaurant
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZN0tO3aKHNlvFta1kUwv7zmrWLDaz_lmAW07UGQOvAW9yAbntfu5iP5d-Fe-JqIxicSVTL-LcrlKtC25fly13ipyUjUBLB5C6qTS_2X6Ny79eTwBFEaIMI5BNNOIajJWNyJ-loZ5VqfJXdqN6c=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: refined, romantic, cinematic, historic, intimate
- Tagline: Elegant grand dining in the heart of Retiro
- Description: Located at Av. Leandro N. Alem 1193 in Retiro, this restaurant features a grand interior with crystal chandeliers, polished marble floors, and gold-toned walls as shown in its hero image. Operating Monday through Friday for lunch service with a 4.5-star rating from 739 reviews.
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

### Banu

- Source id/name: ChIJ-2e0xfW1vJUR8mODqb7DY2M
- Target staging id: ChIJ-2e0xfW1vJUR8mODqb7DY2M
- Category: restaurant
- Neighborhood: Centro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNqbdnX-BuAgbQdOsB27uFOpIOfT9w9P_F_DrF6rYZWLtXjXW7zyB7KWK56MKGRjwI6ENGqkYrlpTmLoxYy7CskdNiv67-3Nj6A7_J5HBUeOhnBdqmGgauV_GG6lJeEI01i3xc4imuxYa7czMLPd4d0LA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, romantic, date_night, late_night, refined
- Tagline: Contemporary bistro in Centro with intimate, moody interiors
- Description: A 4.5-star spot in Centro with hours running late into the night, Banu features a dimly lit interior with wooden tables, glassware, and pendant lights that create a moody, intimate atmosphere suited for refined dining.
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

### Selva Mía

- Source id/name: ChIJUU5f7ei1vJUROG8_n33E7lw
- Target staging id: ChIJUU5f7ei1vJUROG8_n33E7lw
- Category: bar
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMqxTH89230i-akCLmCYyXjUIAz1gwVR_hHiK-XsA6YiFP1dfPvau12wgUWMrid83PnFvyZlWixESSZ4vScIUP4mXQ0SUD9pVxCeWFezhz4CI3dtZhFrkokow-hEAdhCucXRA3Et-t5bY4-=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, romantic, outdoor, late_night, creative
- Tagline: A jungle oasis in the heart of Palermo
- Description: A tranquil outdoor bar surrounded by trees and softened by string lights, Selva Mía offers a jungle-like escape in Palermo with blue and purple-lit water features creating a romantic nighttime atmosphere.
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

### Intervalo Bar

- Source id/name: ChIJuU-XaKHLvJURJFtK3DApB3g
- Target staging id: ChIJuU-XaKHLvJURJFtK3DApB3g
- Category: bar
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNrEZoXM5jGAKoEeeDXne5NUEvV1VbphZpT2Q2NrxPnQ7aysjYi2qiT11IEH4oe0PBQ6xdkdH3iMw8h1Zu3NAZpjfCbaPtaL_v148rJTNhoxfC2mJyexxOOx_CCoMdeS7Qtc0YS8bA5vWfLugfHwDEnuQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, refined, late_night, date_night, intimate
- Tagline: Warm lighting, curated drinks, Recoleta evenings.
- Description: A refined bar in Recoleta featuring warm backlit shelving and a curated liquor selection. The intimate setting opens at 7PM and stays lively until the early morning hours, perfect for unhurried evenings.
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

### BOCANADA

- Source id/name: ChIJ7xrDQNzLvJURLweyf-tsT20
- Target staging id: ChIJ7xrDQNzLvJURLweyf-tsT20
- Category: bar
- Neighborhood: San Telmo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZN93dyc2SaKz9IyUTMgw5XRr6UzmURZT8TKRu4vDpNS8gRRVq-Zob_lZXL44arFX9Hzea_7CWA-DaMN0lsQIGaebrFRI010wUe_0JAsNt6xtwQAv2pCxFEyT9XOmAYNpK3W0Aqb0mPua__aIkX-5_Qm1w=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: historic, social, late_night, outdoor, warm
- Tagline: Historic San Telmo bar with bright turquoise facade and lively outdoor terrace
- Description: Occupying a distinctive turquoise historic building on Bolívar near the border of San Telmo's oldest quarter, BOCANADA offers a bright, airy atmosphere with outdoor terrace seating beneath detailed facade architecture. The bar draws a social crowd late into the night, with extended hours until 3 AM on Thursday through Saturday.
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

### Cave Canem

- Source id/name: ChIJCU2fEqk1o5UR34Us_wyVKHA
- Target staging id: ChIJCU2fEqk1o5UR34Us_wyVKHA
- Category: bar
- Neighborhood: San Telmo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPr7Xbu6zTDfEPfoxwPd_COHNqqArd1JoslgWcsq2jw7zqDuxa6YqOI6M21cOiC-egL5iwX17vp6xASI6rkPYMcgFQ2gvo3atKa1jcV-wtbB8WEZkofKa5aFT1LAIAXSlfxVM_hRj12xHMpSEJQFE7-Ag=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, late_night, hidden_gem, social
- Tagline: A cozy San Telmo hideout for pizza, beer, and late-night warmth.
- Description: Tucked on Chile Street in San Telmo, Cave Canem delivers a warm, cozy pub atmosphere where wood counters, soft lighting, and a selection of beer pair naturally with pizza. The bar opens at 7pm and stays lively into the early morning hours, making it a go-to spot for locals looking to unwind in an intimate setting.
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

### Lutero Bar

- Source id/name: ChIJNfrDUbK1vJURw1UHBuniUAs
- Target staging id: ChIJNfrDUbK1vJURw1UHBuniUAs
- Category: bar
- Neighborhood: Chacarita
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNtYAAt_p52l-3eE-aSUwRBSSgobLmHI5F6cJROf1rhVo93qvNSF2kQzuZ5Nd-S15HBpCQ8iv1lIa2nZw3z9vcEov68316_ox02blwfU92KHBTW_NuFJBjUJinOnkuNk0G2jJpHAre0tBhJalE=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, late_night, outdoor, social
- Tagline: A warm corner refuge in Chacarita for late-night gatherings
- Description: The nighttime exterior reveals a corner establishment bathed in warm red-orange light, with visible outdoor seating where patrons gather. The illuminated facade creates an inviting presence on the street, and the combination of indoor glow and exterior tables suggests a space designed for relaxed, social evenings.
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

### Nido de Tigre

- Source id/name: ChIJeY8SiQq1vJURXtucm2V_4eY
- Target staging id: ChIJeY8SiQq1vJURXtucm2V_4eY
- Category: bar
- Neighborhood: Chacarita
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZP0nGLrI3PTxeNohvKUmMN3mtI6wSijY2PuvFMoGt-gMJ7wSCXywMohjNaJSqnoG1c9Epq0RBgb35Xew1o-HNCvx6-GVfB1LGSQD5tQh69r9rKJPkhV9P7oTz_gFuHcG3bhJEIjROl5XKos5qqK_mu87g=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, warm, romantic, date_night, hidden_gem
- Tagline: Candlelit lounge in Chacarita with vintage charm
- Description: Tucked on Avenida Jorge Newbery in Chacarita, this intimate lounge glows with candlelight and globe sconces, its red sofas and wrought iron details creating a warm, secluded atmosphere for late-night gatherings.
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

### SOFÁ - un bar

- Source id/name: ChIJMVEcPBO1vJURgv1JmG-JiCQ
- Target staging id: ChIJMVEcPBO1vJURgv1JmG-JiCQ
- Category: bar
- Neighborhood: Chacarita
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPY8AZ5ufwCCAegJ5-1wfoj99_F9igJvmMrEGZcKMlMKU93URPHVn22_GZd54X826qLsJ4dIorhBCqfxPR8A7aPAIMGYdwyjxDUy8Lq0YbnfxTur4ipnIzAXymouJXFDUmAxgUObhutnMZe=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, refined, late_night, date_night, warm
- Tagline: Donde la noche cobra vida en Chacarita
- Description: SOFÁ es un bar nocturno en Chacarita con ambiente íntimo y refinado, donde una barra de mármol y estantes backlit de licores crean un espacio bajo luz tenue ideal para cócteles artesanales y conversaciones nocturnas.
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

### Social Paraíso Bistró | Recoleta

- Source id/name: ChIJ8wAmkrTLvJURSEY8R0b0l9g
- Target staging id: ChIJ8wAmkrTLvJURSEY8R0b0l9g
- Category: cocktail_bar
- Neighborhood: Recoleta
- Hero image reference: https://static.wixstatic.com/media/0bc1c7_9cac9f047b7b44f2b379ef3e3bfb5786~mv2.jpg
- Image rights status: not_approved_for_publication
- Tags: warm, refined, historic, intimate, romantic
- Tagline: Ornate Recoleta cocktails in a restored historic building
- Description: Social Paraíso Bistró occupies a restored historic building in Recoleta's elegant cultural corridor, distinguished by its ornate facade with detailed floral relief carvings and arched entryways. The venue offers a refined cocktail experience in an intimate evening setting, supported by a strong 4.8 rating from over 1000 reviews.
- Quality status: ready_for_db_staging
- Warnings: missing_instagram, missing_price_hint

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

### Pipi Lounge

- Source id/name: ChIJRaMKegC1vJURBsFE2p5NlV4
- Target staging id: ChIJRaMKegC1vJURBsFE2p5NlV4
- Category: cocktail_bar
- Neighborhood: Villa Crespo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNp4UgTw5G0oAL0vpV2nqX5pvPkBoOuVUtntN8wXd_1RySjIZA1pCzd1ecge2ZUy13zCe4EQw3eJnOEL6XQ5ncYfH5BOAnOGpMZNRtmNKgy9d2VBs6nTxMD4PsPBsoAA63PGA_RqKU4NitFgtNthy7G=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, late_night, intimate, creative, hidden_gem
- Tagline: Cozy corner for crafted cocktails in Villa Crespo
- Description: A Villa Crespo cocktail bar with warm pendant lighting, hanging greenery, and a tiled bar front. Open late into the night with crafted drinks in a cozy, plant-filled interior.
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

### LE CLUB BACAN

- Source id/name: ChIJoU38bMTLvJURWzkCCbMzoek
- Target staging id: ChIJoU38bMTLvJURWzkCCbMzoek
- Category: cocktail_bar
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOFD-M5m1Mt_RDBDNe3Ufs06MRMsWyM9aM0ofkxKFjHzyLnOjt2dWdmHt_ETKTBdgsAQqWctgOKaFg_V_S7mce-gQzl671VscQqkPzEzo_Yj8GdTxT0SpkaN7TfrCZrqitMNu4VUbzU7PCEWg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, refined, warm, romantic, late_night
- Tagline: An intimate retreat in the heart of Retiro
- Description: LE CLUB BACAN occupies an intimate space in the Retiro neighborhood, distinguished by its dark wood-paneled lounge furnished with tufted leather sofas and velvet chairs illuminated by warm table lamps. The refined cocktail bar attracts those seeking an upscale evening setting, with operating hours extending until 1 AM on weekends.
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

### Osaka Concepción

- Source id/name: ChIJNb1Li0a1vJUReRmLqvziZHM
- Target staging id: ChIJNb1Li0a1vJUReRmLqvziZHM
- Category: cocktail_bar
- Neighborhood: Colegiales
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOWAW6HA2BDEd6LGyIp_C7OWBZXSQWdtEtqSsp9KPQhlT9LVNCqbCpKRn6SvPR_rtbYt0efji67lOQk3Pr8R79Iz13Xap6c2Fa4ocs2rsYRbwTMnlfKTyPvEcGrBOkRtsyP1uDTkXp6XhVojEU3ORy-QA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, creative, date_night, romantic, refined
- Tagline: Nikkei flavors in a candlelit Colegiales corner
- Description: Osaka Concepción brings Japanese-Peruvian Nikkei cuisine to a warmly lit Colegiales interior with wooden tables and an open kitchen. The 4.7-rated venue operates lunch and dinner service until midnight, pairing creative fusion plates with a dedicated cocktail program.
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

### Tradition & Rebellion

- Source id/name: ChIJw9O5VQA1o5URWJYKtOLJwMs
- Target staging id: ChIJw9O5VQA1o5URWJYKtOLJwMs
- Category: cocktail_bar
- Neighborhood: Puerto Madero
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPFFpDGDVeNSHO2espoaMqKb2cFycuZ0tMzdIPeTyNz41mA20KqwDN4B_sQ9Brb-_9BGTwJcIpMqmud3Fi_ztaJs_G9Y-KNwu35RdlaO69klQoxHhKCE6er5BrgNprDpzSZwNhp2lC-2q_qgQ7o6ZE1Nw=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: romantic, late_night, refined, cinematic
- Tagline: Where the waterfront skyline meets midnight cocktails
- Description: Located on the fourth floor of Olga Cossettini 731 in Puerto Madero, this cocktail bar overlooks the waterfront with views of the river and illuminated city skyline. The image vision confirms a floating riverside venue with string lights and crowds visible below, suggesting a scenic elevated position above the dock area.
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

### Alvear Roof Bar

- Source id/name: ChIJHY6qgqTKvJURqNM0efgLPFk
- Target staging id: ChIJHY6qgqTKvJURqNM0efgLPFk
- Category: bar
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNCdS2yW8e_ufzpQCXx-uiCdwAek38UFylnza1nGwC0j5rePkESVlzBkugGfIlVW7rN1RlSe5Y32deLKdqBYUy1z8kPVmzI4KEQKU41USXKL_z9vTc2TBsyp5xSJAUiJXyr5U4JS_lyQL_yKOV_ggKU=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, warm, romantic, late_night, cinematic
- Tagline: Rooftop escape in Palermo with pink neon glow and intimate warmth
- Description: Located on the 11th floor of Av. Alvear in Palermo, this rooftop bar features pink neon signage against a dark facade, with open arched doorways revealing a warmly lit interior. The space offers bar seating and stools, creating an intimate setting for evening cocktails Wednesday through Sunday.
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

### La Carbonera

- Source id/name: ChIJFXvaYNM0o5URcXzD_75s0Qs
- Target staging id: ChIJFXvaYNM0o5URcXzD_75s0Qs
- Category: bar
- Neighborhood: San Telmo
- Hero image reference: https://lacarbonerasantelmo.com/wp-content/uploads/2025/11/La-Carbonera-Terraza-scaled.jpg
- Image rights status: not_approved_for_publication
- Tags: historic, lively, outdoor, social, late_night
- Tagline: San Telmo's bright rooftop escape with historic soul
- Description: Located at Carlos Calvo 299 in historic San Telmo, La Carbonera is a rooftop bar that transforms throughout the day under its retractable glass ceiling. With a 4.6 rating from 342 reviews and operating Wed-Sun with late-night hours on weekends, it offers a bright, social space with wooden tables and pink chairs beneath a well-lit bar area.
- Quality status: ready_for_db_staging
- Warnings: missing_instagram, missing_price_hint

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

### Naranjo Bar

- Source id/name: ChIJi6VloOO1vJURzeii4qgmagQ
- Target staging id: ChIJi6VloOO1vJURzeii4qgmagQ
- Category: bar
- Neighborhood: Chacarita
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPybc2xo_DL_iwg-F4dl9sst-809a4fZms7P4nLbQi_t7HJoaXfwqOPCculzNQ992Ezx9Lu-4lUxoO8g7Yb1YRdDGrs-TKJbtbbsm3OAvMaDQouYA7RLd5XITdwp-u8lTMUMp6xr8orNxt3kyY=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, quiet, date_night, hidden_gem
- Tagline: Esencia de Chacarita en cada copa
- Description: The facade shows wooden-framed windows and an open door revealing bottle shelves inside, with tree reflections on glass in bright daylight. Inside, warm tones and natural light create an intimate setting typical of Chacarita's local bar culture.
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

### Duhau Restaurante & Vinoteca

- Source id/name: ChIJV_h3h0jLvJURmEmHT6kUGI8
- Target staging id: ChIJV_h3h0jLvJURmEmHT6kUGI8
- Category: restaurant
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNOZ2xkIbn8Vcf3llCLI3XyD8iZtCVWymoMsArPnO1mMNAZkAjdw8ZHV7NcPLHYrhYS_WyzA9EMRRfCtus-TYONTUEWmeq7cjpXJp1CecBQDUjqOmizNC86RAYW6bU_BjcT0gwR2ufjwad7aJbUd2tRSA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: refined, romantic, historic, quiet, outdoor
- Tagline: A garden of quiet elegance in Recoleta
- Description: Set within the historic Palacio Duhau Park Hyatt, Duhau Restaurante & Vinoteca features a lush courtyard garden with reflecting pools and outdoor seating beneath red awnings, surrounded by ivy-covered Beaux-Arts architecture.
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

### Verdot Wine Bar

- Source id/name: ChIJOTV74kjLvJURQrP3u-c4unE
- Target staging id: ChIJOTV74kjLvJURQrP3u-c4unE
- Category: bar
- Neighborhood: Recoleta
- Hero image reference: https://verdotwinebar.com/hero.webp
- Image rights status: not_approved_for_publication
- Tags: romantic, intimate, quiet, refined, warm
- Tagline: A refined wine sanctuary in Recoleta's evening glow
- Description: Set along Avenida Quintana in Recoleta, Verdot offers an intimate wine experience with cellar walls and low lighting creating an upscale bar atmosphere. The space features pendant lights, reflective surfaces, and well-set tables with glassware, appealing to those seeking a refined evening.
- Quality status: ready_for_db_staging
- Warnings: missing_instagram, missing_price_hint

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

### Bruce Wine

- Source id/name: ChIJA1tirZPLvJUR6Wry9oEtCDw
- Target staging id: ChIJA1tirZPLvJUR6Wry9oEtCDw
- Category: bar
- Neighborhood: San Telmo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNGufJvysetVOR-O7At3gjdtA-lAGuV0o8z0FzI50GBD-PzYmu4l-vQ0E7N55sujMHgECfb9MFrQjN4X-eGMl9VnM2x8Gc2ufq8v5LG505yb44V8Dw9MflcyF7mDA3eD99KOuzA_hhnWJQnbFp_SKTU=s4800-w1200-h676
- Image rights status: not_approved_for_publication
- Tags: romantic, intimate, refined, late_night, hidden_gem
- Tagline: Industrial romance in the heart of San Telmo
- Description: Set in the historic San Telmo neighborhood, Bruce Wine presents a styled interior of exposed brick, ornate mirrors, and pendant lighting. The bar features curated wine selections against industrial details, creating a refined yet approachable atmosphere.
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

### Anselmo Lounge & Wine Bar

- Source id/name: ChIJ2U0QXizLvJURNgOVIbEVa7w
- Target staging id: ChIJ2U0QXizLvJURNgOVIbEVa7w
- Category: bar
- Neighborhood: San Telmo
- Hero image reference: https://lirp.cdn-website.com/72ef65f2/dms3rep/multi/opt/standard01-a10076c3-1920w.jpg
- Image rights status: not_approved_for_publication
- Tags: quiet, warm, refined, work_friendly, date_night
- Tagline: Hotel wine bar in historic San Telmo, open all hours
- Description: Anselmo Lounge & Wine Bar occupies a hotel property in the heart of San Telmo, offering guests and locals a refined space characterized by natural light, neutral tones, and carefully chosen artwork. The 24-hour operation makes it a reliable option for quiet moments at any hour in Buenos Aires' oldest neighborhood.
- Quality status: ready_for_db_staging
- Warnings: missing_instagram, missing_price_hint

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

### Los Jardines De Las Barquin

- Source id/name: ChIJ5ZgugCbLvJURug5Q0lS-pac
- Target staging id: ChIJ5ZgugCbLvJURug5Q0lS-pac
- Category: restaurant
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPZFVyypCf8r5hwAYSa6WskuXkjm60CAnGP9Hf5L4_8e0b9OSAxMdHfzhryLMtj-E-MWC4kbCciO1mHuL9iw6SgkPbLr1-5q-iCyxTlXvJ7RUGoG2M2uSctf0KR1DjkdaFzhYO5c7Dtb8uBhg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: romantic, intimate, warm, hidden_gem
- Tagline: A lush garden terrace in the heart of Retiro
- Description: Set within a verdant outdoor space framed by tropical hedges and plants, this restaurant offers patio dining on warm wooden decking under awnings. The setting combines proper table service with natural greenery for a daytime garden experience in Retiro.
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

### BAUTISTA Av. Rivadavia

- Source id/name: ChIJbwWT2M7LvJUR42eZ_sPI6b0
- Target staging id: ChIJbwWT2M7LvJUR42eZ_sPI6b0
- Category: bar
- Neighborhood: Almagro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNuBgjn-jW2MU3K2jaxuLUy2RwN7WA-XIDKS3sJQ-dVYw7AkA-K1rKyu77TsNO9EVeXIsOYs9drwqvzC3qVV_WafN0BEawPvofLXymDL3h0VZYjtjYgTqxvaPDYwWBAKR5BZ0E4KC3AWkVROA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, social, hidden_gem
- Tagline: A bright corner café-bar on Rivadavia with a blue awning and steady neighborhood
- Description: BAUTISTA BAR & CAFE is a corner café-bar on busy Avenida Rivadavia in Almagro, identifiable by its blue awning and glass storefront. With a 4.4 rating across nearly 1,000 reviews and operating from 7AM to 9PM daily, it serves as a dependable neighborhood spot for morning coffee, afternoon work sessions, and early-evening socializing.
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

### Tostado - Nuñez

- Source id/name: ChIJE8JVHTu1vJURS31YFm0Ftyo
- Target staging id: ChIJE8JVHTu1vJURS31YFm0Ftyo
- Category: cafe
- Neighborhood: Nuñez
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMjbqClFXIE_5J9kP7SUFunVaAW0PxztyXMcw99SG0U1W2BX23HfYJ-NNIZlfSwzI17dod1Gzt3j9DBZOQWdj1Gmo0dNDDt-7snd4NFljgyz9vWuxjkmXpngA3L7HBm7vuFNNh32pGwISvmLgyGSm3IAA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: creative, work_friendly, social, warm, refined
- Tagline: Industrial cafe meets refined comfort in Nuñez
- Description: Tostado - Nuñez presents an industrial cafe aesthetic with exposed concrete beams, rows of caged pendant lights, and tiled flooring, creating a refined yet approachable dining environment in the Nuñez neighborhood of Buenos Aires.
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

### La Giralda

- Source id/name: ChIJa8PEn8bKvJUR5DSMvJQGc2I
- Target staging id: ChIJa8PEn8bKvJUR5DSMvJQGc2I
- Category: bar
- Neighborhood: Centro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMvT-WVovhFV5YcHXBhdLQjPpdqArV1x8yTw6OVienMSyWAJgIWuk9Ko1xo8YYI3ejriIWFdUe9ALuN-cih7FmumSrL--XX7y-5qVlrecvNxvtTwFmaVglPA_tg-b_1u3hjcAN5P4Suq_OjWw=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, historic, outdoor, social, late_night
- Tagline: Historic corner café on Avenida Corrientes since 1934
- Description: La Giralda occupies a prominent corner on Avenida Corrientes in Buenos Aires' Centro neighborhood, offering outdoor seating beneath its prominent signage. The venue's extended hours—particularly the 24-hour service on Friday and Saturday—along with its early 7 AM opening make it a versatile option for different occasions.
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

### Petit Colón

- Source id/name: ChIJe02aGsbKvJURYATdVELWBNo
- Target staging id: ChIJe02aGsbKvJURYATdVELWBNo
- Category: restaurant
- Neighborhood: Centro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZN5Ew1B0Mn1DguUlLBlA82t-RUkIZ6x-se0C4cQgkOsz6IneE6Ss6MCHrqZsNPd6s5-xLcb00zOMQcM0q4vpovDvBT3zCJtB5jv3Ohmfo3FSfWvXd-ielw08S-cLVtl_OhoHaF4JNTx03ezVlxoud50oQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, historic, refined, late_night, work_friendly
- Tagline: Historic Buenos Aires cafe-bar with warm, ornate interiors
- Description: Petit Colón occupies a richly detailed space in Centro with dark wood paneling, brass accents, marble floors, and chandeliers that cast warm light across the room. The venue's long operating window—6 AM to midnight—makes it a versatile option throughout the day, while the ornate decor and ambient lighting create a refined, welcoming mood.
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

