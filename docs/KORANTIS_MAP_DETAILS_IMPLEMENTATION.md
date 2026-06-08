# Korantis Map Details Implementation

## Goal
Explain that Mapbox is not a generic map feature. It is a Spatial Atlas: a warm-black, cinematic geographic layer that extends emotional discovery.

## Core Architecture
Define:

Explore:
- landing/search
- resonance feed
- venue cards
- emotional discovery

Atlas:
- Spatial Atlas
- Your Atlas
- saved places
- dynamic collections
- spatial memory
- Mapbox view

Taste:
- taste coordinates
- radar profile
- atmospheric insights
- preferences/language

Venue Detail:
- hero
- emotional narrative
- tags
- time/mood sections
- Spatial Placement map block
- practical details
- similar atmospheres

## Navigation Decision
Bottom nav must be:

Explore | Atlas | Taste

Explain:
- Atlas replaces Map and absorbs Saved.
- Taste replaces Profile.
- Explore remains the primary emotional discovery surface.
- Atlas must remain visually quiet and subordinate to the overall Korantis atmosphere.

## Atlas Surface
Define Atlas as a dual-layer surface:

Spatial Atlas:
- Mapbox map
- all relevant venues
- city-level spatial discovery
- selected venue preview
- atmospheric markers

Your Atlas:
- saved venues
- dynamic collections
- circadian collections
- personal spatial memory

Do not make Atlas look like Google Maps, delivery apps, real estate apps, or a generic directory.

## Venue Detail Spatial Placement
Define a new venue detail section:

Component name:
VenueDetailMapBlock.tsx

Suggested section title:
Spatial Placement

Possible copy:
“Where this atmosphere lives”
or
“A warm point inside the city’s slower grid.”

Placement rule:
The map block must appear after emotional/narrative content and before practical details.

It must not appear before the venue’s emotional arrival.
It must not replace the hero.
It must not dominate the detail page.

## Card-Level Spatial Affordance
Define a tiny spatial metadata affordance on each venue card.

Example:
⌖ Palermo Hollywood

Rules:
- It is not a button row.
- It is not a colorful chip.
- It must feel like metadata.
- It should be quiet, small, warm, and editorial.
- It may open Atlas focused on that venue or deep-link to the venue’s Spatial Placement block.
- It must not compete with bookmark/save behavior.
- It must not add visual clutter to venue cards.

## Mapbox Visual Rules
Mapbox must be styled as Korantis:

- warm-black base
- muted gray streets
- champagne-gold active markers
- cream labels where needed
- no default bright blue/green map styling
- no loud default controls
- no large utilitarian control panels
- no generic pin colors
- markers should feel like atmospheric signals, not Google pins

Possible components:
- SpatialAtlas.tsx
- VenueDetailMapBlock.tsx
- AtlasVenuePreview.tsx
- KorantisMarker.tsx
- mapStyle.ts

## Implementation Phases

Phase 1 — Document + Freeze
- Update and freeze this architecture document only.
- No app code changes.

Phase 2 — Navigation Architecture
- Update GlobalNav.tsx to Explore | Atlas | Taste.
- Update page.tsx activeTab mapping.
- Saved/Profile states must be remapped into Atlas/Taste.
- No real Mapbox implementation yet.

Phase 3 — Atlas Shell
- Create Atlas shell layout.
- Include Spatial Atlas and Your Atlas sections.
- Use placeholder map/card structures if needed.
- Preserve visual identity.

Phase 4 — Venue Detail Spatial Placement
- Add VenueDetailMapBlock.tsx.
- Insert it in VenueDetail.tsx after emotional content and before practical details.
- Use placeholder map if Mapbox is not ready.

Phase 5 — Card Spatial Affordance
- Add the tiny spatial metadata signal to VenueCard.tsx.
- Keep it quiet and non-invasive.

Phase 6 — Mapbox Rendering + Polish
- Add real Mapbox rendering.
- Add custom warm-black style.
- Add KorantisMarker.
- Add selected venue preview.
- Ensure map mode does not visually contaminate Explore, Taste, or venue cards.

## Non-Goals
Explicitly state:

- Do not create a generic Map tab.
- Do not add a fourth bottom nav item.
- Do not make Atlas louder than Explore.
- Do not expose default bright Mapbox controls.
- Do not add visible Map buttons to every card.
- Do not turn card metadata into chips.
- Do not redesign venue cards.
- Do not change ranking, Supabase, auth, APIs, admin, or ingestion.
- Do not move practical location data above emotional venue content.
- Do not make Korantis feel like a restaurant finder, Google Maps clone, delivery app, or SaaS dashboard.

## Verification Plan
Include:

Automated:
- Run npm run test:visual after each implementation phase.
- Expected diffs must be limited to the phase being worked on.

Manual:
- Bottom nav reads exactly Explore | Atlas | Taste.
- Explore still feels like emotional discovery.
- Atlas feels like spatial memory, not generic map.
- Venue detail includes Spatial Placement in the correct hierarchy.
- Cards remain image-led and uncluttered.
- Taste contains profile concepts without feeling like a generic account page.
