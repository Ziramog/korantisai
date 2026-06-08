# Stage 10/11 Public Projection Mapping - batch_005_buenos_aires_restaurants_50

Mode: dry-run only. No public write, no Supabase write, no Cloudinary upload.

## Summary

- Approved projected: 18
- Paused skipped: 32
- Rejected skipped: 0
- Invalid approved skipped: 0

## Intended Public Writes

### Mambo Restoran

- Target public venue id: `korantis_buenos_aires_mambo_restoran_chijbrmg2djl`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMK0XiiHuoNH0jk4ThMrBcCSZun3OmBjmi43h9V6IGheApFJXILhqokprdow_Zun5ZXhD81YhE2ceyMMqKHLVazbHcFRLIVNaRUYiQATgdd1DCxGqKum-5FUcNkRn8gd2oJf6T_RCptFvPgO9R1WKEI=s4800-w1366-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Industrial warmth in the heart of Villa Crespo
- Tags: warm, refined, creative, intimate, date_night, restaurant, Villa Crespo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Tu Jardín Secreto - Restó Secreto

- Target public venue id: `korantis_buenos_aires_tu_jardin_secreto_resto_secreto_chijbuxjqt21`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZPgKvmxzMmfAc13hVIkHxVY_dOQpbhu88lC950ujxELFlL3Ex2Ea-jUZBGsxHa-D1g9kgSHQEbo03iagYh-g1Otvwt36__ctF2oqpNEkLLf__8PjOqEQf2nJdClL6qpF4F9hz_kx6lkHBQBjH9RLs7F=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Your secret garden in the heart of Colegiales
- Tags: warm, intimate, hidden_gem, creative, romantic, restaurant, Colegiales

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Parrilla Nuñez

- Target public venue id: `korantis_buenos_aires_parrilla_nunez_chij03_aogc1`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOsGLcJY4ODpNNfWnu3oJIQLzCxicNlO12E1xlr4xLXXY13dSOUPFgdqyuSMKkCiOnfifm5Al1hZqDR-w_a0aTN6oa5dGhNLdbi4ie-jJxXuvW9hxp5jpLj-eeqf3-1P_casXoXDlCaD90ynmWTw2lbEQ=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Classic Argentine grill with soul in Belgrano
- Tags: warm, intimate, historic, date_night, restaurant, Belgrano

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### La Dorita del Mercado Belgrano

- Target public venue id: `korantis_buenos_aires_la_dorita_del_mercado_belgrano_chijl46_5cq1`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOUb7URcmwr5sYQ5NyHFHtZBDsfoKm4SZDl4yY_XkHrRVaHfoIhNeRcBNZ2M3t3qGDy4KO_QuQLetkFdp3S3dSTOpMrzz0awts2JgKALEm1sideVeau0LycuSo65iW9fbxUz240ABGzefl29BXmh5Z5lg=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Sabores del mercado en un espacio industrial-rústico
- Tags: lively, warm, creative, social, late_night, restaurant, Belgrano

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Atis Bar

- Target public venue id: `korantis_buenos_aires_atis_bar_chijiqql59jl`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZPZ8XBQcNGcyI56NHoDI4TRYnuXp7FbxHcskPq8yTDyGRmYBjr3KCsYvjyx7q-vD-2Z-m1kF9WAA1L1TQHAAuhTI4PlOBSB5kWmGQek-6U-6g6I4MZ2Vd025coiAER3Do6597TwtSShbtITrQ=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Historic San Telmo terrace with twinkling lights and courtyard charm
- Tags: warm, romantic, intimate, historic, cinematic, bar, San Telmo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### RUFINO

- Target public venue id: `korantis_buenos_aires_rufino_chijw0yrh2hl`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZONZl6rtaOJKZy7s1dMq9WThnkD889BQDIb-1JVu97eKC5izGE5QSCvmoyy8qtR6gJVw3th0-7OAep35esTyawIaBIUVXfopBMjBQjKLASEO-Ca8B2KzoK_UwdU1wQlMulmT1E_EK9XPhwO_g=s4800-w819-h1024
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: An intimate Recoleta sanctuary of Argentine elegance
- Tags: intimate, warm, romantic, refined, date_night, restaurant, Recoleta

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### L' Orangerie Alvear Palace Hotel

- Target public venue id: `korantis_buenos_aires_l_orangerie_alvear_palace_hotel_chijnuuufkpk`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZO_aHKDA3H0gcQsNBddVPWn4cjamhlPGhVUffXRaZOEkFJEBf_YqgbUd89GT7In2zewsyqyluQnKiVhRMCJctj1wR3S8twhuk6sMZJHf9eWvMvtwC1u1cIp8vIJ2cDnTqQYJ7OQUd4ONmHg1sWMoTC3=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Elegant bar inside a historic Recoleta palace hotel
- Tags: refined, historic, intimate, warm, romantic, bar, Recoleta

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### jakub

- Target public venue id: `korantis_buenos_aires_jakub_chijlwjgkdq1`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZO9ScduTGILYKwl_mPkxbfjiXQTx3OefDuXY0Xc5cXXPGvidORynMZQvPcib6F_h9sNd_46pY4px8dnKV9gUp1I2TAGnFdb64Fbe6PtKGrhAvRAHGQBtLSbSn3RQCV-NtJdhaWjb1MBTcApN2xAFoUN=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A corner of warmth in Colegiales, morning to midnight
- Tags: warm, quiet, intimate, date_night, hidden_gem, restaurant, Colegiales

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Lo Del Francés Café Bistrot

- Target public venue id: `korantis_buenos_aires_lo_del_frances_cafe_bistrot_chijhzxv0czl`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMBlyVFrAvpaiEXLTlnoboYkGIBQz-QVVWFlGj8-0c9n3Q1hgijHXVCzY45eevKHSF8qijRBZNqESxEAwpylZuGKW0nZ0Wta5gEpC508KwsZkfm7Ao_4FrVxJece_zB_snjzEdJhLL6JLLvYA=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: European bistro charm in the heart of San Telmo
- Tags: warm, romantic, historic, creative, intimate, restaurant, San Telmo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Dada Bistró

- Target public venue id: `korantis_buenos_aires_dada_bistro_chijkasliatk`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMX9i01oRhEwW28mIndCODPlh4N_PFiCp9SstZqo1qm0eB345N_rSsIz1kgrFqYJaQBXmptDn9e2EsWC6mRxEJ7O96S3UxdHYXGQSGVNkurJs7z5h5gAueCbv-IEuoi8kAfcAT-Ggrg_F9lQDbXiVMX2g=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Industrial bistro bar with late-night soul in Retiro
- Tags: creative, late_night, intimate, social, cinematic, bar, Retiro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Maure Parrilla

- Target public venue id: `korantis_buenos_aires_maure_parrilla_chijc9pyatq1`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZP5Zb7k8YiVXiozAa_fD935DtEH8jpGtZl_leTtulxn5sRXkQyL_5_k_q3zD1wrp65PpY109CTIOJdFENI3y-wf_1-qi_HfvElh2fsZNiIFfTh_AodxhYZkAh10i7SK3AAg-xQTzg3BwgPZcUA=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A warm corner grill in Chacarita for relaxed, memorable evenings.
- Tags: warm, intimate, romantic, refined, quiet, restaurant, Chacarita

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Fraga Bodegón

- Target public venue id: `korantis_buenos_aires_fraga_bodegon_chijg2nmenm1`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZO1QLcIFK_NlBKttvcE9emN4T-bDG0-5W_7pJMArk0dKdb-8DhqGTZl_8TZWFgUPSSxMQV_KMtQq8riBt_q1lNFvPQpxsd4yC572snEjmLvZtfxLCoe7BRYfuldLoAdL13pIBE-TX5AvgnidEpzFm7grw=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: A Chacarita wine bar with neighborhood warmth
- Tags: warm, romantic, intimate, refined, date_night, restaurant, Chacarita

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Parrilla Lo De Mary - Restaurante

- Target public venue id: `korantis_buenos_aires_parrilla_lo_de_mary_restaurante_chijv3shegpk`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNC4qZ493rKmFwdQhHb2RBbdSsuUIJkUVKexklT6Rz53Ay_ynhaKxz7JDvyvqd3qeTK9HuzKIzPrQY4pVESm405DLe9TMazJH5e0g2daV4AdlAmL0P2-4FzIVl8RBEWyF8lmTgcH0kD3dFk=s4800-w720-h720
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Classic Argentine grill with vintage soul in Almagro
- Tags: warm, intimate, historic, date_night, hidden_gem, restaurant, Almagro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Parrilla Cero5

- Target public venue id: `korantis_buenos_aires_parrilla_cero5_chij95dweyfl`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZNrYBZ02r6HGeSaRQo_JLZQoKoYKW3yJNK2caiBCIXfN4skNc5XpUetG5g10DLQXuT1Io8fxEiw_bv7MbxGnfycZ-NmC9NvIF8QSqJGflrePAIw131MaWrEJ_txk37v3USfwrUSTPrJcDsBFg=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Refined Argentine bar with classic wooden charm
- Tags: warm, intimate, late_night, refined, social, bar, Retiro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### El Mirasol de La Recova

- Target public venue id: `korantis_buenos_aires_el_mirasol_de_la_recova_chijsd_q9ldk`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMA0ZXWZ7hSFkkfy3-Oh1p0FnA-re_2Av74ccTqUwwzFD6_GAS8mnw4Eq8Yk_in-Kur8TxnYS8DHXLZNE_Qqe7v-ZxLjLsXmDg6wWGOf8ApPiCUHWJInH0yDeJB1PDV9O6DlRavgWY6wDzqVY3xHhzYnA=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Classic Argentine dining in a sunlit Retiro landmark
- Tags: warm, refined, date_night, late_night, social, restaurant, Retiro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### La Dorita

- Target public venue id: `korantis_buenos_aires_la_dorita_chij4z0wdo61`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZOD45o79ZQ25uMAOGtYdnx5i_pIwSyjVJDfZDW2yLfytXmu6TRpjdWeFnZgGW3IBwc2YT6sVoO9su5OZKleHNM15TZNzHuc8rWwKB3CT8hiFDflOnZlUIr1u1oszvah_Ta15htakNOOzhjOMl_90Gb5-g=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Eclectic late-night dining in the heart of Palermo
- Tags: warm, creative, social, late_night, date_night, restaurant, Palermo

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Ancora Buenos Aires

- Target public venue id: `korantis_buenos_aires_ancora_buenos_aires_chiju51wzpbl`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZP4bfh5lwz8NWT9SAl30yp04azf1eLLzMrXiQ1L22PA13RerxmNwv5tCjnx40f_O-zlmAsxI7hhcMwYWb-2RgRR7JeUuX82O9ARj5mkmCsvDEJKdp36le54bc3h7aZ64zNU9wBz5Ai46sj3vz7hj7adwA=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Refined dining in the heart of Retiro
- Tags: warm, refined, intimate, quiet, romantic, restaurant, Retiro

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

### Croque Madame Puerto Madero

- Target public venue id: `korantis_buenos_aires_croque_madame_puerto_madero_chijjcwpbze1`
- Staging score: 100
- Hero image: https://lh3.googleusercontent.com/place-photos/AJRVUZMuehinf__tbbSK4ZMfQKMyIee2bsZw-SdzpCz0lyu8HG1YVlVToIXYHC17d6i_P2XHpwNLGD0jEBBdN1b3Dpy3g58elwIEMsvtuIGvIUt4hbgp238ev8LfHOgU1bEEeMYdSC5_KV0cM2kzMQ=s4800-w1600-h1600
- Image rights status: google_places_sourced_attribution_required
- Public curation status preview: `pending_review`
- Tagline: Bright riverside dining with terrace views in Puerto Madero
- Tags: refined, warm, work_friendly, date_night, outdoor, restaurant, Puerto Madero

| Table | Operation | Unique key | Fields |
| --- | --- | --- | --- |
| venues | upsert | id | id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata |
| venue_images | upsert | id | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data |

## Skipped Decisions

- Casa Parra: decision_pause
- Bistro Tokio: decision_pause
- La Justina Bistró: decision_pause
- ALMA BUENOS AIRES: decision_pause
- Parrilla Sanabria Palermo: decision_pause
- La Caprichosa Parrilla: decision_pause
- Parrilla "La Coqueta": decision_pause
- Parrilla Lo de Susy: decision_pause
- La plazoleta parrilla: decision_pause
- Casa Cuba Restaurant & Grill: decision_pause
- Tierno Parrilla: decision_pause
- Nuestra Parrilla: decision_pause
- Parrilla La Banda: decision_pause
- El Taller Arte & Café: decision_pause
- Bar & Restaurant El Correo: decision_pause
- El Chiri de Villa Kreplaj: decision_pause
- Restaurante Corte Comedor: decision_pause
- Jardín de Invierno: decision_pause
- El Estrebe: decision_pause
- República del Fuego: decision_pause
- Parrilla lo del Russo: decision_pause
- La Esquina Del Virrey: decision_pause
- Casa Cuba: decision_pause
- El Tordo: decision_pause
- Hierro Parrilla San Telmo: decision_pause
- El Patio de Mingo: decision_pause
- El Mirasol De Boedo: decision_pause
- La Parrillita del Pasaje: decision_pause
- Huacho: decision_pause
- Anafe: decision_pause
- Pentos Colegiales: decision_pause
- Bar Britanico: decision_pause
