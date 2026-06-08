# Stage 04 M3 Vision Classification Report

- Batch: batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side
- Generated: 2026-06-08T13:34:42.250Z
- Model: MiniMax-M3
- M3 called: yes
- Images requested: 89
- Images processed: 88
- Images skipped: 1
- M3 ok count: 21
- Invalid JSON count: 1

## Scene Type Distribution

- product_food: 52
- hero_exterior: 13
- hero_interior: 20
- crowd: 1
- decorative: 1
- menu: 1

## Selected Hero Per Venue

- A&C Super: hero_interior, high, score 158
- Aux Merveilleux de Fred: hero_interior, high, score 158
- Bakeri: hero_interior, high, score 158
- Café Colmado: hero_interior, high, score 123
- Dawn’s Til Dusk: hero_interior, high, score 158
- Intelligentsia Coffee High Line Hotel Coffeebar: hero_interior, high, score 158
- Kaida Coffee and Bakery: hero_interior, high, score 158
- maman: hero_interior, high, score 158
- Nick + Sons Bakery: hero_interior, high, score 158
- Paris Baguette: hero_interior, high, score 123
- Pura Vida - NoMad: hero_interior, high, score 123
- RHYTHM ZERO | WEST VILLAGE: hero_interior, high, score 158
- Stumptown Coffee Roasters: hero_interior, high, score 158

## Hero Selection Policy

- Primary hero preference: clear experiential venue interior or outdoor space where guests actually sit/drink/eat.
- Secondary: spatial atmosphere/gallery image that communicates the venue mood.
- Tertiary: exterior/facade/local identity only when no strong experiential image exists or the facade itself is the concept.
- Rooftops, patios, gardens, terraces, and outdoor dining areas should behave like hero_interior when they are the customer experience.
- Food-only, menus, logos, decorative images, and crowd-only images are rejected as hero.

## Venues Without Hero Candidate

- Rex
- Paper Sons Cafe
- Black Star Bakery & Cafe
- Tous Les Jours
- Almondine Bakery
- Burrow
- Bourke Street Bakery
- La Bergamote (Chelsea)
- Claude Bakery West Village
- Yanni's Coffee

## Risk Flags

- preferred_resolution: 89
- rights_review_needed: 81
- product_only: 15

## Hero Connection Readiness

- Ready to connect hero_image into VenueComplete: yes
- Nothing is approved for publication.
- Supabase, Cloudinary, deploy, and consumer UI were not touched.
