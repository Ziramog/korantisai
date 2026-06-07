# Stage 05 Editorial + Mood Generation Report

- Batch: batch_004_buenos_aires_50
- Generated: 2026-06-07T20:44:10.103Z
- Model: MiniMax-M2.7
- MiniMax M2.7 called: yes
- Venues processed: 50
- Successful editorial generations: 49
- Failed editorial generations: 1
- Invalid JSON count: 1

## Mood Distribution

- warm: 38
- intimate: 32
- creative: 12
- quiet: 22
- work_friendly: 15
- date_night: 15
- late_night: 20
- hidden_gem: 11
- social: 15
- outdoor: 7
- refined: 22
- romantic: 24
- historic: 7
- cinematic: 1
- lively: 1

## Evidence Confidence Distribution

- low: 1
- medium: 0
- high: 49

## Status Counts After Scoring

- input: 50
- ready_for_db_staging: 0
- auto_staged: 21
- needs_review: 22
- blocked: 7
- approved: 0
- rejected: 0
- staged: 0
- published: 0

## Remaining Blockers Per Venue

- Roster Cafe Recoleta: none
- Cafeto 2020: no_hero_image
- Cobre Café: none
- Borja Specialty Coffee: none
- Cosecha Almagro: none
- Cuervo Café: none
- Café Registrado: none
- The Coffee Store Plaza Almagro: none
- Tostado - Puerto Madero: none
- Salvaje Bakery: none
- Barine - café de especialidad: none
- Bicho Café de Especialidad Recoleta: no_hero_image
- Le Rêve Bistró: none
- Las Pizarras bistro: none
- Negresco Bistró: none
- Piano Nobile: none
- L'Antiquario Cafe Bistro: none
- Farmacia Lezama - Bistrot: none
- A DONDE: none
- Contraluz: none
- St. Regis Restaurant: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- Banu: none
- Selva Mía: none
- Intervalo Bar: none
- BOCANADA: none
- Cave Canem: none
- Lutero Bar: none
- Nido de Tigre: none
- SOFÁ - un bar: none
- Bar PUNTO MONA: no_hero_image
- Veredita: no_hero_image
- Don Gato: no_hero_image
- Social Paraíso Bistró | Recoleta: none
- GRAPIN: no_hero_image
- Pipi Lounge: none
- LE CLUB BACAN: none
- Osaka Concepción: none
- Tradition & Rebellion: none
- Alvear Roof Bar: none
- La Carbonera: none
- Naranjo Bar: none
- Duhau Restaurante & Vinoteca: none
- Verdot Wine Bar: none
- Bruce Wine: none
- Anselmo Lounge & Wine Bar: none
- Los Jardines De Las Barquin: none
- BAUTISTA Av. Rivadavia: none
- Tostado - Nuñez: none
- La Giralda: none
- Petit Colón: none

## Failures

- St. Regis Restaurant: editorial_invalid_json

## Safety

- No M3 calls were made.
- No Supabase writes were made.
- No Cloudinary uploads were made.
- No publication or deploy path was run.
- Protected consumer UI files were not touched.
