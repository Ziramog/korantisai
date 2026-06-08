# Stage 04 M3 Vision Classification Report

- Batch: batch_006_nyc_rooftop
- Generated: 2026-06-08T03:04:49.252Z
- Model: MiniMax-M3
- M3 called: yes
- Images requested: 39
- Images processed: 39
- Images skipped: 0
- M3 ok count: 9
- Invalid JSON count: 0

## Scene Type Distribution

- hero_interior: 8
- product_food: 22
- decorative: 2
- menu: 1
- hero_exterior: 5
- gallery_atmosphere: 1

## Selected Hero Per Venue

- Ainslie Bowery: hero_interior, high, score 170
- Anaïs: hero_interior, high, score 123
- Balvanera: hero_interior, high, score 158
- Brick Wine Bar: hero_interior, high, score 158
- Maison Provence Restaurant: hero_interior, high, score 123
- Olympia: hero_interior, high, score 158
- With Others: hero_interior, high, score 123

## Hero Selection Policy

- Primary hero preference: clear experiential venue interior or outdoor space where guests actually sit/drink/eat.
- Secondary: spatial atmosphere/gallery image that communicates the venue mood.
- Tertiary: exterior/facade/local identity only when no strong experiential image exists or the facade itself is the concept.
- Rooftops, patios, gardens, terraces, and outdoor dining areas should behave like hero_interior when they are the customer experience.
- Food-only, menus, logos, decorative images, and crowd-only images are rejected as hero.

## Venues Without Hero Candidate

- Somm Time
- Jadis
- Woodhul Wine Bar
- Black Mountain Wine House

## Risk Flags

- rights_review_needed: 35
- preferred_resolution: 38
- product_only: 12
- below_preferred_resolution: 1

## Hero Connection Readiness

- Ready to connect hero_image into VenueComplete: yes
- Nothing is approved for publication.
- Supabase, Cloudinary, deploy, and consumer UI were not touched.
