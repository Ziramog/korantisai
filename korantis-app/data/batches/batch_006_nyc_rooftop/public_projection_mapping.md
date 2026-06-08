# Stage 10/11 Public Projection Mapping - batch_006_nyc_rooftop

Mode: dry-run only. No public write, no Supabase write, no Cloudinary upload.

## Summary

- Approved projected: 7
- Paused skipped: 5
- Rejected skipped: 0
- Invalid approved skipped: 0

## Intended Public Writes

### Maison Provence Restaurant

- Target public venue id: `korantis_new_york_city_maison_provence_restaurant_chijm83r0azz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZPfI9V_PCeuMtUOwz6JnX8gyrhUxaDTE6vSmkM3DTezRf-cR_81aRxoWP14APq98xkkdZD_spMehwt56Q856CCh4BgYiGGsB-b3HBbOP8csQH4H5s6OFbepIxUp2wEW4mg0getS9XtfGwgahTymi4y4Sg=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A cozy French bistro with a lush, plant-filled interior in the heart of Williams
- Tags: warm, romantic, intimate, hidden_gem, refined, bar, Williamsburg

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### With Others

- Target public venue id: `korantis_new_york_city_with_others_chijpygkvezz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNo3ty_waF-w-jxuThgYx_zhVQnQ_UmlwG8gf1ifjFKUgj9zhWiLZNrh8qurwwX626r9CgPAHRz9_DpXoocN-Auysgje5Lznr2F2qk5ws5Ov5aut82u_QUYRzESAzIIlwTeTvQ2L7nsnk7ceCpPHz2P6A=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A warm corner bar in Williamsburg for lingering over drinks
- Tags: warm, intimate, social, late_night, bar, Williamsburg

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Olympia

- Target public venue id: `korantis_new_york_city_olympia_chijdxdmstna`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNeuFRwJrV7Sp55oBMBq-bxOFPKwYsxpVjItsVAvR3xFxV5aHxUbrVgLYNmGvitSm8LoiUHIwZvuBwiM5MXN659kOg2-PGjFJIdtDemAejQnWbe0S_ViUtO3CsfsOocIKRS7LS9UC7ROU4N1Mc=s4800-w1600-h1535
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: An intimate wine bar in DUMBO with warm candlelit ambiance
- Tags: warm, intimate, refined, date_night, bar, DUMBO

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Anaïs

- Target public venue id: `korantis_new_york_city_anais_chijr9ukg5tb`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZPTYFzbfRNRnbxzxfMYLtwZLTNxRruEQsdfNW4Gj8GeXEXJk6gCw3IC2e-5QvxvvH09X1VObkHFkGpbdInG-xb2B2mU_WkVqdRthwF-FVuL64G9WFToWjLBv4o7RVOG23qOIstI3P9y92wRAMoKdK2fCQ=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A neighborhood wine bar with warm light and curated bottles
- Tags: warm, intimate, date_night, refined, quiet, bar, Brooklyn Bridge Park

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Balvanera

- Target public venue id: `korantis_new_york_city_balvanera_chijvrnghofz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNPv2xcrNsXn9ADUBBaKdw2pnrOgVJk8rXoM2qx4q5N3aw-J6le7ld_SjSOqzec3BFSqifRXgUdHs_BvKIljDmnD5X16GDIqgF8AVUzdM_sqsTMeoEg9tCKKVpCfDff0czvbHGTYFZ2SOAwxBg=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A Lower East Side patio with exposed brick, murals, and string lights
- Tags: outdoor, cinematic, social, late_night, hidden_gem, bar, Lower East Side

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Brick Wine Bar

- Target public venue id: `korantis_new_york_city_brick_wine_bar_chijz3m5l6xz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMyz1BEmjI1rx1MSAO-JjpUrnla7ECO-bDdvOkRFBKknd9DH22CmvYmImcBJuxH3WoQBzfe6ND8WqyI5h1utKSWEbVXAYlOjRjbDQSl073d1aH7q7NhhGG8vSAHZk-DxFvcIeS3IPJZGle1b9U=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A perfectly-rated wine bar in the Lower East Side with warm, candlelit evenings.
- Tags: warm, intimate, refined, date_night, romantic, bar, Lower East Side

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Ainslie Bowery

- Target public venue id: `korantis_new_york_city_ainslie_bowery_chijyx4u_qrz`
- Staging score: 100
- Hero image: https://ainsliebowery.com/wp-content/uploads/2026/05/hpSlide-BeerGarden.jpg
- Image rights status: venue_controlled_source_review_required
- Public curation status preview: `pending_review`
- Tagline: A lush Bowery bar with communal tables, brick arches, and hanging greenery
- Tags: warm, social, late_night, creative, bar, Bowery

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

## Skipped Decisions

- Woodhul Wine Bar: decision_pause
- Pinkerton Wine Bar: decision_pause
- Black Mountain Wine House: decision_pause
- Somm Time: decision_pause
- Jadis: decision_pause
