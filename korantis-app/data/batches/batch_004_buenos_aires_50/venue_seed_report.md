# Stage 00 Venue Seed Selection Report

- Batch: batch_004_buenos_aires_50
- Generated: 2026-06-07T19:14:09.150Z
- City: Buenos Aires
- Discovery mode: automated_google_places
- Total candidates discovered: 1321
- Candidates after dedupe: 636
- Candidates after hard filters: 407
- Final selected count: 50
- Rejected count: 229
- Existing sources checked: supabase:staging_venues, supabase:venues, local_batch:batch_003_stage01_test

## Scoring Formula

`candidate_score = google_presence_score * 0.20 + review_volume_score * 0.15 + visual_strength_score * 0.20 + category_fit_score * 0.15 + neighborhood_balance_score * 0.10 + atmosphere_potential_score * 0.15 + source_diversity_score * 0.05`

## Counts By Type

- cafe: 11
- bakery_cafe: 1
- bistro: 10
- bar: 10
- cocktail_bar: 6
- rooftop_bar: 2
- wine_bar: 5
- cafe_bar: 5

## Counts By Neighborhood

- Recoleta: 8
- Chacarita: 8
- Villa Crespo: 3
- Belgrano: 1
- Almagro: 3
- Palermo: 8
- Puerto Madero: 2
- San Telmo: 8
- Retiro: 4
- Centro: 3
- Colegiales: 1
- Nuñez: 1

## Selected Venues

| Name | Neighborhood | Type | Score | Selection Reason | Source Signals |
| --- | --- | --- | ---: | --- | --- |
| Roster Cafe Recoleta | Recoleta | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Cafeto 2020 | Chacarita | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Cobre Café | Villa Crespo | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Borja Specialty Coffee | Belgrano | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Cosecha Almagro | Almagro | cafe | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Cuervo Café | Palermo | cafe | 88.5 | score=88.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; curated_boost | google_places, official_website_from_google, google_photo_signal, curated_allowlist_boost |
| Café Registrado | Palermo | cafe | 88.5 | score=88.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.95; curated_boost | google_places, official_website_from_google, google_photo_signal, curated_allowlist_boost |
| The Coffee Store Plaza Almagro | Almagro | cafe | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Tostado - Puerto Madero | Puerto Madero | cafe | 87.8 | score=87.8; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Salvaje Bakery | Palermo | bakery_cafe | 86.6 | score=86.6; google=1.00; visual=1.00; category=0.82; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Barine - café de especialidad | Palermo | cafe | 85.25 | score=85.25; google=1.00; visual=0.90; category=0.90; atmosphere=0.65 | google_places, google_photo_signal |
| Bicho Café de Especialidad Recoleta | Recoleta | cafe | 85.25 | score=85.25; google=1.00; visual=0.90; category=0.90; atmosphere=0.65 | google_places, google_photo_signal |
| Le Rêve Bistró | Palermo | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Las Pizarras bistro | Palermo | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Negresco Bistró | Recoleta | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Piano Nobile | Recoleta | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| L'Antiquario Cafe Bistro | San Telmo | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Farmacia Lezama - Bistrot | San Telmo | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| A DONDE | Villa Crespo | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Contraluz | Retiro | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| St. Regis Restaurant | Retiro | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Banu | Centro | bistro | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Selva Mía | Palermo | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Intervalo Bar | Recoleta | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| BOCANADA | San Telmo | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Cave Canem | San Telmo | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Lutero Bar | Chacarita | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Nido de Tigre | Chacarita | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| SOFÁ - un bar | Chacarita | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Bar PUNTO MONA | Chacarita | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Veredita | Chacarita | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Don Gato | Chacarita | bar | 90.5 | score=90.5; google=1.00; visual=1.00; category=0.90; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Social Paraíso Bistró \| Recoleta | Recoleta | cocktail_bar | 92 | score=92; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| GRAPIN | San Telmo | cocktail_bar | 92 | score=92; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Pipi Lounge | Villa Crespo | cocktail_bar | 92 | score=92; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| LE CLUB BACAN | Retiro | cocktail_bar | 92 | score=92; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Osaka Concepción | Colegiales | cocktail_bar | 92 | score=92; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Tradition & Rebellion | Puerto Madero | cocktail_bar | 92 | score=92; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Alvear Roof Bar | Palermo | rooftop_bar | 90.8 | score=90.8; google=1.00; visual=1.00; category=0.82; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| La Carbonera | San Telmo | rooftop_bar | 90.8 | score=90.8; google=1.00; visual=1.00; category=0.82; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Naranjo Bar | Chacarita | wine_bar | 96 | score=96; google=1.00; visual=1.00; category=1.00; atmosphere=1.00; curated_boost | google_places, official_website_from_google, google_photo_signal, curated_allowlist_boost |
| Duhau Restaurante & Vinoteca | Recoleta | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Verdot Wine Bar | Recoleta | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Bruce Wine | San Telmo | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Anselmo Lounge & Wine Bar | San Telmo | wine_bar | 93.5 | score=93.5; google=1.00; visual=1.00; category=1.00; atmosphere=0.90 | google_places, official_website_from_google, google_photo_signal |
| Los Jardines De Las Barquin | Retiro | cafe_bar | 92 | score=92; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| BAUTISTA Av. Rivadavia | Almagro | cafe_bar | 92 | score=92; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Tostado - Nuñez | Nuñez | cafe_bar | 89.3 | score=89.3; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| La Giralda | Centro | cafe_bar | 86.75 | score=86.75; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |
| Petit Colón | Centro | cafe_bar | 86.75 | score=86.75; google=1.00; visual=1.00; category=1.00; atmosphere=0.80 | google_places, official_website_from_google, google_photo_signal |

## Rejected Candidates Summary

- Moksha Café Studio (Palermo): irrelevant_google_category
- Vive Café Cafe de especialidad , cafés de campeonatos (Palermo): irrelevant_google_category
- Moshu Treehouse - Cafetería de especialidad (Palermo): irrelevant_google_category
- Kaldi (Palermo): already_exists_place_id, irrelevant_google_category
- Dopo Café Palermo Soho (Palermo): irrelevant_google_category
- Aromas Brunch & Coffee - Palermo (Palermo): irrelevant_google_category
- Surry Hills | Brunch Palermo (Palermo): irrelevant_google_category
- Daniel Bakery (Palermo): irrelevant_google_category
- Daniel Bakery (Palermo): irrelevant_google_category
- Malcriada BAKERY DE BARRIO (Palermo): irrelevant_google_category
- MERCI! Malabia (Palermo): irrelevant_google_category
- Forno 1977 Bakery | Palermo (Palermo): irrelevant_google_category
- Nucha Bakery Gorriti (Palermo): irrelevant_google_category
- PADRE (Palermo): irrelevant_google_category
- El Preferido de Palermo (Palermo): already_exists_place_id
- Ciro Palermo (Palermo): already_exists_place_id, irrelevant_google_category
- Don Julio Parrilla (Palermo): already_exists_place_id
- 1640 Café Restó Palermo (Palermo): irrelevant_google_category
- Le bon George (Palermo): irrelevant_google_category
- Verne Club (Palermo): already_exists_place_id, already_exists_name_neighborhood
- Wine Window Argentina (Palermo Soho) (Palermo): already_exists_place_id
- Amores Tintos Gorriti (Palermo): irrelevant_google_category
- Hache Almacén (Palermo): irrelevant_google_category
- Bebiendo Estrellas Palermo (Palermo): irrelevant_google_category
- Salón 1923 (Palermo): irrelevant_google_category
- TERRASOHO - Specialty Coffee (Palermo): irrelevant_google_category
- El Nido Bar (Palermo): irrelevant_google_category
- La Biela (Recoleta): already_exists_place_id, already_exists_name_neighborhood
- Usina Cafetera Recoleta (Recoleta): irrelevant_google_category
- fea | café de especialidad (Recoleta): irrelevant_google_category
- La Fleur de Sartí café Recoleta (Recoleta): irrelevant_google_category
- Café Gutierrez (Recoleta): irrelevant_google_category
- Juan Valdez Café - Recoleta (Recoleta): irrelevant_google_category
- Confiserié Monet (Recoleta): irrelevant_google_category
- Tónico Café (Recoleta): irrelevant_google_category
- DonutMakersBakery Recoleta (Recoleta): irrelevant_google_category
- La Pâtisserie @recoleta (Recoleta): irrelevant_google_category
- Entre Dos Recoleta (Recoleta): irrelevant_google_category
- El Porta Café de Especialidad (Recoleta): irrelevant_google_category
- Le Pain Quotidien (Recoleta): irrelevant_google_category
- Le Moulin de la Fleur (Recoleta): irrelevant_google_category
- La Parolaccia Recoleta (Recoleta): irrelevant_google_category
- La Rambla (Recoleta): irrelevant_google_category
- Le Bouchon (Recoleta): irrelevant_google_category
- Winemakers Vinoteca Bar de Vinos (Recoleta): irrelevant_google_category
- Vinos Argentinos - El Sitio Recoleta Wine Spot (Recoleta): irrelevant_google_category
- Piso 15 Sky Bar by Vuelta Abajo Social Club (Recoleta): irrelevant_google_category
- Floreria Atlántico (Recoleta): already_exists_place_id
- Puro Café (Recoleta): irrelevant_google_category
- BILBO CAFE RECOLETA (Recoleta): irrelevant_google_category
- Modular Café (San Telmo): irrelevant_google_category
- ifigenia Café (San Telmo): irrelevant_google_category
- Casa Telma (San Telmo): irrelevant_google_category
- Alice's Tea House (San Telmo): irrelevant_google_category
- Vilo Café (San Telmo): irrelevant_google_category
- Café Rivas (San Telmo): irrelevant_google_category
- La Poesía (San Telmo): irrelevant_google_category
- Origen Café (San Telmo): irrelevant_google_category
- MERCI San Telmo (San Telmo): irrelevant_google_category
- MERCI Mercado de San Telmo (San Telmo): irrelevant_google_category
- Atelier Fuerza San Telmo (San Telmo): irrelevant_google_category
- Postres Balcarce San Telmo - Café Pasaje 312 (San Telmo): irrelevant_google_category
- OBRADOR de Panes & Galletas (San Telmo): irrelevant_google_category
- Lulu patisserie (San Telmo): irrelevant_google_category, low_evidence_quality
- Nonna San Telmo (San Telmo): irrelevant_google_category
- El Banco Rojo (San Telmo): irrelevant_google_category
- San Telmo Market Wine Window Argentina (San Telmo): irrelevant_google_category
- 1853 The Wine Experience (San Telmo): irrelevant_google_category
- Lilith Vino (San Telmo): irrelevant_google_category
- Pura - Café de Especialidad (Chacarita): irrelevant_google_category
- Hobby - Café de Especialidad (Chacarita): irrelevant_google_category
- Amelia Café de Especialidad (Chacarita): irrelevant_google_category
- Silvestre pan & café (Chacarita): irrelevant_google_category
- Jungla Café y plantas (Chacarita): irrelevant_google_category
- SĀNTAL - Chacarita (Chacarita): irrelevant_google_category
- Inedito Coffee House (Chacarita): irrelevant_google_category
- Cuervo Café (Chacarita): irrelevant_google_category
- La Noire Café Colegiales (Chacarita): irrelevant_google_category
- Casa Basile (Chacarita): irrelevant_google_category
- Anchoíta Panaderia (Chacarita): irrelevant_google_category

## Deviations From Target Mix

- none

## Warnings

- none

## Validation

- venue_seed.json contains exactly requested venues: yes
- every selected venue has name, neighborhood, and type
- duplicate normalized name + neighborhood removed
- existing Supabase/local batch venues excluded when detected

## Next Command

```powershell
npx tsx pipeline/run_full_batch.ts batch_004_buenos_aires_50
```
