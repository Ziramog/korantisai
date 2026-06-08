# Stage 10/11 Public Projection Mapping - batch_014_dubai_cafes_30_difc_downtown_dubai_jumeirah

Mode: dry-run only. No public write, no Supabase write, no Cloudinary upload.

## Summary

- Approved projected: 18
- Paused skipped: 12
- Rejected skipped: 0
- Invalid approved skipped: 0

## Intended Public Writes

### Caju Coffee House

- Target public venue id: `korantis_dubai_caju_coffee_house_chijad4hbttp`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOExB-EShY1nEHrQqadhJXAOxnuJLP5nP3_26VX9HJMj7hzKEpxJPj0M9HmyaoeGjLi5myk6xiFu4Og-m1v6ODdn-c-yydezZCl82_kAMT-zX_Zgxhrml96vSt9FaVEDVKNQDQ5eWy5M2Yvurpm9Cs0=s4800-w1600-h1365
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Tropical warmth meets downtown elegance
- Tags: warm, intimate, creative, work_friendly, date_night, cafe, Downtown Dubai

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Mokha 1450 Coffee Lounge

- Target public venue id: `korantis_dubai_mokha_1450_coffee_lounge_chijuwg5ignr`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNSdKOyyB839cK9OLukxsYcx7HqNs9-_fRUoOcnm5b3uay2iuFOdwFKO2sSVJiJkOu1AhWZ9m-mhUun5fB15V6VDcH9k7nFZTHGv8pU2eAkMPUTVCSVlMCxX_gLj-XJJjIA1_HtkKbKaUeQpw=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Yemeni coffee heritage meets Palm Jumeirah refinement
- Tags: refined, warm, quiet, late_night, date_night, cafe, Palm Jumeirah

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Roasters Specialty Coffee House Palm Jumeirah Mall

- Target public venue id: `korantis_dubai_roasters_specialty_coffee_house_palm_jumeirah_mall_chij3uefqjbr`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMKQBM3P888DWwwLYRWf3wf-XFMYgPFUNfM-L0INiF8KG0ynzfTvsrhvIHb1SSBMYQLXi59z4fr5a-PsU0xFO3_vSV_rSVjZYDyi4Dh1NyQkCKtweaD_zSENGre9plNDMPTHFTKP-a93nlThnjDXkVM2w=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Lush Palm Jumeirah cafe with marble tables and floor-to-ceiling palms
- Tags: warm, refined, quiet, work_friendly, cafe, Palm Jumeirah

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Cafe Wayfarer

- Target public venue id: `korantis_dubai_cafe_wayfarer_chijvdjgrhfd`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNWFWNQCnKnlSOH6JNe1XRU3LUUbgqBT0bES8V92C8OUwtXsHCSeyf6a2g_SHp3U5fy0AsIOMMZ4DRHVztlNVyR4JnFrfJGJoLSSAAGPv92NKjeJ8H55upbi7rH_SUCEMg1O161BXl8wDfIGA=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Where DIFC finds its daily retreat
- Tags: work_friendly, warm, refined, social, cafe, DIFC

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Have Coffee - DIFC

- Target public venue id: `korantis_dubai_have_coffee_difc_chijsdzetbdd`
- Staging score: 100
- Hero image: https://images.squarespace-cdn.com/content/v1/61a881e4f23025786b03b6c9/d0a569e0-d7dd-4c9f-b7ae-20b63fddcfc9/Interior.jpeg?format=2500w
- Image rights status: venue_controlled_source_review_required
- Public curation status preview: `pending_review`
- Tagline: Where specialty coffee meets DIFC refinement
- Tags: refined, work_friendly, creative, quiet, cinematic, cafe, DIFC

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Coffee Planet - Foundry Downtown

- Target public venue id: `korantis_dubai_coffee_planet_foundry_downtown_chijhzv3r0bp`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNvExlgOyhrRtrK52sBR3gsMfNX8D4s5Unf_iXeMhepYRSqIe3wjZmYHsIe4_6k5zDBcqhJQe99J2p3XInlNcBgI3soMqkgR-bTX9abAj0CPQ8QIFyuOYOjhfvftai5eeObvZUn7dizkhrMe4M=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Where Downtown's rhythm meets its finest brew
- Tags: work_friendly, quiet, refined, warm, lively, cafe, Downtown Dubai

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Brews Cafe

- Target public venue id: `korantis_dubai_brews_cafe_chijk1gdbdnp`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMJ45ZGowY0xrdE4D1S6jE8J7oRJmewTmDTWf9a-qwyZ5Zmgz6EhsxceKfX28tTnmIygOPIp_LYs_HYQnZe078qmkzmfLBcPMXPeSXnIg_YWU_xZter909Uj6SqjcSC7vx_Xlx7-7XzvElgkQ=s4800-w1600-h1135
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Brews Cafe: Where art, greenery, and great coffee meet in Business Bay
- Tags: warm, creative, work_friendly, social, lively, cafe, Business Bay

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Risen Café and Artisanal Bakery, Palm Jumeirah

- Target public venue id: `korantis_dubai_risen_cafe_and_artisanal_bakery_palm_jumeirah_chijhu5hmbdr`
- Staging score: 100
- Hero image: https://risendubai.com/wp-content/uploads/2022/08/gallery-locations-17.jpg
- Image rights status: venue_controlled_source_review_required
- Public curation status preview: `pending_review`
- Tagline: Artisanal bakery and café with morning light on the Palm
- Tags: warm, quiet, refined, date_night, work_friendly, cafe, Jumeirah

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Risen Café and Artisanal Bakery, Business Bay

- Target public venue id: `korantis_dubai_risen_cafe_and_artisanal_bakery_business_bay_chijzyz4zhhp`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNIpZB2oGKgm1sHGN1zhAMjDnfv0TW6CORit1-6PUOh6RvCmS8cMK93sNZ3rreEUf_1QuJNBQEWbiNC1BDA6JdCTImQ8zl9jdxbK8J2esFbueaXe9nMr_hpFrWiLps5h8p7ix3R60HwPYl2uSF3CDO0=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Rise bright: artisanal bakes, natural light
- Tags: work_friendly, quiet, refined, creative, warm, cafe, Business Bay

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### % ARABICA DIFC LIMESTONE HOUSE

- Target public venue id: `korantis_dubai_arabica_difc_limestone_house_chijfaos6old`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMiLHnBYceWikX58Tx4rNmKoFBRSkgoAhEt3_7kM4Be9LwacMWVfTv-g72FRhgg6dT5MLe8NE9_SZ_ogpU-quUtqV2kg69OI7pAnmU4cyTOJDb8r17_owQWPoMXWwc4SqOXtWbZhdcxQiTsK_w=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Minimalist specialty coffee with an effortless DIFC edge.
- Tags: quiet, work_friendly, refined, creative, cafe, DIFC

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Boon Coffee Roasters Downtown

- Target public venue id: `korantis_dubai_boon_coffee_roasters_downtown_chijy4w1merd`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNwT5XfR7pJPtVgB7MR85YCLmRnvcDE_VAWGCISQKMve8cYLg2PlWYU8pIWwDpc88OBQFebBLSvot3b2U2wQyFuSQbqULH-dh1bHD3LRpmM03FanRGM6AetA6yVpbSV4jsIXHaFeT8tTyZQomNGig-A=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Contemporary coffee culture in the heart of Downtown Dubai
- Tags: work_friendly, quiet, refined, social, warm, cafe, Downtown Dubai

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Caffeine Coffee Roaster

- Target public venue id: `korantis_dubai_caffeine_coffee_roaster_chije4472mbd`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOf0e-4t-_X7QPUGv_lYZAR4GbZo0ZpUl4YCzMVV0ax_4JKUhNCVNYkZgrWmWK_zetoyw6g8oVxfteI1V5dCKNI-Q2RhpDaQUoPXKWOefWeJZuUNoLGAyWSfce1OUYuDPgU9sZl_XSD5ZJeyUzEIhzTuQ=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Craft coffee in a bright Downtown Dubai café
- Tags: refined, work_friendly, creative, warm, cafe, Downtown Dubai

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Roasters Specialty Coffee House Dubai Hills

- Target public venue id: `korantis_dubai_roasters_specialty_coffee_house_dubai_hills_chij30comqbp`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZPr4VFfpWyCmX0UnhxefnsyCcycOoVn3gYwHOQw_EotZ6NRJO4YmDHCONURGdAPS5xv8gL61ZtRS9QXyXVdO1AnQFYswVEkGKuZX-RS4k2PEr9OuTO_sFmtBfgtV0PvIKvB0zDThzB-ppatclLFfO5C9g=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Craft coffee in a warm, refined Dubai Hills setting
- Tags: warm, work_friendly, late_night, refined, quiet, cafe, Jumeirah

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Boon Coffee Roasters - Palm Jumeirah Mall

- Target public venue id: `korantis_dubai_boon_coffee_roasters_palm_jumeirah_mall_chijq6zxd4xr`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOJucPuwFDifdVBH5eGxJ2znxtZeJ2t43Y7zD6jnZOCILWPU04enNXYlCr5WW1rdu1VukqA9nynhqlCtWbSLZFiAiAI0_ILzmG1fIHWBUDipcfrTuhed_xh3CUgj3JrYZ7dMMailMxT2iSIx9OZ4MrGzg=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Specialty coffee in a warm Palm Jumeirah setting
- Tags: warm, work_friendly, quiet, social, intimate, cafe, Palm Jumeirah

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### % ARABICA DUBAI ROASTERY

- Target public venue id: `korantis_dubai_arabica_dubai_roastery_chiju_1y5pbr`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZPMMZFfhp4cadu-39Bs5PNS3llP5jJZLTCAma-JUjWhtfXcy68Gto_hOtTXUHWH7WGcHCr16tof9YztKOraIoDTFoOSE8Ocg_OsgflJMeDyJuozkKv-MtoVnzcXsod8YjqD2AKXMg9N-BmZD7EvdSaC=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Palm Jumeirah roastery with floor-to-ceiling light and curated plants
- Tags: work_friendly, refined, quiet, late_night, intimate, cafe, Palm Jumeirah

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Ores Cafe

- Target public venue id: `korantis_dubai_ores_cafe_chijh_3j4und`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOPLMca-Te9neMzJmUCB1kI5N9MZljv5EcBvunwfLEEue0HBrEgTURLYVc1gm-El1AhkcD3j8VX_tJXc0MMo6H8WHGlwt6wQSbGFl4gRe4K017mrx4RLThBCiuy6GF2iGEN59B4eVMKKnAdZHI=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Bright cafe with terrace vibes in the heart of Jumeirah
- Tags: warm, outdoor, late_night, social, date_night, cafe, Jumeirah

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Kimi - Speciality Coffee and Food

- Target public venue id: `korantis_dubai_kimi_speciality_coffee_and_food_chijfc_cwutp`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZPiwhkV-DTBP6VrYojMn2UvYxB8O2v447s9mAKLbDsdGS0pW3lF3U8qkI38_dWMvx9GCVKdRiBFtb0eh7CI48ZrPiM6ZVRi-kYYTB3-o9aMsW6SO9kkQBuZ_2J26vZMhP0stA-GsxIZCPtljJSXaWuptw=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Specialty coffee in a sunlit, design-forward space
- Tags: work_friendly, refined, creative, warm, cafe, Business Bay

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Circle Cafe (Bay Square)

- Target public venue id: `korantis_dubai_circle_cafe_bay_square_chijqyalxjbo`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOexMzLV8n7mmcxSpCVpA3um8dbejvgq7esWjqBG17sdo8_7xPZ8ErbR1TdA_qP1HuusXVMOY7okpKFNXoj9LFNTYUrshY362yqMRh33LDQ7PtqQdBG69bNc4U_DGxGSwS3kZMOm_Uq-8PM17ludW3C=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A bright escape in Business Bay
- Tags: warm, work_friendly, creative, social, cafe, Business Bay

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

## Skipped Decisions

- Kulture House Dubai: decision_pause
- Roasters Specialty Coffee House Emaar Beachfront: decision_pause
- Orijins: decision_pause
- The Coffee Merchant: decision_pause
- Roast Speciality Coffee, Marina: decision_pause
- Drinkit: decision_pause
- Summer Soul Boutique - West Beach: decision_pause
- Roasters Specialty Coffee House Al Wasl: decision_pause
- MOY SPECIALTY COFFEE: decision_pause
- The lost Restaurant and Specialty coffee: decision_pause
- Fuze Cafe Marina | Specialty Coffee: decision_pause
- Roasters Specialty Coffee House Sobha Hartland: decision_pause
