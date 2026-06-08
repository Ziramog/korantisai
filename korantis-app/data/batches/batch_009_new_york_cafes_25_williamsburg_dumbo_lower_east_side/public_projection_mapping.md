# Stage 10/11 Public Projection Mapping - batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side

Mode: dry-run only. No public write, no Supabase write, no Cloudinary upload.

## Summary

- Approved projected: 14
- Paused skipped: 11
- Rejected skipped: 0
- Invalid approved skipped: 0

## Intended Public Writes

### Café Colmado

- Target public venue id: `korantis_new_york_city_cafe_colmado_chijxes_bwbz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNMTWttVtUwsjGK9rY8biSEKqzfBMS3z4__83SqutvApyrkj4oKvfeM8o0DUOGUdauD2ByQxbbWcJySJDm2BJoiLiuwjoW_p-A4jEje7qtN8ofzhgOgjYr-2NYlhPXLYE2rjlgys4EY_RejIw9cnyIy-w=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A warm corner café in the heart of the Lower East Side
- Tags: warm, quiet, intimate, work_friendly, hidden_gem, cafe, Lower East Side

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Intelligentsia Coffee High Line Hotel Coffeebar

- Target public venue id: `korantis_new_york_city_intelligentsia_coffee_high_line_hotel_coffeebar_chijy6rdx7hz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOqWJ1f9Vr77lhu8ZSHg9MaaVYE0P9HspEHNLa4bQHinDoSrQGuQyrJ8jIJFLm-u4KbaM73IeJ9vcfQTCKmdNr4z60TAmigx_GMvP5rVXK5cjUoMH9B-_PmjH3Wrim1HBkLUnKSbnQxuf3kupU7zfRXGQ=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Specialty coffee in a lush Chelsea courtyard setting
- Tags: warm, refined, outdoor, quiet, work_friendly, cafe, Chelsea

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### RHYTHM ZERO | WEST VILLAGE

- Target public venue id: `korantis_new_york_city_rhythm_zero_west_village_chijhzo_cabz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMztCXgHyqc7TrZT6cZlOhqyLtolZCstGnU8CK5H1QByzS8iVmOKIFk8b9sFCI55ubcCfAJqOwOJJfMwXN7H08jRB1KdrZ46rZDv_-gDAko70oeHO67tYIyt-cYuoyWNYGt2XXTmpsVtRZGy_0diHSl=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Minimalist cafe sanctuary in the heart of the Village
- Tags: quiet, intimate, creative, refined, work_friendly, cafe, West Village

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Bakeri

- Target public venue id: `korantis_new_york_city_bakeri_chijyrmchgdz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNAnMjxA8OJSKJueLDAas0q6LSzdF0glLyQG3zN6eI4l-yx_g-xklOOVoPp_qMxLqs5hBDmJK2bJLiZ47RKo7M7KTp-2L5ha0hPAvGCPovKnuxW2H2duv1Fdc4e2lr0A94hyK-mZNwGFnvX_d0=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Williamsburg's neighborhood bakery with heart and soul
- Tags: warm, quiet, work_friendly, hidden_gem, intimate, bakery_cafe, Williamsburg

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### A&C Super

- Target public venue id: `korantis_new_york_city_aandc_super_chijd4uuecfz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZM1Wl6tk5H2RSW57rNvbwGv1hTvK7AS-hDTQyFYWAHclm4GkFBQ_12Y1O1g7xXlZ3ZNtmB8fUwijZrAHdLcKhJ41-iNJhQOKR6pfSM0pUcHzec5CQU7pEa4ZZyZCbRMj4H-oudkghZhtus3-q-BwHrk=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Bright Williamsburg mornings, the local way
- Tags: work_friendly, quiet, warm, creative, social, cafe, Williamsburg

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Paris Baguette

- Target public venue id: `korantis_new_york_city_paris_baguette_chij7bjlk1vz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMBnyUY5ja3s8EDycgm4P_h3N-s2xBRXh6t_t7bMJCv7m-kk2_XSkcfkVz0yjMdhmgarWYnKJ9XMyfKoCd6IBEgB6miG3de5llMovoMFT7sRaoes1G6XZLt_lLYlusPKCb0_ILUyPK_aIbz3ZvQPRtbSA=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Where Brooklyn starts its morning
- Tags: warm, work_friendly, social, quiet, cafe, Williamsburg

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Dawn’s Til Dusk

- Target public venue id: `korantis_new_york_city_dawn_s_til_dusk_chijftvdezfa`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZN15fLjG4T0QjOIZ0NU9V2D7fy7658O1oKkmZE7M3KIDnw82ODwynkIoRQt5Q-5Na3A78h_qtXwWFc18Xv7BX8r6JkvC3IC6wf2hfcB89eczKrKWVa3ztD1PTOF_RgZ8xnuutDfOIGovTEpNE3YVqLoUA=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A DUMBO cafe where industrial design meets morning-to-evening ease
- Tags: work_friendly, refined, quiet, creative, date_night, cafe, DUMBO

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Kaida Coffee and Bakery

- Target public venue id: `korantis_new_york_city_kaida_coffee_and_bakery_chijkzkqdabz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNFRmudyf8HJViCW1Jo61gxVrV_AtDXc80lue7He7OpR23M1Xft3aDfzSmYGMIFaf6xuDs_wzXpdrvxeiz36LK6BRlMCW2_fLUJ-Y3n2BuYwqOEGXoG2JJNXz6kstKd9_gnuC2ucuKq3-Fq6ylscJLR=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A warm corner for morning coffee and fresh-baked goods on Ludlow Street
- Tags: warm, quiet, work_friendly, intimate, hidden_gem, cafe, Lower East Side

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### maman

- Target public venue id: `korantis_new_york_city_maman_chijpr_8n6rz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNTvNUdQGX1wnQQ-WAl0KBfFHoks8Z3k43azgdwe8gwCRDAtK2NQQkuXt4bRMsrY6RqimKQHGmrl7CMv7ku5qwVQivwXPo_D2Gx75HsRtecQJQa78-vIO_UfQ_PE4Rzt4QGPMKqLmr3Zm_D=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A lush NoMad sanctuary for coffee, greenery, and calm.
- Tags: warm, quiet, work_friendly, social, creative, cafe, NoMad

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Aux Merveilleux de Fred

- Target public venue id: `korantis_new_york_city_aux_merveilleux_de_fred_chijzqklfzvz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOczeaeVq7Kcq5rSsXuW6T3jLwn9PVtFGqfYPEi4e85245ID9MPnV15gAela7UBx8qtdF8f9hMI13q79_BTnofbbMXH5tiyWz6sAxo-oo6vTcCmP2yI74i2FNrpcM2iPC-9wGc2odZJ6R9DapKPxFU7dA=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: French pastry perfection in the West Village
- Tags: warm, quiet, refined, intimate, cafe, West Village

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### maman

- Target public venue id: `korantis_new_york_city_maman_chijpr_8n6rz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNTvNUdQGX1wnQQ-WAl0KBfFHoks8Z3k43azgdwe8gwCRDAtK2NQQkuXt4bRMsrY6RqimKQHGmrl7CMv7ku5qwVQivwXPo_D2Gx75HsRtecQJQa78-vIO_UfQ_PE4Rzt4QGPMKqLmr3Zm_D=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A lush NoMad sanctuary for coffee, greenery, and calm.
- Tags: warm, quiet, work_friendly, social, creative, cafe, NoMad

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Stumptown Coffee Roasters

- Target public venue id: `korantis_new_york_city_stumptown_coffee_roasters_chijt2h1hkzz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZO2jGTXIAcBj-MCXXVg-b9Pk5VctyBDwkflDkUlAq84Ffg1X1-6qYcBpg5YyjTDYNxPd6VTcJy6YI123nh7yaZXdAytItF5A_aljKPOHoZJ1WIT7WBfIhCigbtcXxpEdm-ymrdNQz3G4UqqM-qYYsb0=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Portland roots, NYC craft—coffee as it should be.
- Tags: warm, work_friendly, quiet, creative, cafe, NoMad

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Pura Vida - NoMad

- Target public venue id: `korantis_new_york_city_pura_vida_nomad_chijk_cuuzvz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMbshrwHUkT4qSxb-vZHGsF_nI_FYp57RvfbHT6CxIdxOPsEJLsOFLZsPRpuyXTAgVGcI_1TzmdIgWFadXkKwWkJ4mHsQtw2zUNU5AWVS_clwa_zl7VUMKIijAKjKuOD9D5_uiwu2sJw01NFyqpaAr1jg=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Bright all-day café in NoMad
- Tags: lively, warm, work_friendly, social, cafe, NoMad

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Nick + Sons Bakery

- Target public venue id: `korantis_new_york_city_nick_sons_bakery_chijnz5rvzrz`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMCIXepgRVD66zR6gZvxbs91tXk0f_oF4qoxqhEg7Rjjt1zlsjcy9agMC8pkc-isAtcryikJgwyi080TUMG3DjcII15Yq2QDg7iAUmpzVN6x0k6MdQcOjxhKugV3KPKecBqJFIAQIU9LvkomDlDNAby=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Artisan loaves and espresso in a Brooklyn bakery
- Tags: warm, quiet, hidden_gem, refined, work_friendly, bakery_cafe, Williamsburg

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

## Skipped Decisions

- Paper Sons Cafe: decision_pause
- Yanni's Coffee: decision_pause
- Sip Coffee & Matcha: decision_pause
- Black Star Bakery & Cafe: decision_pause
- Tous Les Jours: decision_pause
- Almondine Bakery: decision_pause
- Burrow: decision_pause
- Rex: decision_pause
- Bourke Street Bakery: decision_pause
- La Bergamote (Chelsea): decision_pause
- Claude Bakery West Village: decision_pause
