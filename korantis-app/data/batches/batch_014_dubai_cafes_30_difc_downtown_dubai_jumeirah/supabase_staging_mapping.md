# Supabase Staging Mapping Dry Run

- Batch: batch_014_dubai_cafes_30_difc_downtown_dubai_jumeirah
- Generated: 2026-06-08T15:28:04.791Z
- Dry-run only: yes
- venue_images conflict key for apply: venue_id,photo_reference
- venue_atmosphere excluded from apply: yes

## Required venue_images Index

```sql
create unique index if not exists venue_images_venue_photo_reference_uidx
on venue_images (venue_id, photo_reference);
```

## Venue Mapping

### Caju Coffee House

- Source id/name: ChIJAd4hBttpXz4RgU0Osdvtd4Y
- Target staging id: ChIJAd4hBttpXz4RgU0Osdvtd4Y
- Category: cafe
- Neighborhood: Downtown Dubai
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOExB-EShY1nEHrQqadhJXAOxnuJLP5nP3_26VX9HJMj7hzKEpxJPj0M9HmyaoeGjLi5myk6xiFu4Og-m1v6ODdn-c-yydezZCl82_kAMT-zX_Zgxhrml96vSt9FaVEDVKNQDQ5eWy5M2Yvurpm9Cs0=s4800-w1600-h1365
- Image rights status: not_approved_for_publication
- Tags: warm, intimate, creative, work_friendly, date_night
- Tagline: Tropical warmth meets downtown elegance
- Description: Caju Coffee House presents a thoughtfully designed space with tropical accents, woven lighting, and cozy banquette seating in Downtown Dubai's Al Manzil area. The venue maintains a 4.9-star average across 421 reviews, offering guests a warm, inviting setting from early morning through evening.
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

### Mokha 1450 Coffee Lounge

- Source id/name: ChIJuwG5IGNrXz4RAucY1xKuvsk
- Target staging id: ChIJuwG5IGNrXz4RAucY1xKuvsk
- Category: cafe
- Neighborhood: Palm Jumeirah
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNSdKOyyB839cK9OLukxsYcx7HqNs9-_fRUoOcnm5b3uay2iuFOdwFKO2sSVJiJkOu1AhWZ9m-mhUun5fB15V6VDcH9k7nFZTHGv8pU2eAkMPUTVCSVlMCxX_gLj-XJJjIA1_HtkKbKaUeQpw=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: refined, warm, quiet, late_night, date_night
- Tagline: Yemeni coffee heritage meets Palm Jumeirah refinement
- Description: Mokha 1450 Coffee Lounge brings Yemeni coffee heritage to Palm Jumeirah's Golden Mile Galleria, operating from 7AM daily with late-night hours until 11PM on weekends. The well-lit interior features arched shelving, pendant lights, and a dedicated espresso bar that reflects a refined approach to specialty coffee service.
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

### Roasters Specialty Coffee House Palm Jumeirah Mall

- Source id/name: ChIJ3UefQjBrXz4RMjKz9hsBiVE
- Target staging id: ChIJ3UefQjBrXz4RMjKz9hsBiVE
- Category: cafe
- Neighborhood: Palm Jumeirah
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMKQBM3P888DWwwLYRWf3wf-XFMYgPFUNfM-L0INiF8KG0ynzfTvsrhvIHb1SSBMYQLXi59z4fr5a-PsU0xFO3_vSV_rSVjZYDyi4Dh1NyQkCKtweaD_zSENGre9plNDMPTHFTKP-a93nlThnjDXkVM2w=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, refined, quiet, work_friendly
- Tagline: Lush Palm Jumeirah cafe with marble tables and floor-to-ceiling palms
- Description: This specialty coffee house inside Nakheel Mall features a lush, well-lit interior with marble tabletops, upholstered seating, and large potted palms. The herringbone wood floors and vertical wood slat dividers add refined texture to the space.
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

### Cafe Wayfarer

- Source id/name: ChIJVdjGRhFDXz4RJsyA5G7IUxY
- Target staging id: ChIJVdjGRhFDXz4RJsyA5G7IUxY
- Category: cafe
- Neighborhood: DIFC
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNWFWNQCnKnlSOH6JNe1XRU3LUUbgqBT0bES8V92C8OUwtXsHCSeyf6a2g_SHp3U5fy0AsIOMMZ4DRHVztlNVyR4JnFrfJGJoLSSAAGPv92NKjeJ8H55upbi7rH_SUCEMg1O161BXl8wDfIGA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: work_friendly, warm, refined, social
- Tagline: Where DIFC finds its daily retreat
- Description: Cafe Wayfarer occupies the ground floor of Gate Avenue in DIFC, presenting an interior defined by lush greenery, banquette seating, and an arched ceiling adorned with decorative fabric. The space balances professional accessibility with natural warmth.
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

### Orijins

- Source id/name: ChIJddeXXQJDXz4RZ5arWL-5NbY
- Target staging id: ChIJddeXXQJDXz4RZ5arWL-5NbY
- Category: cafe
- Neighborhood: DIFC
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNtwE1IXbThv94HUuDfO2C-DTC5TMJdBL3RWUc8tMPkszwzzDgCy7L4aEp4aQ0zBsxIJ4NAT_ruSZEJFwjzv3thCptjzP8kf6RXpQ98npUyxAfp3q-WQeXXtKlGTVCJW7D3hBDL65vesGxXhA2URiBjjQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: quiet, refined, work_friendly, creative, cinematic
- Tagline: Clean lines. Considered coffee.
- Description: The interior features a vaulted white ceiling and polished concrete and marble surfaces beneath glasscloche pastry displays, with an espresso bar and illuminated menu board creating a clean, architecturally distinctive setting in the heart of DIFC.
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

### Have Coffee - DIFC

- Source id/name: ChIJsdzetbdDXz4RekMZD5STjGQ
- Target staging id: ChIJsdzetbdDXz4RekMZD5STjGQ
- Category: cafe
- Neighborhood: DIFC
- Hero image reference: https://images.squarespace-cdn.com/content/v1/61a881e4f23025786b03b6c9/d0a569e0-d7dd-4c9f-b7ae-20b63fddcfc9/Interior.jpeg?format=2500w
- Image rights status: not_approved_for_publication
- Tags: refined, work_friendly, creative, quiet, cinematic
- Tagline: Where specialty coffee meets DIFC refinement
- Description: Located in Dubai's DIFC financial district, Have Coffee presents a bright and airy interior designed with white couches, marble tables, wishbone chairs, and a stainless steel bar under an exposed industrial ceiling. The space balances refined aesthetics with creative industrial touches, offering specialty coffee in a sophisticated daily retreat.
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

### Coffee Planet - Foundry Downtown

- Source id/name: ChIJHzv3R0BpXz4RmNkldot8DjY
- Target staging id: ChIJHzv3R0BpXz4RmNkldot8DjY
- Category: cafe
- Neighborhood: Downtown Dubai
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNvExlgOyhrRtrK52sBR3gsMfNX8D4s5Unf_iXeMhepYRSqIe3wjZmYHsIe4_6k5zDBcqhJQe99J2p3XInlNcBgI3soMqkgR-bTX9abAj0CPQ8QIFyuOYOjhfvftai5eeObvZUn7dizkhrMe4M=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: work_friendly, quiet, refined, warm, lively
- Tagline: Where Downtown's rhythm meets its finest brew
- Description: This Downtown Dubai café impresses with exposed industrial ceilings and modern finishes creating a refined yet approachable atmosphere. A popular choice for remote workers and casual meet-ups in the Burj Khalifa district.
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

### The Coffee Merchant

- Source id/name: ChIJjbP3zj5pXz4RMN-Upw9VHHM
- Target staging id: ChIJjbP3zj5pXz4RMN-Upw9VHHM
- Category: cafe
- Neighborhood: Downtown Dubai
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZO_D_Ns4o6Ed82NEbzrhgK5y2Aj7vfIWdhW_eRB97jQUSTuJheL4lWT66Bb16SI50ZmtkuLeToYnZOtsuuJUSMDm1BkWggC8mVMFR9hUzWr2B22C1bobr6R6f0W4gFFFui2ydYeb0Q9usZx54RUj6Mz=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: work_friendly, refined, quiet, warm, date_night
- Tagline: Premium single-origin coffee in the heart of Business Bay
- Description: A specialty coffee destination in Business Bay with an exceptional 4.9 rating from 376 reviews. The bright, airy interior features wooden furniture, a dedicated bar counter with professional espresso equipment, and large windows creating a refined yet welcoming workspace atmosphere.
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

### Summer Soul Boutique - West Beach

- Source id/name: ChIJNc3JynZDXz4RHokaKJMvs7I
- Target staging id: ChIJNc3JynZDXz4RHokaKJMvs7I
- Category: cafe
- Neighborhood: Palm Jumeirah
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOxdmBGd89HbLognZHzYHt6os80oVV2-S4ZRSBj8tDqnlE6viM2fiwdb0rQY5c8deIRLlIbt14kwuERfZPWAFYRuJmVsU8Xf_21oGVs-xfa7LILSLw4D2GAcq7iYXFDs7u85agYBHUPh7LimBo=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, social, refined, work_friendly
- Tagline: Bright bites and good vibes on Palm Jumeirah's West Beach
- Description: Summer Soul Boutique occupies a sunlit corner at West Beach's The Club on Palm Jumeirah, where a herringbone tile wall and wooden shelves lined with ceramics frame a glass display case stacked with croissants, pastries, and cakes. The bright, airy interior creates an inviting backdrop for morning coffee rituals and relaxed afternoon breaks by the beach.
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

### Brews Cafe

- Source id/name: ChIJk1GdBdNpXz4RnZlaoZa6Bns
- Target staging id: ChIJk1GdBdNpXz4RnZlaoZa6Bns
- Category: cafe
- Neighborhood: Business Bay
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMJ45ZGowY0xrdE4D1S6jE8J7oRJmewTmDTWf9a-qwyZ5Zmgz6EhsxceKfX28tTnmIygOPIp_LYs_HYQnZe078qmkzmfLBcPMXPeSXnIg_YWU_xZter909Uj6SqjcSC7vx_Xlx7-7XzvElgkQ=s4800-w1600-h1135
- Image rights status: not_approved_for_publication
- Tags: warm, creative, work_friendly, social, lively
- Tagline: Brews Cafe: Where art, greenery, and great coffee meet in Business Bay
- Description: Brews Cafe in Business Bay features a bright, lush interior with a white brick wall backdrop, a notable mural of a woman on a bicycle, tall potted ficus trees, and pendant lighting over communal wooden tables. The space offers a warm, creative atmosphere suited for both work sessions and social gatherings.
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

### Roasters Specialty Coffee House Al Wasl

- Source id/name: ChIJQboZtNhfXz4RFvKQyydmFDg
- Target staging id: ChIJQboZtNhfXz4RFvKQyydmFDg
- Category: cafe
- Neighborhood: DIFC
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPKL6Foo_hEvId405YUE-bSAy7CO6MXH2ztQ0yYyx7E6t6nulHWpcepjblV8oRsK0T5RmKR-p_ZTq-qut9Uqzc_mAFY0eeosw8SoYTb1D_Ktck0P-NFBR8J6nMrP94oDiZaXX0FYbUkMZWrbXcb6MTs1w=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, outdoor, refined, date_night
- Tagline: Specialty coffee with Dubai skyline views
- Description: A specialty coffee house offering an outdoor terrace experience with panoramic Dubai skyline views. The bright, airy space features contemporary seating and serves carefully sourced single-origin coffees in a refined yet approachable setting.
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

### Risen Café and Artisanal Bakery, Palm Jumeirah

- Source id/name: ChIJhU5HmbdrXz4R3BN2VNh367A
- Target staging id: ChIJhU5HmbdrXz4R3BN2VNh367A
- Category: cafe
- Neighborhood: Jumeirah
- Hero image reference: https://risendubai.com/wp-content/uploads/2022/08/gallery-locations-17.jpg
- Image rights status: not_approved_for_publication
- Tags: warm, quiet, refined, date_night, work_friendly
- Tagline: Artisanal bakery and café with morning light on the Palm
- Description: Risen Café and Artisanal Bakery sits on the ground floor of Palm Jumeirah with a strong 4.9 rating across over 1,000 reviews. The bright, airy interior features warm wood accents, decorative pendant lighting, and arched windows overlooking the Palm, with a full pastry display counter and espresso machine visible.
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

### Risen Café and Artisanal Bakery, Business Bay

- Source id/name: ChIJzyz4ZHhpXz4RG2CLve4U-rU
- Target staging id: ChIJzyz4ZHhpXz4RG2CLve4U-rU
- Category: cafe
- Neighborhood: Business Bay
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNIpZB2oGKgm1sHGN1zhAMjDnfv0TW6CORit1-6PUOh6RvCmS8cMK93sNZ3rreEUf_1QuJNBQEWbiNC1BDA6JdCTImQ8zl9jdxbK8J2esFbueaXe9nMr_hpFrWiLps5h8p7ix3R60HwPYl2uSF3CDO0=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: work_friendly, quiet, refined, creative, warm
- Tagline: Rise bright: artisanal bakes, natural light
- Description: Set inside The First Collection hotel in Business Bay, Risen Café and Artisanal Bakery offers a bright, plant-adorned interior with booth seating and large windows overlooking tropical greenery outside. Its strong 4.9 rating from nearly 500 reviews reflects consistent quality in both its artisanal baked goods and its fresh, inviting atmosphere.
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

### % ARABICA DIFC LIMESTONE HOUSE

- Source id/name: ChIJfaoS6OlDXz4RnTwOXA60M6I
- Target staging id: ChIJfaoS6OlDXz4RnTwOXA60M6I
- Category: cafe
- Neighborhood: DIFC
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZMiLHnBYceWikX58Tx4rNmKoFBRSkgoAhEt3_7kM4Be9LwacMWVfTv-g72FRhgg6dT5MLe8NE9_SZ_ogpU-quUtqV2kg69OI7pAnmU4cyTOJDb8r17_owQWPoMXWwc4SqOXtWbZhdcxQiTsK_w=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: quiet, work_friendly, refined, creative
- Tagline: Minimalist specialty coffee with an effortless DIFC edge.
- Description: ARABICA brings its signature minimalist coffee culture to DIFC's limestone building. The space features a distinctive curved wood-and-white counter, mirrored back wall, and minimalist bench seating, creating an intentionally spare environment that supports both focused work and effortless coffee rituals.
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

### Boon Coffee Roasters Downtown

- Source id/name: ChIJY4w1meRDXz4RGC3bxG2Lzfo
- Target staging id: ChIJY4w1meRDXz4RGC3bxG2Lzfo
- Category: cafe
- Neighborhood: Downtown Dubai
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZNwT5XfR7pJPtVgB7MR85YCLmRnvcDE_VAWGCISQKMve8cYLg2PlWYU8pIWwDpc88OBQFebBLSvot3b2U2wQyFuSQbqULH-dh1bHD3LRpmM03FanRGM6AetA6yVpbSV4jsIXHaFeT8tTyZQomNGig-A=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: work_friendly, quiet, refined, social, warm
- Tagline: Contemporary coffee culture in the heart of Downtown Dubai
- Description: Boon Coffee Roasters Downtown occupies a well-lit modern space in Forte Tower on Sheikh Mohammed bin Rashid Boulevard. The café features marble communal tables, grey velvet seating, and a dedicated espresso bar, creating a refined yet approachable atmosphere for specialty coffee enthusiasts and remote workers alike.
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

### Caffeine Coffee Roaster

- Source id/name: ChIJE4472mBDXz4RN-EvO5WYtsQ
- Target staging id: ChIJE4472mBDXz4RN-EvO5WYtsQ
- Category: cafe
- Neighborhood: Downtown Dubai
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOf0e-4t-_X7QPUGv_lYZAR4GbZo0ZpUl4YCzMVV0ax_4JKUhNCVNYkZgrWmWK_zetoyw6g8oVxfteI1V5dCKNI-Q2RhpDaQUoPXKWOefWeJZuUNoLGAyWSfce1OUYuDPgU9sZl_XSD5ZJeyUzEIhzTuQ=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: refined, work_friendly, creative, warm
- Tagline: Craft coffee in a bright Downtown Dubai café
- Description: Located in City Walk, this café features a bright, airy interior with ornate white cabinetry, an espresso machine, and coffee bag displays under pendant lighting. The elegant setting and quality-focused offering make it a refined choice for coffee in Downtown Dubai.
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

### MOY SPECIALTY COFFEE

- Source id/name: ChIJY1S67ZlrXz4RjgYIKAZP5n4
- Target staging id: ChIJY1S67ZlrXz4RjgYIKAZP5n4
- Category: cafe
- Neighborhood: Jumeirah
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPPnhH-Tf8EIRuXuRU89SmZvns7M32GCYJ6x8w-LjW-EfH9MrdFZVMBXikVKmYjB-aM0a2-tY18rS0rfNiLj3CTv0nEWwHPvz0vTUSLFMlwK6wo7Yplig2ZYRdKdURDt-pEp55qwX8Cb-JsWHLrFqPynA=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: quiet, warm, intimate, creative, work_friendly
- Tagline: Specialty coffee, poured with purpose in Jumeirah
- Description: Moy Specialty Coffee occupies a minimalist space in Umm Suqeim with a hand-pour coffee mural as its artistic centerpiece. The venue pairs high ratings with extended weekend hours, catering to both early risers and those seeking a quiet afternoon retreat.
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

### Roasters Specialty Coffee House Dubai Hills

- Source id/name: ChIJ30cOMQBpXz4RiIqnBGaUbFs
- Target staging id: ChIJ30cOMQBpXz4RiIqnBGaUbFs
- Category: cafe
- Neighborhood: Jumeirah
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPr4VFfpWyCmX0UnhxefnsyCcycOoVn3gYwHOQw_EotZ6NRJO4YmDHCONURGdAPS5xv8gL61ZtRS9QXyXVdO1AnQFYswVEkGKuZX-RS4k2PEr9OuTO_sFmtBfgtV0PvIKvB0zDThzB-ppatclLFfO5C9g=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, late_night, refined, quiet
- Tagline: Craft coffee in a warm, refined Dubai Hills setting
- Description: Roasters Specialty Coffee House Dubai Hills occupies a premium spot in Dubai Hills Estate, delivering specialty coffee in a warm, well-lit interior. The space features marble tables, leather banquette seating, and natural botanical accents, creating a refined yet approachable atmosphere that works equally well for focused work sessions and casual gatherings.
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

### Boon Coffee Roasters - Palm Jumeirah Mall

- Source id/name: ChIJQ6zxD4xrXz4R7RHttLovnSQ
- Target staging id: ChIJQ6zxD4xrXz4R7RHttLovnSQ
- Category: cafe
- Neighborhood: Palm Jumeirah
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOJucPuwFDifdVBH5eGxJ2znxtZeJ2t43Y7zD6jnZOCILWPU04enNXYlCr5WW1rdu1VukqA9nynhqlCtWbSLZFiAiAI0_ILzmG1fIHWBUDipcfrTuhed_xh3CUgj3JrYZ7dMMailMxT2iSIx9OZ4MrGzg=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, quiet, social, intimate
- Tagline: Specialty coffee in a warm Palm Jumeirah setting
- Description: A specialty coffee café in Palm Jumeirah Mall with warm pendant lighting illuminating a well-designed interior featuring terrazzo floors, shelving and comfortable seating. Open daily from 8AM with extended weekend hours until midnight.
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

### % ARABICA DUBAI ROASTERY

- Source id/name: ChIJU_1y5pBrXz4R8Ukftad3mL8
- Target staging id: ChIJU_1y5pBrXz4R8Ukftad3mL8
- Category: cafe
- Neighborhood: Palm Jumeirah
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPMMZFfhp4cadu-39Bs5PNS3llP5jJZLTCAma-JUjWhtfXcy68Gto_hOtTXUHWH7WGcHCr16tof9YztKOraIoDTFoOSE8Ocg_OsgflJMeDyJuozkKv-MtoVnzcXsod8YjqD2AKXMg9N-BmZD7EvdSaC=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: work_friendly, refined, quiet, late_night, intimate
- Tagline: Palm Jumeirah roastery with floor-to-ceiling light and curated plants
- Description: A specialty roastery on Palm Jumeirah featuring a bright, plant-filled interior with tiered seating and floor-to-ceiling windows. Open daily from 7:30 AM to midnight, suitable for extended work sessions or relaxed daytime breaks.
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

### Ores Cafe

- Source id/name: ChIJh_3J4UNDXz4Rk_Q7lARKhYY
- Target staging id: ChIJh_3J4UNDXz4Rk_Q7lARKhYY
- Category: cafe
- Neighborhood: Jumeirah
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOPLMca-Te9neMzJmUCB1kI5N9MZljv5EcBvunwfLEEue0HBrEgTURLYVc1gm-El1AhkcD3j8VX_tJXc0MMo6H8WHGlwt6wQSbGFl4gRe4K017mrx4RLThBCiuy6GF2iGEN59B4eVMKKnAdZHI=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, outdoor, late_night, social, date_night
- Tagline: Bright cafe with terrace vibes in the heart of Jumeirah
- Description: Ores Cafe occupies a bright corner in Jumeirah with floor-to-ceiling windows and cushioned lounge seating, extending to a planted terrace with wicker chairs and parasols. Open daily from 8AM until late night, the space balances natural light and relaxed comfort for a range of occasions.
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

### Kimi - Speciality Coffee and Food

- Source id/name: ChIJfc-CWUtpXz4R5NFEr1RVyJY
- Target staging id: ChIJfc-CWUtpXz4R5NFEr1RVyJY
- Category: cafe
- Neighborhood: Business Bay
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZPiwhkV-DTBP6VrYojMn2UvYxB8O2v447s9mAKLbDsdGS0pW3lF3U8qkI38_dWMvx9GCVKdRiBFtb0eh7CI48ZrPiM6ZVRi-kYYTB3-o9aMsW6SO9kkQBuZ_2J26vZMhP0stA-GsxIZCPtljJSXaWuptw=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: work_friendly, refined, creative, warm
- Tagline: Specialty coffee in a sunlit, design-forward space
- Description: Kimi occupies a thoughtfully designed interior in Business Bay, where natural light filters through large windows onto marble tables and designer wooden chairs beneath exposed wood beams. The space blends specialty coffee focus with curated design details like woven pendant lights and terracotta banquette seating.
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

### Circle Cafe (Bay Square)

- Source id/name: ChIJqYALXjBoXz4R90--rnBoPBY
- Target staging id: ChIJqYALXjBoXz4R90--rnBoPBY
- Category: cafe
- Neighborhood: Business Bay
- Hero image reference: https://lh3.googleusercontent.com/place-photos/AJRVUZOexMzLV8n7mmcxSpCVpA3um8dbejvgq7esWjqBG17sdo8_7xPZ8ErbR1TdA_qP1HuusXVMOY7okpKFNXoj9LFNTYUrshY362yqMRh33LDQ7PtqQdBG69bNc4U_DGxGSwS3kZMOm_Uq-8PM17ludW3C=s4800-w1600-h1600
- Image rights status: not_approved_for_publication
- Tags: warm, work_friendly, creative, social
- Tagline: A bright escape in Business Bay
- Description: The interior features rattan pendant lights, a gallery wall, and a neon sign against light tones, creating an airy and inviting atmosphere. Consistent opening hours and a strong local rating make it a reliable choice in Business Bay.
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

