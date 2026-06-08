# Stage 04 M3 Vision Classification Report

- Batch: batch_005_buenos_aires_restaurants_50
- Generated: 2026-06-08T01:51:45.251Z
- Model: MiniMax-M3
- M3 called: yes
- Images requested: 186
- Images processed: 186
- Images skipped: 0
- M3 ok count: 60
- Invalid JSON count: 0

## Scene Type Distribution

- logo: 1
- hero_interior: 36
- gallery_atmosphere: 19
- product_food: 106
- hero_exterior: 22
- menu: 1
- crowd: 1

## Selected Hero Per Venue

- Ancora Buenos Aires: hero_interior, high, score 138
- Atis Bar: hero_exterior, high, score 168
- Bar & Restaurant El Correo: hero_exterior, high, score 168
- Bar Britanico: hero_exterior, high, score 180
- Casa Cuba: hero_interior, high, score 138
- Casa Parra: hero_exterior, acceptable, score 158
- Croque Madame Puerto Madero: hero_interior, high, score 138
- Dada Bistró: hero_interior, high, score 138
- El Chiri de Villa Kreplaj: hero_interior, high, score 138
- El Estrebe: hero_interior, high, score 150
- El Mirasol De Boedo: hero_exterior, high, score 168
- El Mirasol de La Recova: hero_interior, high, score 138
- El Taller Arte & Café: hero_interior, high, score 103
- El Tordo: hero_exterior, high, score 168
- Fraga Bodegón: hero_interior, high, score 138
- Hierro Parrilla San Telmo: hero_interior, high, score 138
- jakub: hero_exterior, high, score 168
- Jardín de Invierno: gallery_atmosphere, high, score 118
- L' Orangerie Alvear Palace Hotel: hero_interior, high, score 138
- La Caprichosa Parrilla: hero_exterior, high, score 168
- La Dorita: hero_exterior, high, score 168
- La Dorita del Mercado Belgrano: hero_interior, high, score 138
- La Justina Bistró: hero_exterior, high, score 168
- La plazoleta parrilla: hero_exterior, high, score 168
- Lo Del Francés Café Bistrot: hero_interior, high, score 138
- Mambo Restoran: hero_interior, high, score 138
- Maure Parrilla: hero_exterior, high, score 168
- Parrilla "La Coqueta": hero_exterior, high, score 168
- Parrilla Cero5: hero_interior, high, score 138
- Parrilla La Banda: hero_exterior, acceptable, score 158
- Parrilla Lo De Mary - Restaurante: hero_interior, high, score 108
- Parrilla Nuñez: hero_interior, high, score 103
- Parrilla Sanabria Palermo: hero_exterior, high, score 168
- Pentos Colegiales: hero_exterior, high, score 168
- RUFINO: hero_interior, high, score 138
- Tierno Parrilla: hero_exterior, high, score 168
- Tu Jardín Secreto - Restó Secreto: hero_interior, high, score 138

## Hero Selection Policy

- Primary hero preference: clear venue exterior/facade/local identity.
- Secondary: usable interior photo when no strong exterior exists.
- Tertiary: spatial atmosphere/gallery image.
- Food-only, menus, logos, decorative images, and crowd-only images are rejected as hero.

## Venues Without Hero Candidate

- La Parrillita del Pasaje
- Bistro Tokio
- ALMA BUENOS AIRES
- Parrilla Lo de Susy
- Casa Cuba Restaurant & Grill
- Restaurante Corte Comedor
- República del Fuego
- La Esquina Del Virrey
- El Patio de Mingo
- Huacho
- Anafe

## Risk Flags

- preferred_resolution: 185
- rights_review_needed: 181
- below_preferred_resolution: 1

## Hero Connection Readiness

- Ready to connect hero_image into VenueComplete: yes
- Nothing is approved for publication.
- Supabase, Cloudinary, deploy, and consumer UI were not touched.
