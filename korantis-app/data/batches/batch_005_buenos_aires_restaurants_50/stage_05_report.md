# Stage 05 Editorial + Mood Generation Report

- Batch: batch_005_buenos_aires_restaurants_50
- Generated: 2026-06-08T01:03:55.019Z
- Model: MiniMax-M2.7
- MiniMax M2.7 called: yes
- Venues processed: 50
- Successful editorial generations: 29
- Failed editorial generations: 21
- Invalid JSON count: 2

## Mood Distribution

- warm: 23
- refined: 13
- creative: 6
- intimate: 20
- date_night: 17
- romantic: 14
- quiet: 7
- historic: 9
- work_friendly: 2
- late_night: 10
- outdoor: 2
- hidden_gem: 4
- social: 9
- lively: 1
- cinematic: 1

## Evidence Confidence Distribution

- low: 21
- medium: 0
- high: 29

## Status Counts After Scoring

- input: 50
- ready_for_db_staging: 0
- auto_staged: 12
- needs_review: 10
- blocked: 28
- approved: 0
- rejected: 0
- staged: 0
- published: 0

## Remaining Blockers Per Venue

- Mambo Restoran: none
- Casa Parra: none
- Bistro Tokio: no_hero_image
- La Justina Bistró: none
- ALMA BUENOS AIRES: no_hero_image
- Parrilla Sanabria Palermo: none
- La Caprichosa Parrilla: none
- Parrilla "La Coqueta": none
- Parrilla Lo de Susy: no_hero_image
- Tu Jardín Secreto - Restó Secreto: none
- La plazoleta parrilla: none
- Casa Cuba Restaurant & Grill: no_hero_image
- Parrilla Nuñez: none
- La Dorita del Mercado Belgrano: none
- Tierno Parrilla: none
- Nuestra Parrilla: no_hero_image
- Parrilla La Banda: none
- Atis Bar: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- El Taller Arte & Café: none
- Bar & Restaurant El Correo: none
- RUFINO: none
- L' Orangerie Alvear Palace Hotel: none
- El Chiri de Villa Kreplaj: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- jakub: none
- Restaurante Corte Comedor: no_hero_image
- Lo Del Francés Café Bistrot: none
- Dada Bistró: none
- Jardín de Invierno: none
- El Estrebe: none
- República del Fuego: no_hero_image
- Maure Parrilla: none
- Fraga Bodegón: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Parrilla lo del Russo: no_hero_image, missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- La Esquina Del Virrey: no_hero_image, missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Casa Cuba: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- El Tordo: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Hierro Parrilla San Telmo: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Parrilla Lo De Mary - Restaurante: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- El Patio de Mingo: no_hero_image, missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- El Mirasol De Boedo: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- La Parrillita del Pasaje: no_hero_image, missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Parrilla Cero5: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Huacho: no_hero_image, missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- El Mirasol de La Recova: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Anafe: no_hero_image, missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- La Dorita: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Pentos Colegiales: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Bar Britanico: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Ancora Buenos Aires: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Croque Madame Puerto Madero: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum

## Failures

- Atis Bar: editorial_invalid_json
- El Chiri de Villa Kreplaj: editorial_invalid_json
- Fraga Bodegón: minimax_text_http_529: overloaded_error (529)
- Parrilla lo del Russo: minimax_text_http_529: overloaded_error (529)
- La Esquina Del Virrey: minimax_text_http_529: overloaded_error (529)
- Casa Cuba: minimax_text_http_529: overloaded_error (529)
- El Tordo: minimax_text_http_529: overloaded_error (529)
- Hierro Parrilla San Telmo: minimax_text_http_529: overloaded_error (529)
- Parrilla Lo De Mary - Restaurante: minimax_text_http_529: overloaded_error (529)
- El Patio de Mingo: minimax_text_http_529: overloaded_error (529)
- El Mirasol De Boedo: minimax_text_http_529: overloaded_error (529)
- La Parrillita del Pasaje: minimax_text_http_529: overloaded_error (529)
- Parrilla Cero5: minimax_text_http_529: overloaded_error (529)
- Huacho: minimax_text_http_529: overloaded_error (529)
- El Mirasol de La Recova: minimax_text_http_529: overloaded_error (529)
- Anafe: minimax_text_http_529: overloaded_error (529)
- La Dorita: minimax_text_http_529: overloaded_error (529)
- Pentos Colegiales: minimax_text_http_529: overloaded_error (529)
- Bar Britanico: minimax_text_http_529: overloaded_error (529)
- Ancora Buenos Aires: minimax_text_http_529: overloaded_error (529)
- Croque Madame Puerto Madero: minimax_text_http_529: overloaded_error (529)

## Safety

- No M3 calls were made.
- No Supabase writes were made.
- No Cloudinary uploads were made.
- No publication or deploy path was run.
- Protected consumer UI files were not touched.
