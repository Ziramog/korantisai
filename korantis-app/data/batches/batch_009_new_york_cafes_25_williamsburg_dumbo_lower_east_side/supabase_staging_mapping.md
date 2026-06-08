# Supabase Staging Mapping Dry Run

- Batch: batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side
- Generated: 2026-06-08T13:49:28.638Z
- Dry-run only: yes
- venue_images conflict key for apply: venue_id,photo_reference
- venue_atmosphere excluded from apply: yes

## Required venue_images Index

```sql
create unique index if not exists venue_images_venue_photo_reference_uidx
on venue_images (venue_id, photo_reference);
```

## Venue Mapping

### Café Colmado

- Source id/name: ChIJxes_BwBZwokRMzXp44W-WiQ
- Target staging id: ChIJxes_BwBZwokRMzXp44W-WiQ
- Category: cafe
- Neighborhood: Lower East Side
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNMTWttVtUwsjGK9rY8biSEKqzfBMS3z4__83SqutvApyrkj4oKvfeM8o0DUOGUdauD2ByQxbbWcJySJDm2BJoiLiuwjoW_p-A4jEje7qtN8ofzhgOgjYr-2NYlhPXLYE2rjlgys4EY_RejIw9cnyIy-w=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, intimate, work_friendly, hidden_gem
- Tagline: A warm corner café in the heart of the Lower East Side
- Description: A cozy Lower East Side café featuring warm industrial lighting, decorative framed photos, and a welcoming counter-service layout. The space presents an intimate daytime environment suited for coffee breaks and quiet work sessions, reflecting its well-regarded neighborhood status with a 4.6 rating across 291 reviews.
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

### Intelligentsia Coffee High Line Hotel Coffeebar

- Source id/name: ChIJy6rdX7hZwokRYmiVJWN3XmQ
- Target staging id: ChIJy6rdX7hZwokRYmiVJWN3XmQ
- Category: cafe
- Neighborhood: Chelsea
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOqWJ1f9Vr77lhu8ZSHg9MaaVYE0P9HspEHNLa4bQHinDoSrQGuQyrJ8jIJFLm-u4KbaM73IeJ9vcfQTCKmdNr4z60TAmigx_GMvP5rVXK5cjUoMH9B-_PmjH3Wrim1HBkLUnKSbnQxuf3kupU7zfRXGQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, refined, outdoor, quiet, work_friendly
- Tagline: Specialty coffee in a lush Chelsea courtyard setting
- Description: This Intelligentsia Coffee location sits within the High Line Hotel at 180 10th Avenue, featuring a courtyard space with bistro seating, string lights, and greenery beneath the shadow of a vintage red double-decker bus backdrop.
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

### RHYTHM ZERO | WEST VILLAGE

- Source id/name: ChIJHZO-cABZwokRP3Gty-exVkU
- Target staging id: ChIJHZO-cABZwokRP3Gty-exVkU
- Category: cafe
- Neighborhood: West Village
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMztCXgHyqc7TrZT6cZlOhqyLtolZCstGnU8CK5H1QByzS8iVmOKIFk8b9sFCI55ubcCfAJqOwOJJfMwXN7H08jRB1KdrZ46rZDv_-gDAko70oeHO67tYIyt-cYuoyWNYGt2XXTmpsVtRZGy_0diHSl=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: quiet, intimate, creative, refined, work_friendly
- Tagline: Minimalist cafe sanctuary in the heart of the Village
- Description: Rhythm Zero occupies a West Village storefront with floor-to-ceiling wood paneling, paper lanterns, and a sculptural cactus anchoring the minimalist interior. High tables with two chairs each create intimate pockets for conversation or solitary focus, while framed artwork on the walls adds quiet creative energy. The space opens at 8AM daily, catering to Village locals seeking a calm respite.
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

### Bakeri

- Source id/name: ChIJYRmchGdZwokRSTHrwrsym5M
- Target staging id: ChIJYRmchGdZwokRSTHrwrsym5M
- Category: bakery_cafe
- Neighborhood: Williamsburg
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNAnMjxA8OJSKJueLDAas0q6LSzdF0glLyQG3zN6eI4l-yx_g-xklOOVoPp_qMxLqs5hBDmJK2bJLiZ47RKo7M7KTp-2L5ha0hPAvGCPovKnuxW2H2duv1Fdc4e2lr0A94hyK-mZNwGFnvX_d0=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, work_friendly, hidden_gem, intimate
- Tagline: Williamsburg's neighborhood bakery with heart and soul
- Description: Bakeri occupies a warm corner of Wythe Avenue in Williamsburg, where wood-paneled interiors and pendant lighting create an inviting backdrop for house-baked goods. The chalkboard specials and checkered tile floor evoke a classic neighborhood bakery, while nearly 700 reviews at 4.5 stars speak to its consistent quality and local devotion.
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

### A&C Super

- Source id/name: ChIJd4UuECFZwokRnGsyMaQn42Y
- Target staging id: ChIJd4UuECFZwokRnGsyMaQn42Y
- Category: cafe
- Neighborhood: Williamsburg
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZM1Wl6tk5H2RSW57rNvbwGv1hTvK7AS-hDTQyFYWAHclm4GkFBQ_12Y1O1g7xXlZ3ZNtmB8fUwijZrAHdLcKhJ41-iNJhQOKR6pfSM0pUcHzec5CQU7pEa4ZZyZCbRMj4H-oudkghZhtus3-q-BwHrk=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: work_friendly, quiet, warm, creative, social
- Tagline: Bright Williamsburg mornings, the local way
- Description: A&C Super anchors itself in Williamsburg as a reliable daytime cafe, open daily from 8AM to 4PM with a straightforward menu built around quality espresso and neighborhood hospitality. The bright, window-forward interior creates a functional yet welcoming space that keeps regulars coming back.
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

### Paris Baguette

- Source id/name: ChIJ7bjlk1VZwokRBK24C19g_0c
- Target staging id: ChIJ7bjlk1VZwokRBK24C19g_0c
- Category: cafe
- Neighborhood: Williamsburg
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMBnyUY5ja3s8EDycgm4P_h3N-s2xBRXh6t_t7bMJCv7m-kk2_XSkcfkVz0yjMdhmgarWYnKJ9XMyfKoCd6IBEgB6miG3de5llMovoMFT7sRaoes1G6XZLt_lLYlusPKCb0_ILUyPK_aIbz3ZvQPRtbSA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, social, quiet
- Tagline: Where Brooklyn starts its morning
- Description: Paris Baguette's Williamsburg location features a well-lit interior with mosaic tile floors, marble counters, and a full glass display case stocked with pastries and baked goods. The space maintains the chain's signature clean, bright aesthetic while fitting naturally into the Brooklyn neighborhood context.
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

### Dawn’s Til Dusk

- Source id/name: ChIJFTVDEzFawokRp53c_hL03Bg
- Target staging id: ChIJFTVDEzFawokRp53c_hL03Bg
- Category: cafe
- Neighborhood: DUMBO
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZN15fLjG4T0QjOIZ0NU9V2D7fy7658O1oKkmZE7M3KIDnw82ODwynkIoRQt5Q-5Na3A78h_qtXwWFc18Xv7BX8r6JkvC3IC6wf2hfcB89eczKrKWVa3ztD1PTOF_RgZ8xnuutDfOIGovTEpNE3YVqLoUA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: work_friendly, refined, quiet, creative, date_night
- Tagline: A DUMBO cafe where industrial design meets morning-to-evening ease
- Description: This DUMBO cafe occupies an industrial-style space with exposed concrete walls, high ceilings, and a marble bar. The interior features wine bottle displays, marble-topped tables, and black chairs with small floral arrangements, creating a refined atmosphere suited for daytime work sessions and early evening wine-drinking.
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

### Kaida Coffee and Bakery

- Source id/name: ChIJkzkqDABZwokRl-Jxqks-gq4
- Target staging id: ChIJkzkqDABZwokRl-Jxqks-gq4
- Category: cafe
- Neighborhood: Lower East Side
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNFRmudyf8HJViCW1Jo61gxVrV_AtDXc80lue7He7OpR23M1Xft3aDfzSmYGMIFaf6xuDs_wzXpdrvxeiz36LK6BRlMCW2_fLUJ-Y3n2BuYwqOEGXoG2JJNXz6kstKd9_gnuC2ucuKq3-Fq6ylscJLR=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, work_friendly, intimate, hidden_gem
- Tagline: A warm corner for morning coffee and fresh-baked goods on Ludlow Street
- Description: A highly-rated neighborhood cafe at 122 Ludlow Street featuring an intimate interior with white-painted brick, wood surfaces, and warm pendant lighting. Open daily with morning hours suited for coffee routines and daytime work sessions.
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

### maman

- Source id/name: ChIJBTRVgQNZwokRCZlgLnLCbvg
- Target staging id: ChIJBTRVgQNZwokRCZlgLnLCbvg
- Category: cafe
- Neighborhood: West Village
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNTvNUdQGX1wnQQ-WAl0KBfFHoks8Z3k43azgdwe8gwCRDAtK2NQQkuXt4bRMsrY6RqimKQHGmrl7CMv7ku5qwVQivwXPo_D2Gx75HsRtecQJQa78-vIO_UfQ_PE4Rzt4QGPMKqLmr3Zm_D=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, romantic, intimate, refined
- Tagline: A lush West Village café with roses overhead and Parisian soul
- Description: Maman occupies a refined corner of the West Village near Meatpacking, its interior defined by abundant greenery, white roses suspended overhead, and decorative rose wall murals that create a lush, romantic atmosphere. Bistro seating and a prominent beverage refrigerator complete the café's intimate, French-inspired aesthetic, open daily from early morning through 6 PM.
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

### Aux Merveilleux de Fred

- Source id/name: ChIJzQKlfZVZwokRlYqgTIq1Pu0
- Target staging id: ChIJzQKlfZVZwokRlYqgTIq1Pu0
- Category: cafe
- Neighborhood: West Village
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOczeaeVq7Kcq5rSsXuW6T3jLwn9PVtFGqfYPEi4e85245ID9MPnV15gAela7UBx8qtdF8f9hMI13q79_BTnofbbMXH5tiyWz6sAxo-oo6vTcCmP2yI74i2FNrpcM2iPC-9wGc2odZJ6R9DapKPxFU7dA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, refined, intimate
- Tagline: French pastry perfection in the West Village
- Description: The bright interior with its marble counter and large windows creates an intimate yet airy space for enjoying French pastries and coffee. The street-facing windows flood the venue with natural light, making it an inviting spot for a morning ritual or quiet afternoon break.
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

### maman

- Source id/name: ChIJPR-8N6RZwokROvrr-k3dqcw
- Target staging id: ChIJPR-8N6RZwokROvrr-k3dqcw
- Category: cafe
- Neighborhood: NoMad
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNTvNUdQGX1wnQQ-WAl0KBfFHoks8Z3k43azgdwe8gwCRDAtK2NQQkuXt4bRMsrY6RqimKQHGmrl7CMv7ku5qwVQivwXPo_D2Gx75HsRtecQJQa78-vIO_UfQ_PE4Rzt4QGPMKqLmr3Zm_D=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, work_friendly, social, creative
- Tagline: A lush NoMad sanctuary for coffee, greenery, and calm.
- Description: This NoMad cafe presents a lush, plant-filled interior with white roses overhead and bistro-style seating, offering a warm and inviting daytime setting for coffee and casual work.
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

### Stumptown Coffee Roasters

- Source id/name: ChIJT2h1HKZZwokR0kgzEtsa03k
- Target staging id: ChIJT2h1HKZZwokR0kgzEtsa03k
- Category: cafe
- Neighborhood: NoMad
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZO2jGTXIAcBj-MCXXVg-b9Pk5VctyBDwkflDkUlAq84Ffg1X1-6qYcBpg5YyjTDYNxPd6VTcJy6YI123nh7yaZXdAytItF5A_aljKPOHoZJ1WIT7WBfIhCigbtcXxpEdm-ymrdNQz3G4UqqM-qYYsb0=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, quiet, creative
- Tagline: Portland roots, NYC craft—coffee as it should be.
- Description: Stumptown occupies a well-designed interior within the Ace Hotel building on 29th Street, featuring exposed wood, a prominent espresso setup, and globe pendant lighting that creates a warm, inviting space suited for both focused work and casual hangs.
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

### Pura Vida - NoMad

- Source id/name: ChIJK-CuuZVZwokRBPbPoomm2Ig
- Target staging id: ChIJK-CuuZVZwokRBPbPoomm2Ig
- Category: cafe
- Neighborhood: NoMad
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMbshrwHUkT4qSxb-vZHGsF_nI_FYp57RvfbHT6CxIdxOPsEJLsOFLZsPRpuyXTAgVGcI_1TzmdIgWFadXkKwWkJ4mHsQtw2zUNU5AWVS_clwa_zl7VUMKIijAKjKuOD9D5_uiwu2sJw01NFyqpaAr1jg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: lively, warm, work_friendly, social
- Tagline: Bright all-day café in NoMad
- Description: Wide interior shot reveals a bright café with white-painted brick, exposed beams, woven pendant lights, and lush hanging greenery framing bistro seating with active diners. A glass pastry display case anchors the space, consistent with the café's all-day food and beverage positioning.
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

### Nick + Sons Bakery

- Source id/name: ChIJnZ5rvZRZwokRKXfBDWnfSW0
- Target staging id: ChIJnZ5rvZRZwokRKXfBDWnfSW0
- Category: bakery_cafe
- Neighborhood: Williamsburg
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMCIXepgRVD66zR6gZvxbs91tXk0f_oF4qoxqhEg7Rjjt1zlsjcy9agMC8pkc-isAtcryikJgwyi080TUMG3DjcII15Yq2QDg7iAUmpzVN6x0k6MdQcOjxhKugV3KPKecBqJFIAQIU9LvkomDlDNAby=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, hidden_gem, refined, work_friendly
- Tagline: Artisan loaves and espresso in a Brooklyn bakery
- Description: The interior reveals Brooklyn industrial character: a brick service counter, tin ceiling with exposed conduit lighting, wooden tables, and bread shelves stocked with fresh baked goods alongside espresso equipment. Morning-only hours (7:30 AM–2:00 PM) reinforce its identity as a neighborhood breakfast and coffee spot.
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

