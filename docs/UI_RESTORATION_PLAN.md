# Korantis Restoration Roadmap

This roadmap translates the completed architectural and visual audit into a staged restoration sequence. It is documentation only and does not implement changes.

The order is intentional: restore the atomic visual artifacts first, then the atmosphere around them, then the surfaces and motion systems that depend on stable geometry.

## Phase 1: Card Restoration

### Objective

Restore the canonical Korantis venue card system as the atomic identity layer of the product.

### Scope

- Restore protected card variants from the original UI:
  - Card A: Cinematic Full-Bleed
  - Card B: Editorial Split
  - Card C: Compact Atmospheric
  - Card D: Vertical Immersive
  - Card E: Layered Editorial
  - Card F: Minimal Signal
- Restore canonical ratios:
  - Cinematic: `3 / 2`
  - Immersive: `9 / 16`, max height around `640px`
  - Layered: `3 / 4`
  - Compact image: `16 / 9`
- Move card geometry, overlay, gradient, metadata, tag, and bookmark behavior out of scattered utility composition and into governed primitives.
- Restore layered-card asymmetry: frosted panel near bottom-left, transparent warm-black surface, heavy blur, faint border, and caption-like behavior.
- Make bookmark affordances quiet and proximity-revealed instead of standard always-visible product buttons.

### Key Files

- [VenueCard.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueCard.tsx)
- [globals.css](F:/KORANTIS/korantis-app/src/app/globals.css)
- [UI_CANONICAL_SYSTEM.md](F:/KORANTIS/docs/UI_CANONICAL_SYSTEM.md)
- [KORANTIS_DESIGN_LAWS.md](F:/KORANTIS/docs/KORANTIS_DESIGN_LAWS.md)

### Acceptance Criteria

- Each primary card variant matches the canonical ratio and visual role.
- Primary cards read as image-led editorial artifacts, not generic app cards.
- Tags remain whispered metadata, not colorful chips.
- Card hover and press states are restrained, cinematic, and non-bouncy.
- Future card changes can be reviewed against named card laws instead of ad hoc JSX utilities.

### Dependency Notes

This phase must land before image, feed, detail, and motion restoration. Later phases depend on stable card dimensions and composition.

## Phase 2: Image Restoration

### Objective

Restore the film-grade image system that gives Korantis its cinematic atmosphere.

### Scope

- Reintroduce canonical image grading:
  - reduced brightness
  - increased contrast
  - restrained saturation
  - warm-black tonal overlays
- Restore card-level vignettes, especially top and bottom gradients on immersive cards.
- Restore subtle card-level grain and global ambient grain as governed layers.
- Ensure gradients protect text without flattening the image.
- Apply consistent image treatment to cards, venue hero imagery, gallery surfaces, and related venue imagery.

### Key Files

- [globals.css](F:/KORANTIS/korantis-app/src/app/globals.css)
- [VenueCard.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueCard.tsx)
- [VenueDetail.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueDetail.tsx)
- [assets](F:/KORANTIS/assets)
- [public](F:/KORANTIS/korantis-app/public)

### Acceptance Criteria

- Images feel warm-black, cinematic, and mood-first.
- No priority card relies only on opacity or a simple Tailwind gradient for atmosphere.
- Text over image remains legible without making the image feel like a dark placeholder.
- Grain, overlay, and vignette treatments are reusable and consistently named.
- Image clarity is subordinate to mood, in line with the canonical principle: "Atmosphere > clarity. Mood > detail."

### Dependency Notes

This phase depends on Phase 1 card geometry. Detail restoration should wait until image treatment is stable so the venue hero can carry the right emotional weight.

## Phase 3: Feed Restoration

### Objective

Restore the discovery feed as a curated mobile-editorial sequence rather than a wide app layout.

### Scope

- Re-establish canonical discovery width around `428px` for the core feed.
- Restore rhythm classes and spacing behavior:
  - tight
  - breathe
  - isolated
- Preserve the current ranking, Supabase, saved-state, circadian, and taste systems while changing only the visual pacing surface.
- Reduce visual dominance of segmented controls, city controls, language controls, and utility filters.
- Reconcile map entry behavior with the original quiet floating secondary action.
- Keep admin/debug concepts isolated from the consumer discovery surface.

### Key Files

- [page.tsx](F:/KORANTIS/korantis-app/src/app/page.tsx)
- [VenueCard.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueCard.tsx)
- [GlobalNav.tsx](F:/KORANTIS/korantis-app/src/app/components/GlobalNav.tsx)
- [HeaderControls.tsx](F:/KORANTIS/korantis-app/src/app/components/HeaderControls.tsx)
- [MapExplorer.tsx](F:/KORANTIS/korantis-app/src/app/components/MapExplorer.tsx)

### Acceptance Criteria

- Discovery reads as a vertical curated sequence, not a grid or dashboard.
- Feed width remains intimate on desktop instead of expanding into a broad web-app surface.
- Tight, breathe, and isolated entries produce visible editorial pacing.
- Utility controls are available but visually subordinate.
- Product improvements remain intact while the original visual identity is restored.

### Dependency Notes

This phase depends on Phase 1 and Phase 2. Feed rhythm only works when card geometry and image atmosphere are restored first.

## Phase 4: Detail Restoration

### Objective

Restore venue detail pages as immersive scroll-cinematic narratives.

### Scope

- Restore `100vh` venue hero arrival with full-height immersive imagery.
- Reintroduce oversized image bounds and subtle parallax support.
- Restore large vertical silence in narrative sections using canonical spacing around `120px`, `160px`, `180px`, and immersive `70vh` blocks.
- Replace compact time-shift utility cards with immersive morning, afternoon, evening, and late-night scroll sections.
- Restore tactile horizontal gallery behavior with oversized images and peeking items.
- Reintroduce the "similar atmospheres" section after the primary venue story.
- Keep utility information late in the page hierarchy.

### Key Files

- [VenueDetail.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueDetail.tsx)
- [VenueCard.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueCard.tsx)
- [venues.ts](F:/KORANTIS/korantis-app/src/app/data/venues.ts)
- [globals.css](F:/KORANTIS/korantis-app/src/app/globals.css)

### Acceptance Criteria

- Detail entry feels cinematic and immersive, not like a compact information panel.
- Hero imagery occupies the first viewport with proper atmosphere and legibility.
- Narrative, time-shift, gallery, utility, and related sections appear in story-first order.
- Time-shift content creates atmospheric scroll blocks instead of dashboard cards.
- Gallery interaction feels tactile and horizontal, with clear visual peeking.

### Dependency Notes

This phase depends on Phase 2 image restoration. Motion work should follow once the detail structure is stable.

## Phase 5: Motion Restoration

### Objective

Restore the choreographic motion language that made the original UI feel cinematic rather than merely animated.

### Scope

- Restore fade-through-black shell transitions.
- Restore card-to-venue FLIP clone choreography:
  - clicked image clones
  - clone expands toward viewport
  - venue detail reveals beneath
- Restore slow reveal behavior:
  - opacity from `0`
  - upward drift around `28px`
  - duration around `1.4s`
  - canonical easing `cubic-bezier(0.22, 0.61, 0.36, 1)`
- Restore tag stagger reveal.
- Restore scroll velocity awareness:
  - high-velocity card dimming
  - temporary interaction pause
  - atmospheric scroll response
- Restore soft parallax where it supports cards, hero imagery, and detail sections.

### Key Files

- [page.tsx](F:/KORANTIS/korantis-app/src/app/page.tsx)
- [VenueCard.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueCard.tsx)
- [VenueDetail.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueDetail.tsx)
- [globals.css](F:/KORANTIS/korantis-app/src/app/globals.css)

### Acceptance Criteria

- Page transitions feel cinematic and slow without blocking usability.
- Card-to-detail transition visibly preserves image continuity.
- Motion uses canonical duration and easing families.
- Reveals and tag staggers are atmospheric, not decorative or bouncy.
- Motion remains accessible and respects reduced-motion preferences.

### Dependency Notes

This phase depends on restored card geometry, restored image treatment, feed rhythm, and stable detail structure.

## Phase 6: Search Restoration

### Objective

Restore search as a cinematic discovery control surface rather than a static page section.

### Scope

- Rebuild search around the original hybrid sticky/fixed atmospheric header behavior.
- Restore scroll compression, blur, and visual quieting of the search surface.
- Preserve current product search behavior, intent capture, city/language state, and ranking integration.
- Rebalance search input, prompt language, filters, and map toggle so the feed remains image-first.
- Ensure search transitions cleanly into feed, map, and venue detail states.
- Keep search controls editorial, small, warm, and subordinate to atmosphere.

### Key Files

- [SearchBar.tsx](F:/KORANTIS/korantis-app/src/app/components/SearchBar.tsx)
- [HeaderControls.tsx](F:/KORANTIS/korantis-app/src/app/components/HeaderControls.tsx)
- [page.tsx](F:/KORANTIS/korantis-app/src/app/page.tsx)
- [GlobalNav.tsx](F:/KORANTIS/korantis-app/src/app/components/GlobalNav.tsx)
- [MapExplorer.tsx](F:/KORANTIS/korantis-app/src/app/components/MapExplorer.tsx)

### Acceptance Criteria

- Search behaves like an atmospheric instrument panel, not a normal form block.
- Header compression responds to scroll without disrupting feed rhythm.
- Search remains functional with current ranking and intent systems.
- Controls are visually quiet and do not dominate the discovery surface.
- Mobile and desktop search behavior preserve the canonical editorial intimacy.

### Dependency Notes

This phase comes last because search depends on the final feed rhythm, restored motion rules, and stable control hierarchy.

## Execution Order

1. Phase 1: Card Restoration
2. Phase 2: Image Restoration
3. Phase 3: Feed Restoration
4. Phase 4: Detail Restoration
5. Phase 5: Motion Restoration
6. Phase 6: Search Restoration

## Cross-Phase Governance

- Use [KORANTIS_DESIGN_LAWS.md](F:/KORANTIS/docs/KORANTIS_DESIGN_LAWS.md) as the review gate for every restoration PR.
- Use [UI_CANONICAL_SYSTEM.md](F:/KORANTIS/docs/UI_CANONICAL_SYSTEM.md) as the source of visual truth.
- Use [UI_DRIFT_REPORT.md](F:/KORANTIS/docs/UI_DRIFT_REPORT.md) to confirm each phase addresses the audited drift.
- Do not introduce new consumer-facing visual features until Phase 1 and Phase 2 are accepted.
- Keep admin, debug, and implementation surfaces visually separate from consumer discovery.

## Final Recommendation

Begin with Phase 1 and Phase 2 as a single identity-restoration milestone. Do not start feed, detail, motion, or search refinements until cards and images have regained the canonical Korantis atmosphere.
