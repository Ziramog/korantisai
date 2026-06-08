# Stage 00 Venue Seed Selection Report

- Batch: batch_005_buenos_aires_restaurants_50
- Generated: 2026-06-08T00:24:49.742Z
- City: Buenos Aires
- Configured neighborhoods: Palermo, Recoleta, Chacarita, Villa Crespo, Colegiales, Belgrano, San Telmo, Almagro, Retiro, Puerto Madero
- Existing known venues indexed: 365
- Discovery mode: automated_google_places
- Total candidates discovered: 1102
- Candidates after dedupe: 557
- Candidates after hard filters: 327
- Final selected count: 50
- Rejected count: 169
- Already-known excluded count: 61
- Existing sources checked: supabase:staging_venues, supabase:venues, local_batch:batch_003_stage01_test:stage_01, local_batch:batch_003_stage01_test:batch_result_with_editorial, local_batch:batch_003_stage01_test:batch_result_quality_gated, local_batch:batch_004_buenos_aires_50:venue_seed, local_batch:batch_004_buenos_aires_50:stage_01, local_batch:batch_004_buenos_aires_50:batch_result_with_editorial, local_batch:batch_004_buenos_aires_50:batch_result_quality_gated

## Scoring Formula

`candidate_score = google_presence_score * 0.20 + review_volume_score * 0.15 + visual_strength_score * 0.20 + category_fit_score * 0.15 + neighborhood_balance_score * 0.10 + atmosphere_potential_score * 0.15 + source_diversity_score * 0.05`

## Counts By Type

- bistro: 20
- parrilla: 24
- restaurant: 6

## Counts By Neighborhood

- Villa Crespo: 3
- Colegiales: 7
- Belgrano: 8
- Almagro: 6
- Retiro: 6
- Palermo: 3
- Recoleta: 8
- Chacarita: 3
- San Telmo: 5
- Puerto Madero: 1

## Selected Venues

| Name | Neighborhood | Type | Score | Selection Reason | Source Signals |
| --- | --- | --- | ---: | --- | --- |
| Mambo Restoran | Villa Crespo | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Casa Parra | Colegiales | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Bistro Tokio | Belgrano | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| La Justina Bistró | Almagro | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| ALMA BUENOS AIRES | Retiro | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Parrilla Sanabria Palermo | Palermo | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| La Caprichosa Parrilla | Recoleta | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Parrilla "La Coqueta" | Recoleta | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Parrilla Lo de Susy | Chacarita | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Tu Jardín Secreto - Restó Secreto | Colegiales | restaurant | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| La plazoleta parrilla | Colegiales | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Casa Cuba Restaurant & Grill | Belgrano | restaurant | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Parrilla Nuñez | Belgrano | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| La Dorita del Mercado Belgrano | Belgrano | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Tierno Parrilla | Belgrano | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Nuestra Parrilla | San Telmo | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Parrilla La Banda | Almagro | parrilla | 89.3 | score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Atis Bar | San Telmo | bistro | 88.5 | score=88.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; curated_boost | google_places, official_website_from_google, google_photo_signal, curated_allowlist_boost |
| El Taller Arte & Café | Palermo | bistro | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Bar & Restaurant El Correo | Recoleta | bistro | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| RUFINO | Recoleta | bistro | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| L' Orangerie Alvear Palace Hotel | Recoleta | bistro | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| El Chiri de Villa Kreplaj | Villa Crespo | bistro | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| jakub | Colegiales | bistro | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Restaurante Corte Comedor | Belgrano | bistro | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Lo Del Francés Café Bistrot | San Telmo | bistro | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Dada Bistró | Retiro | bistro | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Jardín de Invierno | Recoleta | restaurant | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| El Estrebe | Recoleta | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| República del Fuego | Recoleta | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Maure Parrilla | Chacarita | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Fraga Bodegón | Chacarita | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Parrilla lo del Russo | Villa Crespo | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| La Esquina Del Virrey | Colegiales | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Casa Cuba | Belgrano | restaurant | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| El Tordo | Belgrano | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Hierro Parrilla San Telmo | San Telmo | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Parrilla Lo De Mary - Restaurante | Almagro | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| El Patio de Mingo | Almagro | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| El Mirasol De Boedo | Almagro | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| La Parrillita del Pasaje | Almagro | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Parrilla Cero5 | Retiro | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Huacho | Retiro | restaurant | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| El Mirasol de La Recova | Retiro | parrilla | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Anafe | Colegiales | restaurant | 85.35 | score=85.35; google=1.00; visual=1.00; category=0.82; atmosphere=0.65; curated_boost | google_places, official_website_from_google, google_photo_signal, curated_allowlist_boost |
| La Dorita | Palermo | bistro | 85.25 | score=85.25; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Pentos Colegiales | Colegiales | bistro | 85.25 | score=85.25; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Bar Britanico | San Telmo | bistro | 85.25 | score=85.25; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Ancora Buenos Aires | Retiro | bistro | 85.25 | score=85.25; google=1.00; visual=0.90; category=0.90; atmosphere=0.65 | google_places, google_photo_signal |
| Croque Madame Puerto Madero | Puerto Madero | bistro | 85.25 | score=85.25; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |

## Why These Are Korantis Venues

- Mambo Restoran: bistro in Villa Crespo; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Casa Parra: bistro in Colegiales; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Bistro Tokio: bistro in Belgrano; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- La Justina Bistró: bistro in Almagro; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- ALMA BUENOS AIRES: bistro in Retiro; score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Parrilla Sanabria Palermo: parrilla in Palermo; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- La Caprichosa Parrilla: parrilla in Recoleta; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Parrilla "La Coqueta": parrilla in Recoleta; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Parrilla Lo de Susy: parrilla in Chacarita; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Tu Jardín Secreto - Restó Secreto: restaurant in Colegiales; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- La plazoleta parrilla: parrilla in Colegiales; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Casa Cuba Restaurant & Grill: restaurant in Belgrano; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Parrilla Nuñez: parrilla in Belgrano; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- La Dorita del Mercado Belgrano: parrilla in Belgrano; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Tierno Parrilla: parrilla in Belgrano; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Nuestra Parrilla: parrilla in San Telmo; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Parrilla La Banda: parrilla in Almagro; score=89.3; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Atis Bar: bistro in San Telmo; score=88.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; curated_boost; signals google_places, official_website_from_google, google_photo_signal, curated_allowlist_boost
- El Taller Arte & Café: bistro in Palermo; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Bar & Restaurant El Correo: bistro in Recoleta; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- RUFINO: bistro in Recoleta; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- L' Orangerie Alvear Palace Hotel: bistro in Recoleta; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- El Chiri de Villa Kreplaj: bistro in Villa Crespo; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- jakub: bistro in Colegiales; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Restaurante Corte Comedor: bistro in Belgrano; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Lo Del Francés Café Bistrot: bistro in San Telmo; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Dada Bistró: bistro in Retiro; score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Jardín de Invierno: restaurant in Recoleta; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- El Estrebe: parrilla in Recoleta; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- República del Fuego: parrilla in Recoleta; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Maure Parrilla: parrilla in Chacarita; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Fraga Bodegón: parrilla in Chacarita; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Parrilla lo del Russo: parrilla in Villa Crespo; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- La Esquina Del Virrey: parrilla in Colegiales; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Casa Cuba: restaurant in Belgrano; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- El Tordo: parrilla in Belgrano; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Hierro Parrilla San Telmo: parrilla in San Telmo; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Parrilla Lo De Mary - Restaurante: parrilla in Almagro; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- El Patio de Mingo: parrilla in Almagro; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- El Mirasol De Boedo: parrilla in Almagro; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- La Parrillita del Pasaje: parrilla in Almagro; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Parrilla Cero5: parrilla in Retiro; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Huacho: restaurant in Retiro; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- El Mirasol de La Recova: parrilla in Retiro; score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Anafe: restaurant in Colegiales; score=85.35; google=1.00; visual=1.00; category=0.82; atmosphere=0.65; curated_boost; signals google_places, official_website_from_google, google_photo_signal, curated_allowlist_boost
- La Dorita: bistro in Palermo; score=85.25; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Pentos Colegiales: bistro in Colegiales; score=85.25; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Bar Britanico: bistro in San Telmo; score=85.25; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal
- Ancora Buenos Aires: bistro in Retiro; score=85.25; google=1.00; visual=0.90; category=0.90; atmosphere=0.65; signals google_places, google_photo_signal
- Croque Madame Puerto Madero: bistro in Puerto Madero; score=85.25; google=1.00; visual=1.00; category=0.90; atmosphere=0.80; signals google_places, official_website_from_google, google_photo_signal

## Rejected Candidates Summary

- Moshu Treehouse - Cafetería de especialidad (Palermo): irrelevant_google_category
- Moksha Café Studio (Palermo): irrelevant_google_category
- Dopo Café Palermo Soho (Palermo): irrelevant_google_category
- 1640 Café Restó Palermo (Palermo): irrelevant_google_category
- MERCI! Malabia (Palermo): irrelevant_google_category
- Aromas Brunch & Coffee - Palermo (Palermo): irrelevant_google_category
- Daniel Bakery (Palermo): irrelevant_google_category
- LA GARAGE (Palermo): irrelevant_google_category
- Malcriada BAKERY DE BARRIO (Palermo): irrelevant_google_category
- El Secreto de Oro (Palermo): irrelevant_google_category
- PADRE (Palermo): irrelevant_google_category
- Gontran Cherrier (Palermo): irrelevant_google_category
- La Boque de Palermo (Palermo): irrelevant_google_category
- Le bon George (Palermo): irrelevant_google_category
- Hache Almacén (Palermo): irrelevant_google_category
- Amores Tintos Gorriti (Palermo): irrelevant_google_category
- COWI | Restaurante & Wine Bar Palermo (Palermo): irrelevant_google_category
- Bebiendo Estrellas Palermo (Palermo): irrelevant_google_category
- Confiserié Monet (Recoleta): irrelevant_google_category
- Tónico Café (Recoleta): irrelevant_google_category
- Grillo Café (Recoleta): irrelevant_google_category
- Usina Cafetera Recoleta (Recoleta): irrelevant_google_category
- Inspire Café De Especialidad (Recoleta): irrelevant_google_category
- La Fleur de Sartí café Recoleta (Recoleta): irrelevant_google_category
- ANDRA Bakery (Recoleta): irrelevant_google_category
- DonutMakersBakery Recoleta (Recoleta): irrelevant_google_category
- La Pâtisserie @recoleta (Recoleta): irrelevant_google_category
- Le Pain Quotidien - Recoleta Mall (Recoleta): irrelevant_google_category
- Entre Dos Recoleta (Recoleta): irrelevant_google_category
- Le Bouchon (Recoleta): irrelevant_google_category
- Winemakers Vinoteca Bar de Vinos (Recoleta): irrelevant_google_category
- Vinos Argentinos - El Sitio Recoleta Wine Spot (Recoleta): irrelevant_google_category
- Babieca Parrilla y Café (Recoleta): irrelevant_google_category
- Amelia Café de Especialidad (Chacarita): irrelevant_google_category
- Hobby - Café de Especialidad (Chacarita): irrelevant_google_category
- Pura - Café de Especialidad (Chacarita): irrelevant_google_category
- Silvestre pan & café (Chacarita): irrelevant_google_category
- Jungla Café y plantas (Chacarita): irrelevant_google_category
- SĀNTAL - Chacarita (Chacarita): irrelevant_google_category
- Inedito Coffee House (Chacarita): irrelevant_google_category
- Olbia café de especialidad (Chacarita): irrelevant_google_category
- Nomada Chacarita (N2) (Chacarita): irrelevant_google_category
- Casa Basile (Chacarita): irrelevant_google_category
- Anchoíta Panaderia (Chacarita): irrelevant_google_category
- Atelier Fuerza Chacarita (Chacarita): irrelevant_google_category
- Daniel Bakery (Chacarita): irrelevant_google_category
- Barguevar (Chacarita): irrelevant_google_category
- Gambrinus (Chacarita): irrelevant_google_category
- Jolie Bistró (Chacarita): irrelevant_google_category
- Parrilla SecreTiTo (Chacarita): irrelevant_google_category
- winelosophy.club (Chacarita): irrelevant_google_category
- Rogelio café (Chacarita): irrelevant_google_category
- Inverso - Café de Especialidad (Villa Crespo): irrelevant_google_category
- Café Villa Crespo (Villa Crespo): irrelevant_google_category
- Moksha Café & Vermú (Villa Crespo): irrelevant_google_category
- Malvón (Villa Crespo): irrelevant_google_category
- Café Crespín (Villa Crespo): irrelevant_google_category
- Severina Sabores (Villa Crespo): irrelevant_google_category
- Raíz - Café de especialidad (Villa Crespo): irrelevant_google_category
- Cajú cafe (Villa Crespo): irrelevant_google_category
- Vecindario - Café y Plantas (Villa Crespo): irrelevant_google_category
- Felina (Villa Crespo): irrelevant_google_category
- Casa Buffalo Café de Especialidad (Villa Crespo): irrelevant_google_category
- El Born Pastisseria (Villa Crespo): irrelevant_google_category
- Usina Cafetera Villa Crespo (Villa Crespo): irrelevant_google_category
- Lievito Madre (Villa Crespo): irrelevant_google_category
- Boiro café (Villa Crespo): irrelevant_google_category
- La Crespo (Villa Crespo): irrelevant_google_category
- Garito Loyola (Villa Crespo): irrelevant_google_category
- Velazco Disquería & Bar (Villa Crespo): irrelevant_google_category
- La Cava Jufré (Villa Crespo): irrelevant_google_category
- Sensei | Vinos & Maridajes (Villa Crespo): irrelevant_google_category
- Rincon Vinoteca Wine (Villa Crespo): irrelevant_google_category
- Soler Vino Pizza Villa Crespo | Natural Wine & Italian Pizza (Villa Crespo): irrelevant_google_category
- Rooftop (Villa Crespo): no_photo_signal, low_evidence_quality
- Café Nómada Villa Crespo (Villa Crespo): irrelevant_google_category
- Salma Café (Villa Crespo): irrelevant_google_category
- SĀNTAL - Colegiales (Colegiales): irrelevant_google_category
- Angirũ café (Colegiales): irrelevant_google_category
- La Noire Café Colegiales (Colegiales): irrelevant_google_category

## Already-Known Venues Excluded

- Vive Café Cafe de especialidad , cafés de campeonatos (Palermo): already_exists_name_city, irrelevant_google_category
- Cuervo Café (Palermo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Kaldi (Palermo): already_exists_place_id, already_exists_name_city, irrelevant_google_category
- Salvaje Bakery (Palermo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- El Preferido de Palermo (Palermo): already_exists_place_id, already_exists_name_city
- Ciro Palermo (Palermo): already_exists_place_id, already_exists_name_city, irrelevant_google_category
- Le Rêve Bistró (Palermo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Las Pizarras bistro (Palermo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Don Julio Parrilla (Palermo): already_exists_place_id, already_exists_name_city
- Backroom Bar (Palermo): already_exists_name_city
- Verne Club (Palermo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- The Hole Bar - Alcatraz Speakeasy Hidden Bar (Palermo): already_exists_name_city
- Pipi Lounge (Palermo): already_exists_place_id, already_exists_name_city
- Wine Window Argentina (Palermo Soho) (Palermo): already_exists_place_id, already_exists_name_city
- Alvear Roof Bar (Palermo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Trade Sky Bar (Palermo): already_exists_name_city
- Bestial Fly Bar (Palermo): already_exists_name_city
- Piso 15 Sky Bar by Vuelta Abajo Social Club (Palermo): already_exists_name_city, irrelevant_google_category
- Roster Cafe Recoleta (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Bicho Café de Especialidad Recoleta (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- La Biela (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Tona Café (Recoleta): already_exists_name_city, irrelevant_google_category
- Negresco Bistró (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- ROUX (Recoleta): already_exists_name_city
- Social Paraíso Bistró | Recoleta (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Duhau Restaurante & Vinoteca (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Piano Nobile (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Intervalo Bar (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Verdot Wine Bar (Recoleta): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Gran Bar Danzon (Recoleta): already_exists_place_id, already_exists_name_city
- Floreria Atlántico (Recoleta): already_exists_place_id, already_exists_name_city
- Nido de Tigre (Chacarita): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Anchoita (Chacarita): already_exists_name_city
- Lutero Bar (Chacarita): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- SOFÁ - un bar (Chacarita): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Bar PUNTO MONA (Chacarita): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Veredita (Chacarita): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Naranjo Bar (Chacarita): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Crystal Bar - Alvear Icon Hotel - Puerto Madero (Chacarita): already_exists_name_city
- Cobre Café (Villa Crespo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Osaka Concepción (Colegiales): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Borja Specialty Coffee (Belgrano): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Cuervo Café (Belgrano): already_exists_name_city
- Banu (Belgrano): already_exists_place_id, already_exists_name_city
- L'Antiquario Cafe Bistro (San Telmo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Farmacia Lezama - Bistrot (San Telmo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Cave Canem (San Telmo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- BOCANADA (San Telmo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- GRAPIN (San Telmo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Bruce Wine (San Telmo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Anselmo Lounge & Wine Bar (San Telmo): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- The Coffee Store Plaza Almagro (Almagro): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Cosecha Almagro (Almagro): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Toki Moment - Specialty Coffee (Retiro): already_exists_name_city, irrelevant_google_category
- El Cuartito (Retiro): already_exists_name_city
- Contraluz (Retiro): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- St. Regis Restaurant (Retiro): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- LE CLUB BACAN (Retiro): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Tostado - Puerto Madero (Puerto Madero): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city
- Kraken bar (Puerto Madero): already_exists_name_city
- Tradition & Rebellion (Puerto Madero): already_exists_place_id, already_exists_name_neighborhood, already_exists_name_city

## Sources Used

- supabase:staging_venues
- supabase:venues
- local_batch:batch_003_stage01_test:stage_01
- local_batch:batch_003_stage01_test:batch_result_with_editorial
- local_batch:batch_003_stage01_test:batch_result_quality_gated
- local_batch:batch_004_buenos_aires_50:venue_seed
- local_batch:batch_004_buenos_aires_50:stage_01
- local_batch:batch_004_buenos_aires_50:batch_result_with_editorial
- local_batch:batch_004_buenos_aires_50:batch_result_quality_gated

## Deviations From Target Mix

- none

## Warnings

- none

## Validation

- venue_seed.json contains exactly selected venues: 50
- every selected venue has name, neighborhood, and type
- duplicate normalized name + neighborhood removed
- existing Supabase/local batch venues excluded when detected

## Next Command

```powershell
npx tsx pipeline/run_full_batch.ts batch_005_buenos_aires_restaurants_50
```
