# Stage 04 M3 Vision Classification Report

- Batch: batch_014_dubai_cafes_30_difc_downtown_dubai_jumeirah
- Generated: 2026-06-08T14:56:27.343Z
- Model: MiniMax-M3
- M3 called: yes
- Images requested: 112
- Images processed: 112
- Images skipped: 0
- M3 ok count: 35
- Invalid JSON count: 0

## Scene Type Distribution

- hero_interior: 35
- hero_exterior: 7
- product_food: 62
- gallery_atmosphere: 2
- unusable: 1
- logo: 4
- decorative: 1

## Selected Hero Per Venue

- % ARABICA DIFC LIMESTONE HOUSE: hero_interior, high, score 158
- % ARABICA DUBAI ROASTERY: hero_interior, high, score 158
- Boon Coffee Roasters - Palm Jumeirah Mall: hero_interior, high, score 158
- Boon Coffee Roasters Downtown: hero_interior, high, score 158
- Brews Cafe: hero_interior, high, score 123
- Cafe Wayfarer: hero_interior, high, score 158
- Caffeine Coffee Roaster: hero_interior, high, score 158
- Caju Coffee House: hero_interior, high, score 158
- Circle Cafe (Bay Square): hero_interior, high, score 158
- Coffee Planet - Foundry Downtown: hero_interior, high, score 158
- Have Coffee - DIFC: hero_interior, high, score 170
- Kimi - Speciality Coffee and Food: hero_interior, high, score 158
- Mokha 1450 Coffee Lounge: hero_interior, high, score 158
- MOY SPECIALTY COFFEE: hero_interior, high, score 158
- Ores Cafe: hero_interior, high, score 158
- Orijins: hero_interior, high, score 158
- Risen Café and Artisanal Bakery, Business Bay: hero_interior, high, score 158
- Risen Café and Artisanal Bakery, Palm Jumeirah: hero_interior, high, score 170
- Roasters Specialty Coffee House Al Wasl: hero_interior, high, score 158
- Roasters Specialty Coffee House Dubai Hills: hero_interior, high, score 158
- Roasters Specialty Coffee House Palm Jumeirah Mall: hero_interior, high, score 158
- Summer Soul Boutique - West Beach: hero_interior, high, score 158
- The Coffee Merchant: hero_interior, high, score 158

## Hero Selection Policy

- Primary hero preference: clear experiential venue interior or outdoor space where guests actually sit/drink/eat.
- Secondary: spatial atmosphere/gallery image that communicates the venue mood.
- Tertiary: exterior/facade/local identity only when no strong experiential image exists or the facade itself is the concept.
- Rooftops, patios, gardens, terraces, and outdoor dining areas should behave like hero_interior when they are the customer experience.
- Food-only, menus, logos, decorative images, and crowd-only images are rejected as hero.

## Venues Without Hero Candidate

- Kulture House Dubai
- Fuze Cafe Marina | Specialty Coffee
- Roasters Specialty Coffee House Emaar Beachfront
- Drinkit
- Roast Speciality Coffee, Marina
- The lost Restaurant and Specialty coffee
- Roasters Specialty Coffee House Sobha Hartland

## Risk Flags

- preferred_resolution: 109
- rights_review_needed: 95
- product_only: 65
- below_preferred_resolution: 3

## Hero Connection Readiness

- Ready to connect hero_image into VenueComplete: yes
- Nothing is approved for publication.
- Supabase, Cloudinary, deploy, and consumer UI were not touched.
