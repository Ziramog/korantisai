# Supabase Staging Mapping Dry Run

- Batch: batch_005_buenos_aires_restaurants_50
- Generated: 2026-06-08T01:25:49.744Z
- Dry-run only: yes
- venue_images conflict key for apply: venue_id,photo_reference
- venue_atmosphere excluded from apply: yes

## Required venue_images Index

```sql
create unique index if not exists venue_images_venue_photo_reference_uidx
on venue_images (venue_id, photo_reference);
```

## Venue Mapping

### Mambo Restoran

- Source id/name: ChIJBRmG2DjLvJURA30XmLuDsSY
- Target staging id: ChIJBRmG2DjLvJURA30XmLuDsSY
- Category: restaurant
- Neighborhood: Villa Crespo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMK0XiiHuoNH0jk4ThMrBcCSZun3OmBjmi43h9V6IGheApFJXILhqokprdow_Zun5ZXhD81YhE2ceyMMqKHLVazbHcFRLIVNaRUYiQATgdd1DCxGqKum-5FUcNkRn8gd2oJf6T_RCptFvPgO9R1WKEI=s4800-w1366-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, refined, creative, intimate, date_night
- Tagline: Industrial warmth in the heart of Villa Crespo
- Description: Mambo Restoran occupies a spacious Villa Crespo venue with an open kitchen, exposed ductwork, and weathered industrial walls illuminated by warm lighting. Wooden tables set with care and an open kitchen layout create a refined yet approachable atmosphere perfect for evening dining.
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

### Casa Parra

- Source id/name: ChIJp-6_-sq1vJUR6xmWmn6vKRw
- Target staging id: ChIJp-6_-sq1vJUR6xmWmn6vKRw
- Category: restaurant
- Neighborhood: Colegiales
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOO5ETb6NorIR9iU4ziZW0vP31XRwffIF62OC4a-F3X8NJRrSTJXxKX_nLras7kyRPve1xtNx5KYuvp94HFHV3OO_XLEbDDopI95y1FKOO7yeRPBVUSq8BkNG3aajHJzyBXhXoRxIWpHI923Q=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, romantic, date_night, refined
- Tagline: An intimate corner of warmth in Colegiales
- Description: Casa Parra occupies a nighttime corner in Colegiales with an illuminated entrance revealing an interior of tables and a chandelier, creating a warm and intimate atmosphere for evening dining Tuesday through Saturday.
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

### La Justina Bistró

- Source id/name: ChIJhwXpH2fKvJURfUi5L9WGg8w
- Target staging id: ChIJhwXpH2fKvJURfUi5L9WGg8w
- Category: restaurant
- Neighborhood: Almagro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPcxUGGsrzY5OMK2WLVH6yol7pQABjoOUNgeu564BJq5NCiLvGDNYrEyRcE0t63f2_Yorjg-u58oRnMtHy1mEzCPcZNYHzobYuWaODSZlIDcicHXqKTz94ggpvTIeSXYrBZlot_RTFieQTyVQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, historic, intimate, work_friendly, quiet
- Tagline: Traditional bistro with warm, timeless appeal.
- Description: La Justina Bistró occupies a well-lit interior with classic European décor—warm wood paneling, leather banquettes, chandeliers, and framed art create an inviting traditional bistro setting in the heart of Almagro.
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

### Parrilla Sanabria Palermo

- Source id/name: ChIJxVSddwDLvJURZmCezPjyXDs
- Target staging id: ChIJxVSddwDLvJURZmCezPjyXDs
- Category: restaurant
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMJCofjrpEti_QGGTr1NDwDTBmrNxje5m9KsLCmMnsYYmYnTryKlO5kWH1u-W92d4J9dRnN8TuLaskGsKnIjSWhKWAzcAdsr3pF3jng7nkl4mmEwsY1mgcOtPa6xMLRNtisZ-WwWN6YCntUIu4QZqupbg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, refined, intimate, date_night, quiet
- Tagline: Classic Argentine asado in a warm, candlelit Palermo setting
- Description: The interior features well-lit dining with white tablecloths, brown chairs, and warm wall sconces casting a soft glow across textured ceilings. Large windows reveal the Palermo nighttime street, completing a warm and refined atmosphere suited for intimate evening gatherings.
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

### La Caprichosa Parrilla

- Source id/name: ChIJ4_8dbADLvJURYUfRMj4HQcM
- Target staging id: ChIJ4_8dbADLvJURYUfRMj4HQcM
- Category: restaurant
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNh004_WBNTVtny0G6-_vtKJs86E0VHJCEsFvZlVWqoA-4cUJqsjyWZuveHr5gbEr8wO5XKIF-Ii3Wdg67T11GX4dSMLp0brcDGnWyw5Y2h2q3TiCcIVxUQgNavzy1T9FtbN8kUInbUfDPZK-YV1JPIhw=s4800-w1080-h1440
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, romantic, date_night, late_night
- Tagline: Fuego, vino y ladrillo: la mejor parilla de Recoleta
- Description: Parilla tradicional argentina en Recoleta con interiores de ladrillo visto y mesas de madera que irradian calidez de bodegón criollo. Servicio de mediodía a medianoche permite desde almuerzos pausados hasta cenas tardías. Especialización en cortes de res asados sobre fuego de quebracho.
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

### Parrilla "La Coqueta"

- Source id/name: ChIJY811cJjKvJURmT4zu7so5s8
- Target staging id: ChIJY811cJjKvJURmT4zu7so5s8
- Category: restaurant
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNrlrNtSu7s4AxgZUQyg0hwcr63b7WE5tKtiDJuUtpbNj_TY-u2Aj31o1xeHdbAO7kNwtR6UvMVBReh2FdS_VZyXbpfFmSSjmOcHSFQp9LN4-O2KJbzIJ13eHFQxj3KTh6i4shAwOrBhH1DKQ=s4800-w1080-h607
- Image rights status: not_approved_for_publication
- Tags: warm, romantic, date_night, outdoor, hidden_gem
- Tagline: Where Recoleta meets wood-fired tradition
- Description: La Coqueta presents classic Argentine grilling in a charming Recoleta setting, its pink facade and green shutters creating an inviting street presence. Outdoor seating under branded umbrellas offers a relaxed environment for savoring traditional asado in one of Buenos Aires' most distinguished neighborhoods.
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

### Tu Jardín Secreto - Restó Secreto

- Source id/name: ChIJBUxJqt21vJURUNL5jEnFgxk
- Target staging id: ChIJBUxJqt21vJURUNL5jEnFgxk
- Category: restaurant
- Neighborhood: Colegiales
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPgKvmxzMmfAc13hVIkHxVY_dOQpbhu88lC950ujxELFlL3Ex2Ea-jUZBGsxHa-D1g9kgSHQEbo03iagYh-g1Otvwt36__ctF2oqpNEkLLf__8PjOqEQf2nJdClL6qpF4F9hz_kx6lkHBQBjH9RLs7F=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, hidden_gem, creative, romantic
- Tagline: Your secret garden in the heart of Colegiales
- Description: A secret garden-style restaurant in Colegiales featuring rustic exposed brick interiors and warm amber lighting, where creative Argentine dishes are served in a cozy, intimate atmosphere perfect for romantic dinners or discovering a neighborhood favorite.
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

### La plazoleta parrilla

- Source id/name: ChIJ5WRoBJm1vJURw5DqAu70ZRU
- Target staging id: ChIJ5WRoBJm1vJURw5DqAu70ZRU
- Category: restaurant
- Neighborhood: Colegiales
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMLHOopFJTKe_N7lfTIMlle24EIxiTMLZl5jEW8-DaA0HEuqzrTd5IgcqEf0TgLVPuhxvzt0WPTire9otFqX-JJ8cWrSSspU7dzT737NTTPDg8zpn55i0FS2NfG2IO2O1Cxt8p7a2rHTeSCgQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, historic, romantic, social, date_night
- Tagline: Traditional Argentine Parrilla in a charming Tudor setting
- Description: La Plazoleta Parrilla occupies a distinctive Tudor-style building in Colegiales, serving traditional Argentine asado with charcoal-grilled cuts in a warm setting. With a solid 4.2 rating from over 400 reviews, the restaurant operates as a neighborhood fixture with lunch and dinner service six days a week.
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

### Parrilla Nuñez

- Source id/name: ChIJ03-AOgC1vJURSsMddB0Vb1c
- Target staging id: ChIJ03-AOgC1vJURSsMddB0Vb1c
- Category: restaurant
- Neighborhood: Belgrano
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOsGLcJY4ODpNNfWnu3oJIQLzCxicNlO12E1xlr4xLXXY13dSOUPFgdqyuSMKkCiOnfifm5Al1hZqDR-w_a0aTN6oa5dGhNLdbi4ie-jJxXuvW9hxp5jpLj-eeqf3-1P_casXoXDlCaD90ynmWTw2lbEQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, historic, date_night
- Tagline: Classic Argentine grill with soul in Belgrano
- Description: Located on Montañeses street in upscale Belgrano, Parrilla Nuñez delivers traditional Argentine grill fare in a warm interior with wood accents, wine displays, and pendant lighting. The intimate dining room with red napkins creates a cozy backdrop for experiencing authentic asado culture, with lunch and dinner service daily until midnight.
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

### La Dorita del Mercado Belgrano

- Source id/name: ChIJL46_5cq1vJURmC-GnOCvoHY
- Target staging id: ChIJL46_5cq1vJURmC-GnOCvoHY
- Category: restaurant
- Neighborhood: Belgrano
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOUb7URcmwr5sYQ5NyHFHtZBDsfoKm4SZDl4yY_XkHrRVaHfoIhNeRcBNZ2M3t3qGDy4KO_QuQLetkFdp3S3dSTOpMrzz0awts2JgKALEm1sideVeau0LycuSo65iW9fbxUz240ABGzefl29BXmh5Z5lg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: lively, warm, creative, social, late_night
- Tagline: Sabores del mercado en un espacio industrial-rústico
- Description: La Dorita del Mercado Belgrano ofrece un ambiente industrial-rústico con cocina abierta visible, mesas de madera y una distintiva lámpara de botellas verdes. El espacio combina elementos creativos con la calidez de un mercado, creando una atmósfera animada ideal para cenas nocturnas y encuentros sociales.
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

### Tierno Parrilla

- Source id/name: ChIJMROijR-1vJURjdnosD8lCwQ
- Target staging id: ChIJMROijR-1vJURjdnosD8lCwQ
- Category: restaurant
- Neighborhood: Belgrano
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOMkN5ofUxvU2d7DR_j-ggisbm-L_eSKXvQWuJg1km2GtZCalEJIm7BCD28XMzirh5hfkcX3kXRQpFa15CXZeOk3CdLf2TAUVDHLcRNeeoeh8dKXhbv9hh6WVCGc-mMGzYfsavBQLjjBb9aQHitqMpd_Q=s4800-w900-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, social, date_night, late_night
- Tagline: Tender grilled meats in a warm Belgrano setting
- Description: Tierno Parrilla occupies a glass-fronted corner space in Belgrano with warm lighting visible from the street at night. The venue features a tiled terrace area and interior seating visible through large windows, creating an open and inviting atmosphere typical of neighborhood Argentine grills.
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

### Parrilla La Banda

- Source id/name: ChIJrSq8_IrKvJURyNkraBPZ1Bk
- Target staging id: ChIJrSq8_IrKvJURyNkraBPZ1Bk
- Category: restaurant
- Neighborhood: Almagro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOPQddQ6pcmT0pzqoIa5X1fW0GQslamlCOTVWbucAyP0aOVY80eYNXBzLJJSpfI5XOLmwkssaBqTAahEHFPvlaijbl-sEqgjh1A6iQ4LT1jsZyOIxcQXVUsUGjghAr0Lva14W03cfLUnU2o=s4800-w1440-h1080
- Image rights status: not_approved_for_publication
- Tags: late_night, warm, social, historic
- Tagline: Late-night Argentine parilla with classic Almagro soul
- Description: Parrilla La Banda occupies a residential block in Almagro with exterior chalkboard menus and traditional signage. The late closing hours (2-3AM) position it as a practical option for post-midnight dining in a residential Buenos Aires neighborhood.
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

### Atis Bar

- Source id/name: ChIJiQqL59jLvJURql6ZgKZ32AY
- Target staging id: ChIJiQqL59jLvJURql6ZgKZ32AY
- Category: bar
- Neighborhood: San Telmo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOSYRLR9h2MyKrZlMhKNsQfQ0q7lXzbYhYIf5k9sben0l_ACVVEP5hLNtspAJoS4sKl-ZwbNKi0p7jmOmV5HrJkXy9eA5EGc355X3mtXL7Tz1jhvnwM_TOg-Oo8fur4Jor_0Asi-Oi8O2N7Ra5s6_Q0=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, romantic, intimate, historic, cinematic
- Tagline: Historic San Telmo terrace with twinkling lights and courtyard charm
- Description: Perched overlooking a charming San Telmo courtyard with twinkling string lights, ornate ironwork balconies, and ivy-covered facades, this bar offers a warm, cinematic setting perfect for intimate gatherings and romantic evenings.
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

### El Taller Arte & Café

- Source id/name: ChIJzX74SnO1vJURDl6xoIAVfdQ
- Target staging id: ChIJzX74SnO1vJURDl6xoIAVfdQ
- Category: restaurant
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPf3PvuHIlZOVBaz2PjdvSjg8uhyS1b2scVo5pLFDRwam7vynU_49KZoa_bjgiSBytodumeg_yDCD_wLGB6zvOdSVliSy61hsMW_nNyt1LNVK9fHSK6YbhP0UB75O6K6hZFDupQ3-gR822dKA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: creative, late_night, social
- Tagline: Workshop vibes meets late-night art café in Palermo
- Description: Located on Serrano street in Palermo, this venue occupies an industrial space with workshop aesthetics—exposed brick walls, concrete flooring, and industrial ceiling beams anchor the design. The name El Taller Arte & Café hints at its dual identity as both creative workspace and café, while hours extending to 3 AM most nights and 5 AM on weekends reveal its late-night personality.
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

### Bar & Restaurant El Correo

- Source id/name: ChIJ_9iPfbzKvJUR7_ciB0CJRoc
- Target staging id: ChIJ_9iPfbzKvJUR7_ciB0CJRoc
- Category: bar
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOWqlIvya6KlKJYa-7JEQbh04s-YgEmN_fwK_GlFFfpKANFDCeXEZirST5pEaXP_-Z73WXj4K-zHUdXYxHDs-UwZ9ignlBIt8-YBl66yktiiudD_8iL4N1v156wAAyVCKpEf1DU0YrzcCuqQz7EsLM_GA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: historic, refined, outdoor, social, date_night
- Tagline: Historic Recoleta terrace blending classic Buenos Aires café culture with refine
- Description: This historic Recoleta bar and restaurant features a bright outdoor terrace with tables set along a narrow cobblestone street. Under string lights with large potted plants, the space offers classic Buenos Aires café culture from early morning through late evening, backed by a solid 4.1 rating from over 2,700 reviews.
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

### RUFINO

- Source id/name: ChIJw0Yrh2HLvJURQeTSn4kSYv8
- Target staging id: ChIJw0Yrh2HLvJURQeTSn4kSYv8
- Category: restaurant
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZONZl6rtaOJKZy7s1dMq9WThnkD889BQDIb-1JVu97eKC5izGE5QSCvmoyy8qtR6gJVw3th0-7OAep35esTyawIaBIUVXfopBMjBQjKLASEO-Ca8B2KzoK_UwdU1wQlMulmT1E_EK9XPhwO_g=s4800-w819-h1024
- Image rights status: not_approved_for_publication
- Tags: intimate, warm, romantic, refined, date_night
- Tagline: An intimate Recoleta sanctuary of Argentine elegance
- Description: RUFINO presents an intimate Recoleta dining room defined by tufted leather banquettes, ornate gold-framed mirrors, and warm candlelight from geometric pendant lanterns. The space balances upscale sophistication with genuine warmth, making it well-suited for romantic evenings and special occasions in one of Buenos Aires' most prestigious neighborhoods.
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

### L' Orangerie Alvear Palace Hotel

- Source id/name: ChIJNUuUfKPKvJURwBFcWiDsv40
- Target staging id: ChIJNUuUfKPKvJURwBFcWiDsv40
- Category: bar
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZO_aHKDA3H0gcQsNBddVPWn4cjamhlPGhVUffXRaZOEkFJEBf_YqgbUd89GT7In2zewsyqyluQnKiVhRMCJctj1wR3S8twhuk6sMZJHf9eWvMvtwC1u1cIp8vIJ2cDnTqQYJ7OQUd4ONmHg1sWMoTC3=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: refined, historic, intimate, warm, romantic
- Tagline: Elegant bar inside a historic Recoleta palace hotel
- Description: L'Orangerie occupies a refined corner of the Alvear Palace Hotel, a landmark property in Buenos Aires' Recoleta district. The bar presents an ornate setting with crystal chandeliers, arched windows, and heavy drapery, backed by a fully-stocked wooden bar where professional staff serve throughout the day.
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

### El Chiri de Villa Kreplaj

- Source id/name: ChIJHRgyRnXKvJURl_Km8KpHYfI
- Target staging id: ChIJHRgyRnXKvJURl_Km8KpHYfI
- Category: restaurant
- Neighborhood: Villa Crespo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZP_j5cZfm9c5W8nbbsP2f4ZVGOpR0vb_OW1MaoaZjeJ0EalT9LNR560nOcZPxvXKvX-U9s2twEaicnbhKxOkhiHzlZ1MKrdCh0YahEBuNJKSYZfsv2KqoEn4NIFo3PjMGnQbmJfv4rItdq8L8m9apuwBg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, social, intimate, creative, late_night
- Tagline: Corner café warmth in the heart of Villa Crespo
- Description: The interior features orange and pink walls with neon signage, framed portraits, and pendant lights casting a warm glow over set tables with bench seating and wooden chairs. Decorative plants add a touch of green to this cozy café-restaurant setting that feels both artistic and welcoming.
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

### jakub

- Source id/name: ChIJLWjgKdq1vJURIwCG26u3Zi0
- Target staging id: ChIJLWjgKdq1vJURIwCG26u3Zi0
- Category: restaurant
- Neighborhood: Colegiales
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMCcbRvrLBYX2aw3095v5uDjMa9hyB2CdyHZjo8qOidMUd3ZUAR1swF6B17Pzr42KQWUbxbMN4FgvoKYu9_-PsXMtre_WYwpne0yGSFH20uac0sp0ga8uN9YU5zStxrDq22gdbZMPpQxSPsI4rc9aWAFQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, intimate, date_night, hidden_gem
- Tagline: A corner of warmth in Colegiales, morning to midnight
- Description: Jakub occupies a warmly lit corner in Colegiales, where exposed brick and vintage ceiling details set a casual yet intimate tone. The space runs from a morning breakfast window through late-night service, making it a versatile neighborhood fixture.
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

### Lo Del Francés Café Bistrot

- Source id/name: ChIJHzxV0CzLvJURpNhwh6llXeo
- Target staging id: ChIJHzxV0CzLvJURpNhwh6llXeo
- Category: restaurant
- Neighborhood: San Telmo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMBlyVFrAvpaiEXLTlnoboYkGIBQz-QVVWFlGj8-0c9n3Q1hgijHXVCzY45eevKHSF8qijRBZNqESxEAwpylZuGKW0nZ0Wta5gEpC508KwsZkfm7Ao_4FrVxJece_zB_snjzEdJhLL6JLLvYA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, romantic, historic, creative, intimate
- Tagline: European bistro charm in the heart of San Telmo
- Description: A French-inspired café bistrot tucked into San Telmo's historic heart, drawing a loyal local crowd since opening. The warm, art-adorned interior features distinctive Mondrian-style wall panels and a staircase mural, creating an intimate setting for unhurried meals.
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

### Dada Bistró

- Source id/name: ChIJKaSlIATKvJURnhxTrnzX2HE
- Target staging id: ChIJKaSlIATKvJURnhxTrnzX2HE
- Category: bar
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMX9i01oRhEwW28mIndCODPlh4N_PFiCp9SstZqo1qm0eB345N_rSsIz1kgrFqYJaQBXmptDn9e2EsWC6mRxEJ7O96S3UxdHYXGQSGVNkurJs7z5h5gAueCbv-IEuoi8kAfcAT-Ggrg_F9lQDbXiVMX2g=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: creative, late_night, intimate, social, cinematic
- Tagline: Industrial bistro bar with late-night soul in Retiro
- Description: Dada Bistró occupies a space defined by exposed ceiling pipes, a wood-paneled bar, and a mirror ball casting light over checkered floors. The industrial-chic interior creates an intimate setting suited to late-night drinks and creative gatherings in Retiro.
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

### Jardín de Invierno

- Source id/name: ChIJo7BjwqLKvJURK4y4QX7RP6A
- Target staging id: ChIJo7BjwqLKvJURK4y4QX7RP6A
- Category: restaurant
- Neighborhood: Recoleta
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNPRvSExjWMwztG9du3H3A2G4yjrjfoFCok-_03rVDck1Lx_7Vf8aPAYVAjvfI8jmiY-B21HQeE73OTnkHyuBD36cJTJS2ei0NhGKdPKOq57f2ZlAyLfds3Nb3F4oxw_8wftQ9PVU9IQ33CNRkDkuRjWg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, refined, social, date_night
- Tagline: Un refugio cálido en el corazón de Recoleta
- Description: Jardín de Invierno despliega un interior tipo galería lounge con múltiples zonas de asiento — sofás, sillones y barra — bañado en luz cálida a través de ventanales de piso a techo. Ubicado en Recoleta, abre todos los días de 7 a 23:30, ofreciendo un espacio refinado y sereno que funciona tanto para pausas diurnas como para encuentros nocturnos.
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

### El Estrebe

- Source id/name: ChIJ20jwZZnKvJURPIXYs2-9ZVM
- Target staging id: ChIJ20jwZZnKvJURPIXYs2-9ZVM
- Category: restaurant
- Neighborhood: Recoleta
- Hero image reference: http://www.elestrebe.com.ar/imgs/slide05-salon-final.jpg
- Image rights status: not_approved_for_publication
- Tags: warm, refined, romantic, date_night, intimate
- Tagline: Classic Recoleta table with wine, white linens, and warm light.
- Description: El Estrebe presents a classic Recoleta dining room with warm pendant lighting, neatly set tables in white linens, and an array of wine glasses that suggest a wine-forward hospitality. The space balances refinement with a cozy rusticity, making it suited for quiet, intentional meals.
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

### Maure Parrilla

- Source id/name: ChIJc9pYAtq1vJURb-CrFKraBUU
- Target staging id: ChIJc9pYAtq1vJURb-CrFKraBUU
- Category: restaurant
- Neighborhood: Chacarita
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZP5Zb7k8YiVXiozAa_fD935DtEH8jpGtZl_leTtulxn5sRXkQyL_5_k_q3zD1wrp65PpY109CTIOJdFENI3y-wf_1-qi_HfvElh2fsZNiIFfTh_AodxhYZkAh10i7SK3AAg-xQTzg3BwgPZcUA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, romantic, refined, quiet
- Tagline: A warm corner grill in Chacarita for relaxed, memorable evenings.
- Description: A corner parilla in Chacarita, Maure occupies a bright white building with large windows and sidewalk seating dressed in white tablecloths. With a 4.7 rating across nearly 2,800 reviews and evening-first hours, it is a neighborhood staple for relaxed, well-regarded dining.
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

### Fraga Bodegón

- Source id/name: ChIJG2nMEnm1vJURwHxozPMx9uY
- Target staging id: ChIJG2nMEnm1vJURwHxozPMx9uY
- Category: restaurant
- Neighborhood: Chacarita
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZO1QLcIFK_NlBKttvcE9emN4T-bDG0-5W_7pJMArk0dKdb-8DhqGTZl_8TZWFgUPSSxMQV_KMtQq8riBt_q1lNFvPQpxsd4yC572snEjmLvZtfxLCoe7BRYfuldLoAdL13pIBE-TX5AvgnidEpzFm7grw=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, romantic, intimate, refined, date_night
- Tagline: A Chacarita wine bar with neighborhood warmth
- Description: The well-lit interior features dining tables with white tablecloths and black chairs beneath an exposed concrete ceiling, with white brick walls and a prominent wine rack display creating a refined yet approachable atmosphere.
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

### El Tordo

- Source id/name: ChIJ3WcG9Pq3vJURBNgNCshk6gc
- Target staging id: ChIJ3WcG9Pq3vJURBNgNCshk6gc
- Category: restaurant
- Neighborhood: Belgrano
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMh4uti5X4JSdVe7nY1EVA67w-SaJqE7jGaG2Dz2ccPf-kEsa_w1lLfY8SXcgySIZAzx9YeZfW-PVz1AVUAY-hVIvMCV7c_NgW7e_0fGV6M4r9hLNoGUz6aATEE_HK0cMUTfuoeGFlzSFR3=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, late_night, social, refined, hidden_gem
- Tagline: Traditional Argentine grill in Belgrano with warm lantern-lit evenings
- Description: The nighttime facade with its wooden sign, red awning, and warm lantern lighting creates an inviting first impression visible through large windows. Inside, the open kitchen and dining area suggest the bustling energy typical of a well-frequented neighborhood parrilla.
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

### Hierro Parrilla San Telmo

- Source id/name: ChIJG5tUKrfLvJURoUK0uPSA8sg
- Target staging id: ChIJG5tUKrfLvJURoUK0uPSA8sg
- Category: bar
- Neighborhood: San Telmo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPbc3uhf2XOUaD-X9BWhkYCInoW6dDISR_mw6Wd42KfFiuFdy1YJ_vl4QQkatTfGleqgYW0aevFpAoWpDIx4YJ6PDPW7LrzIdp2A6lGTNXGk0JGxrhS5v-BNbwQD3AJFWNwqAZBUsMew_ufFohWcoT06g=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, historic, intimate, date_night
- Tagline: Asado artesanal en el corazón de San Telmo
- Description: The interior showcases a wood-fired grill with glowing embers, brick walls, stacked firewood, and sticker-covered stainless steel, creating a rustic-industrial atmosphere that reflects San Telmo's historic character and traditional Argentine asado culture.
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

### Parrilla Lo De Mary - Restaurante

- Source id/name: ChIJV3sHeGPKvJURSoUXCRuvS5I
- Target staging id: ChIJV3sHeGPKvJURSoUXCRuvS5I
- Category: restaurant
- Neighborhood: Almagro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNC4qZ493rKmFwdQhHb2RBbdSsuUIJkUVKexklT6Rz53Ay_ynhaKxz7JDvyvqd3qeTK9HuzKIzPrQY4pVESm405DLe9TMazJH5e0g2daV4AdlAmL0P2-4FzIVl8RBEWyF8lmTgcH0kD3dFk=s4800-w720-h720
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, historic, date_night, hidden_gem
- Tagline: Classic Argentine grill with vintage soul in Almagro
- Description: Parrilla Lo De Mary occupies a traditional Almagro space with warm wooden doors, vintage signage, and an extensive wine collection. The interior features framed photos and cozy table settings that create an intimate atmosphere for classic Argentine grilled cuisine.
- Quality status: ready_for_db_staging
- Warnings: medium_rights_risk, below_preferred_resolution, missing_instagram, image_rights_review_required_before_publication, rights_review_needed

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

### El Mirasol De Boedo

- Source id/name: ChIJjRKgq1jKvJURZ1R2OmxHM-w
- Target staging id: ChIJjRKgq1jKvJURZ1R2OmxHM-w
- Category: restaurant
- Neighborhood: Almagro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNRxIT7eEfBOXaRkm2ntRMtagwysUsmsC45-VV7D18j08WiXpQuHkLdFYDc8nOK70x963CxJ7VfCatjnt76aTH6KG5XOMEDvNnLILtgSUoFAxxRK2MT7l9GIOAKsKJXY2DzD7DGiBacyA96LEa-bXHaOg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: historic, warm, romantic, intimate, date_night
- Tagline: Historic Argentine grill in Almagro's traditional heart
- Description: The venue occupies a distinctive historic building with an ornate facade featuring barred windows and traditional signage, projecting classic Argentine architectural character on Av. Boedo in Almagro.
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

### Parrilla Cero5

- Source id/name: ChIJ95DwEyfLvJURliRjO-ZpqU4
- Target staging id: ChIJ95DwEyfLvJURliRjO-ZpqU4
- Category: bar
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNrYBZ02r6HGeSaRQo_JLZQoKoYKW3yJNK2caiBCIXfN4skNc5XpUetG5g10DLQXuT1Io8fxEiw_bv7MbxGnfycZ-NmC9NvIF8QSqJGflrePAIw131MaWrEJ_txk37v3USfwrUSTPrJcDsBFg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, late_night, refined, social
- Tagline: Refined Argentine bar with classic wooden charm
- Description: Located in Retiro, this Argentine bar features a warm, well-lit interior with a classic wooden bar, pendant lighting, and adjacent dining area. The space offers quality cocktails and Parrilla dining with a 4.6 rating from 3,125+ reviews.
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

### El Mirasol de La Recova

- Source id/name: ChIJsd-Q9LDKvJURX4NWWE7wUr4
- Target staging id: ChIJsd-Q9LDKvJURX4NWWE7wUr4
- Category: restaurant
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMA0ZXWZ7hSFkkfy3-Oh1p0FnA-re_2Av74ccTqUwwzFD6_GAS8mnw4Eq8Yk_in-Kur8TxnYS8DHXLZNE_Qqe7v-ZxLjLsXmDg6wWGOf8ApPiCUHWJInH0yDeJB1PDV9O6DlRavgWY6wDzqVY3xHhzYnA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, refined, date_night, late_night, social
- Tagline: Classic Argentine dining in a sunlit Retiro landmark
- Description: Set on Posadas street in the upscale Retiro neighborhood, this longstanding restaurant occupies a bright, airy interior with large windows, natural hanging plants, and tables dressed in white and burgundy linens. A visible bar area with wine display reinforces its focus on wine and refined dining, while wooden chairs add warmth to the well-appointed space.
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

### La Dorita

- Source id/name: ChIJ4Z0WDo61vJURDjA6d6vKufA
- Target staging id: ChIJ4Z0WDo61vJURDjA6d6vKufA
- Category: restaurant
- Neighborhood: Palermo
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMIaeebCg3Es-BErzWuMufg4j5ICkM-tVJaSkFepaim1JctyD98zwyPwx9NMv86kL7gSm6bElwkZnk8cD4XIxTfV9vEb45LZb6UxLDY86muWTvMA4yMlIKNSBaisUHGnaUHNzo15EPqDmD9U5OLtD82=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, creative, social, late_night, date_night
- Tagline: Eclectic late-night dining in the heart of Palermo
- Description: The warm, eclectic interior features distinctive wine-bottle chandeliers, colorful string lights, a wooden ceiling, and patterned tile floors, creating a well-lit and inviting dining room that balances coziness with creative flair.
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

### Pentos Colegiales

- Source id/name: ChIJN2gUWSy1vJURQJeCgfoIEfw
- Target staging id: ChIJN2gUWSy1vJURQJeCgfoIEfw
- Category: bar
- Neighborhood: Colegiales
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZM30qt4-78IF18TGqQGWhPc19bBZmoNPQ4TQEOo3i6yRKbtJ2tUNfCWSq3dqaxCaxf9ijDVpU737Bwo2qD0vfyxAa6Dk9BA5pIB5L9VnnXE_17DIdGqBSG1wfakjRa0LhS4zCq6ONYpQGvU8C3s3fzt=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: intimate, warm, late_night, hidden_gem, social
- Tagline: Craft beer and intimate vibes in Colegiales
- Description: A cozy neighborhood bar featuring a neon 'BIRRA' sign, craft beer taps, and an extensive back-bar bottle collection under warm, dim lighting. The chalkboard menu suggests rotating selections, catering to beer enthusiasts seeking quality over speed.
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

### Bar Britanico

- Source id/name: ChIJyyTsSM00o5URxzB6EWJli4E
- Target staging id: ChIJyyTsSM00o5URxzB6EWJli4E
- Category: bar
- Neighborhood: San Telmo
- Hero image reference: https://turismo.buenosaires.gob.ar/sites/turismo/files/bar-britanico-1500x610_0.jpg
- Image rights status: not_approved_for_publication
- Tags: warm, historic, intimate, romantic, date_night
- Tagline: Historic San Telmo bar with warm vintage charm
- Description: The interior features a full bar with wooden shelving displaying bottles, hanging cured meats, and exposed brick walls with a chalkboard menu. Wooden tables and chairs sit on a checkered floor, creating a warm and inviting atmosphere that reflects the bar's historic San Telmo location.
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

### Ancora Buenos Aires

- Source id/name: ChIJu51WzPbLvJURrmObcSy9XLA
- Target staging id: ChIJu51WzPbLvJURrmObcSy9XLA
- Category: restaurant
- Neighborhood: Retiro
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZP4bfh5lwz8NWT9SAl30yp04azf1eLLzMrXiQ1L22PA13RerxmNwv5tCjnx40f_O-zlmAsxI7hhcMwYWb-2RgRR7JeUuX82O9ARj5mkmCsvDEJKdp36le54bc3h7aZ64zNU9wBz5Ai46sj3vz7hj7adwA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, refined, intimate, quiet, romantic
- Tagline: Refined dining in the heart of Retiro
- Description: Located in the upscale Retiro neighborhood, Ancora Buenos Aires presents a wide interior featuring white-clothed tables and black chairs beneath a wood-slatted ceiling, crowned by a large oval light fixture that bathes the space in warm ambient light.
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

### Croque Madame Puerto Madero

- Source id/name: ChIJJcWpbzE1o5UR9pPaamH_--c
- Target staging id: ChIJJcWpbzE1o5UR9pPaamH_--c
- Category: restaurant
- Neighborhood: Puerto Madero
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMuehinf__tbbSK4ZMfQKMyIee2bsZw-SdzpCz0lyu8HG1YVlVToIXYHC17d6i_P2XHpwNLGD0jEBBdN1b3Dpy3g58elwIEMsvtuIGvIUt4hbgp238ev8LfHOgU1bEEeMYdSC5_KV0cM2kzMQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: refined, warm, work_friendly, date_night, outdoor
- Tagline: Bright riverside dining with terrace views in Puerto Madero
- Description: Located at Pierina Dealessi 140 within the Coleccion Fortabat complex, this restaurant features a modern interior with large windows flooding the space with natural light, sheer curtains, and modern seating. A visible outdoor terrace extends the dining area toward the Puerto Madero waterfront, offering an additional setting for meals.
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

