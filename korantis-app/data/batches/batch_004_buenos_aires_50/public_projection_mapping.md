# Stage 10/11 Public Projection Mapping - batch_004_buenos_aires_50

Mode: dry-run only. No public write, no Supabase write, no Cloudinary upload.

## Summary

- Approved projected: 30
- Paused skipped: 18
- Rejected skipped: 2
- Invalid approved skipped: 0

## Intended Public Writes

### Cobre Café

- Target public venue id: `korantis_buenos_aires_cobre_cafe_chijyxjkj6dl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780866982/korantis/public/batch-004-buenos-aires-50/cobre-cafe/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Industrial café warmth in Villa Crespo with quality coffee focus
- Tags: warm, work_friendly, creative, refined, quiet, cafe, Villa Crespo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### The Coffee Store Plaza Almagro

- Target public venue id: `korantis_buenos_aires_the_coffee_store_plaza_almagro_chijn6ff8pvl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780866984/korantis/public/batch-004-buenos-aires-50/the-coffee-store-plaza-almagro/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Bright coffee culture in Almagro
- Tags: social, work_friendly, outdoor, refined, cafe, Almagro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Salvaje Bakery

- Target public venue id: `korantis_buenos_aires_salvaje_bakery_chijg_ohkoy1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780866986/korantis/public/batch-004-buenos-aires-50/salvaje-bakery/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Art-covered walls, fresh pastries, Palermo's cozy corner
- Tags: warm, creative, intimate, quiet, hidden_gem, cafe, Palermo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Barine - café de especialidad

- Target public venue id: `korantis_buenos_aires_barine_cafe_de_especialidad_chijw18b1mk1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780866988/korantis/public/batch-004-buenos-aires-50/barine-cafe-de-especialidad/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Specialty coffee and pastries in a bright Palermo cafe
- Tags: warm, work_friendly, quiet, creative, cafe, Palermo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Le Rêve Bistró

- Target public venue id: `korantis_buenos_aires_le_reve_bistro_chije58ebl_1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780866990/korantis/public/batch-004-buenos-aires-50/le-reve-bistro/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: An intimate corner in Palermo's vibrant heart
- Tags: warm, romantic, intimate, date_night, restaurant, Palermo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Las Pizarras bistro

- Target public venue id: `korantis_buenos_aires_las_pizarras_bistro_chijdx2nais1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780866992/korantis/public/batch-004-buenos-aires-50/las-pizarras-bistro/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Slate walls and candlelight in a Palermo evening bistro
- Tags: intimate, romantic, date_night, refined, quiet, restaurant, Palermo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Negresco Bistró

- Target public venue id: `korantis_buenos_aires_negresco_bistro_chijb3eaeoll`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780866994/korantis/public/batch-004-buenos-aires-50/negresco-bistro/hero.jpg
- Image rights status: venue_controlled_source_review_required
- Public curation status preview: `pending_review`
- Tagline: Classic bistro elegance in the heart of Recoleta
- Tags: warm, refined, intimate, date_night, late_night, restaurant, Recoleta

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Piano Nobile

- Target public venue id: `korantis_buenos_aires_piano_nobile_chijkws_lrvk`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780866995/korantis/public/batch-004-buenos-aires-50/piano-nobile/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Refined dining beneath crystal in a Recoleta palace
- Tags: warm, romantic, intimate, refined, historic, restaurant, Recoleta

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### L'Antiquario Cafe Bistro

- Target public venue id: `korantis_buenos_aires_l_antiquario_cafe_bistro_chijgcvjlxpl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780866998/korantis/public/batch-004-buenos-aires-50/l-antiquario-cafe-bistro/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Old-world charm meets San Telmo soul.
- Tags: warm, historic, romantic, intimate, late_night, restaurant, San Telmo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Farmacia Lezama - Bistrot

- Target public venue id: `korantis_buenos_aires_farmacia_lezama_bistrot_chijr80sszll`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867000/korantis/public/batch-004-buenos-aires-50/farmacia-lezama-bistrot/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: An intimate evening escape in San Telmo's historic heart
- Tags: intimate, warm, romantic, late_night, historic, restaurant, San Telmo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### A DONDE

- Target public venue id: `korantis_buenos_aires_a_donde_chijsahkhbk1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867002/korantis/public/batch-004-buenos-aires-50/a-donde/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: An intimate evening of Argentine flavors in Villa Crespo
- Tags: intimate, romantic, refined, date_night, warm, restaurant, Villa Crespo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Contraluz

- Target public venue id: `korantis_buenos_aires_contraluz_chijt8n4m7bk`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867004/korantis/public/batch-004-buenos-aires-50/contraluz/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: An atrium of light in Buenos Aires' Retiro
- Tags: refined, warm, romantic, intimate, date_night, restaurant, Retiro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### St. Regis Restaurant

- Target public venue id: `korantis_buenos_aires_st_regis_restaurant_chijbr_vg7xk`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867006/korantis/public/batch-004-buenos-aires-50/st-regis-restaurant/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Elegant grand dining in the heart of Retiro
- Tags: refined, romantic, cinematic, historic, intimate, restaurant, Retiro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Selva Mía

- Target public venue id: `korantis_buenos_aires_selva_mia_chijuu5f7ei1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867008/korantis/public/batch-004-buenos-aires-50/selva-mia/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A jungle oasis in the heart of Palermo
- Tags: intimate, romantic, outdoor, late_night, creative, bar, Palermo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Intervalo Bar

- Target public venue id: `korantis_buenos_aires_intervalo_bar_chijuu_xakhl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867010/korantis/public/batch-004-buenos-aires-50/intervalo-bar/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Warm lighting, curated drinks, Recoleta evenings.
- Tags: warm, refined, late_night, date_night, intimate, bar, Recoleta

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### BOCANADA

- Target public venue id: `korantis_buenos_aires_bocanada_chij7xrdqnzl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867014/korantis/public/batch-004-buenos-aires-50/bocanada/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Historic San Telmo bar with bright turquoise facade and lively outdoor terrace
- Tags: historic, social, late_night, outdoor, warm, bar, San Telmo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Nido de Tigre

- Target public venue id: `korantis_buenos_aires_nido_de_tigre_chijey8siqq1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867016/korantis/public/batch-004-buenos-aires-50/nido-de-tigre/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Candlelit lounge in Chacarita with vintage charm
- Tags: intimate, warm, romantic, date_night, hidden_gem, bar, Chacarita

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Social Paraíso Bistró | Recoleta

- Target public venue id: `korantis_buenos_aires_social_paraiso_bistro_recoleta_chij8wamkrtl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867018/korantis/public/batch-004-buenos-aires-50/social-paraiso-bistro-recoleta/hero.jpg
- Image rights status: venue_controlled_source_review_required
- Public curation status preview: `pending_review`
- Tagline: Ornate Recoleta cocktails in a restored historic building
- Tags: warm, refined, historic, intimate, romantic, cocktail_bar, Recoleta

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Pipi Lounge

- Target public venue id: `korantis_buenos_aires_pipi_lounge_chijramkegc1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867020/korantis/public/batch-004-buenos-aires-50/pipi-lounge/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Cozy corner for crafted cocktails in Villa Crespo
- Tags: warm, late_night, intimate, creative, hidden_gem, cocktail_bar, Villa Crespo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### LE CLUB BACAN

- Target public venue id: `korantis_buenos_aires_le_club_bacan_chijou38bmtl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867022/korantis/public/batch-004-buenos-aires-50/le-club-bacan/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: An intimate retreat in the heart of Retiro
- Tags: intimate, refined, warm, romantic, late_night, cocktail_bar, Retiro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Osaka Concepción

- Target public venue id: `korantis_buenos_aires_osaka_concepcion_chijnb1li0a1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867025/korantis/public/batch-004-buenos-aires-50/osaka-concepcion/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Nikkei flavors in a candlelit Colegiales corner
- Tags: intimate, creative, date_night, romantic, refined, cocktail_bar, Colegiales

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Tradition & Rebellion

- Target public venue id: `korantis_buenos_aires_tradition_and_rebellion_chijw9o5vqa1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867027/korantis/public/batch-004-buenos-aires-50/tradition-and-rebellion/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Where the waterfront skyline meets midnight cocktails
- Tags: romantic, late_night, refined, cinematic, cocktail_bar, Puerto Madero

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Alvear Roof Bar

- Target public venue id: `korantis_buenos_aires_alvear_roof_bar_chijhy6qgqtk`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867029/korantis/public/batch-004-buenos-aires-50/alvear-roof-bar/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Rooftop escape in Palermo with pink neon glow and intimate warmth
- Tags: intimate, warm, romantic, late_night, cinematic, bar, Palermo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Duhau Restaurante & Vinoteca

- Target public venue id: `korantis_buenos_aires_duhau_restaurante_and_vinoteca_chijv_h3h0jl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867031/korantis/public/batch-004-buenos-aires-50/duhau-restaurante-and-vinoteca/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A garden of quiet elegance in Recoleta
- Tags: refined, romantic, historic, quiet, outdoor, restaurant, Recoleta

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Verdot Wine Bar

- Target public venue id: `korantis_buenos_aires_verdot_wine_bar_chijotv74kjl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867034/korantis/public/batch-004-buenos-aires-50/verdot-wine-bar/hero.jpg
- Image rights status: venue_controlled_source_review_required
- Public curation status preview: `pending_review`
- Tagline: A refined wine sanctuary in Recoleta's evening glow
- Tags: romantic, intimate, quiet, refined, warm, bar, Recoleta

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Los Jardines De Las Barquin

- Target public venue id: `korantis_buenos_aires_los_jardines_de_las_barquin_chij5zgugcbl`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867036/korantis/public/batch-004-buenos-aires-50/los-jardines-de-las-barquin/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A lush garden terrace in the heart of Retiro
- Tags: romantic, intimate, warm, hidden_gem, restaurant, Retiro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### BAUTISTA Av. Rivadavia

- Target public venue id: `korantis_buenos_aires_bautista_av_rivadavia_chijbwwt2m7l`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867039/korantis/public/batch-004-buenos-aires-50/bautista-av-rivadavia/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A bright corner café-bar on Rivadavia with a blue awning and steady neighborhood
- Tags: warm, work_friendly, social, hidden_gem, bar, Almagro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Tostado - Nuñez

- Target public venue id: `korantis_buenos_aires_tostado_nunez_chije8jvhtu1`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867041/korantis/public/batch-004-buenos-aires-50/tostado-nunez/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Industrial cafe meets refined comfort in Nuñez
- Tags: creative, work_friendly, social, warm, refined, cafe, Nuñez

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### La Giralda

- Target public venue id: `korantis_buenos_aires_la_giralda_chija8pen8bk`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867043/korantis/public/batch-004-buenos-aires-50/la-giralda/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Historic corner café on Avenida Corrientes since 1934
- Tags: warm, historic, outdoor, social, late_night, bar, Centro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Petit Colón

- Target public venue id: `korantis_buenos_aires_petit_colon_chije02agsbk`
- Staging score: 100
- Hero image: https://res.cloudinary.com/dmdjhvyqs/image/upload/v1780867045/korantis/public/batch-004-buenos-aires-50/petit-colon/hero.jpg
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Historic Buenos Aires cafe-bar with warm, ornate interiors
- Tags: warm, historic, refined, late_night, work_friendly, restaurant, Centro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

## Skipped Decisions

- Roster Cafe Recoleta: decision_pause
- Cafeto 2020: decision_pause
- Borja Specialty Coffee: decision_pause
- Cosecha Almagro: decision_pause
- Cuervo Café: decision_pause
- Café Registrado: decision_pause
- Tostado - Puerto Madero: decision_pause
- Bicho Café de Especialidad Recoleta: decision_pause
- Banu: decision_pause
- Cave Canem: decision_pause
- Lutero Bar: decision_pause
- SOFÁ - un bar: decision_pause
- Bar PUNTO MONA: decision_pause
- Veredita: decision_pause
- Don Gato: decision_pause
- GRAPIN: decision_reject
- La Carbonera: decision_pause
- Naranjo Bar: decision_pause
- Bruce Wine: decision_pause
- Anselmo Lounge & Wine Bar: decision_reject
