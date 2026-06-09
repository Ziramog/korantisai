# Stage 04 M3 Vision Classification Report

- Batch: enrich_2026_06_08_2105_gallery_expansion
- Generated: 2026-06-09T01:03:46.083Z
- Model: MiniMax-M3
- M3 called: yes
- Images requested: 45
- Images processed: 45
- Images skipped: 0
- M3 ok count: 17
- Invalid JSON count: 0

## Scene Type Distribution

- hero_interior: 17
- product_food: 24
- logo: 1
- gallery_atmosphere: 2
- decorative: 1

## Selected Hero Per Venue

- A DONDE: hero_interior, high, score 170
- Ancora Buenos Aires: hero_interior, high, score 158
- Cobre Café: hero_interior, high, score 123
- Contraluz: hero_interior, high, score 170
- Duhau Restaurante & Vinoteca: hero_interior, high, score 158
- Intervalo Bar: hero_interior, high, score 158
- Le Rêve Bistró: hero_interior, high, score 158

## Hero Selection Policy

- Primary hero preference: clear experiential venue interior or outdoor space where guests actually sit/drink/eat.
- Secondary: spatial atmosphere/gallery image that communicates the venue mood.
- Tertiary: exterior/facade/local identity only when no strong experiential image exists or the facade itself is the concept.
- Rooftops, patios, gardens, terraces, and outdoor dining areas should behave like hero_interior when they are the customer experience.
- Food-only, menus, logos, decorative images, and crowd-only images are rejected as hero.

## Venues Without Hero Candidate

- El Mirasol de La Recova
- Farmacia Lezama - Bistrot
- Fraga Bodegón
- jakub
- La Dorita del Mercado Belgrano
- La Giralda
- Las Pizarras bistro

## Risk Flags

- rights_review_needed: 32
- preferred_resolution: 43
- below_preferred_resolution: 2

## Hero Connection Readiness

- Ready to connect hero_image into VenueComplete: yes
- Nothing is approved for publication.
- Supabase, Cloudinary, deploy, and consumer UI were not touched.
