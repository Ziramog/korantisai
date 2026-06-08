# Korantis Map Details Implementation

## Status

**Document type:** Product / UI architecture implementation note  
**Scope:** Mapbox integration, Spatial Atlas behavior, map placement, venue detail map block, card-level spatial affordance, and Atlas navigation structure.  
**Current decision:** Map is not a generic app mode. Map is a progressive spatial layer inside Korantis.

This document should be used before creating or updating `UI_CURRENT_DIRECTION.md`.

---

## 1. Core Decision

Korantis should not treat the map as a conventional “Map” product surface.

The map should exist as **Spatial Atlas**: a warm-black, cinematic, low-density geographic layer that extends the emotional discovery system into urban space.

The product architecture should be:

```text
Explore
= emotional discovery

Atlas
= spatial memory + map + saved places

Taste
= personal calibration / taste coordinates
```

Recommended bottom navigation:

```text
Explore    Atlas    Taste
```

Do not use:

```text
Explore    Map    Saved    Profile
```

Reason:

- `Map` is too utilitarian.
- `Saved` is a function, not a world.
- `Profile` is generic.
- `Atlas` and `Taste` are more ownable and more aligned with Korantis.

---

## 2. Map Hierarchy

The map should appear in three levels, each with different visual weight.

### Level 1 — Venue Detail Map Block

**Priority:** Primary integration.

Each venue detail page should include a Mapbox block after the user has already experienced the venue emotionally.

Recommended section name:

```text
Spatial Placement
```

Alternative names:

```text
Where it sits
Neighborhood Signal
Urban Position
In the city
```

Recommended placement inside venue detail:

```text
1. Hero image / venue name
2. Mood phrase / atmosphere narrative
3. Atmosphere tags / emotional metadata
4. Time-based experience sections
5. Spatial Placement map block
6. Practical details
7. Similar atmospheres / nearby atmospheres
```

Purpose:

- Show where the venue lives in the city.
- Connect the atmosphere to its neighborhood.
- Provide location context without turning the page into a utility listing.
- Create a bridge from emotional discovery to practical action.

The map should feel like **spatial context**, not like a Google Maps restaurant widget.

---

### Level 2 — Atlas Tab

**Priority:** Secondary integration.

The bottom nav should include `Atlas`.

The Atlas surface should combine:

```text
Atlas
├── Spatial Atlas
│   ├── Mapbox map
│   ├── all relevant venues
│   ├── current city context
│   ├── atmospheric markers
│   └── selected venue preview
│
└── Your Atlas
    ├── saved places
    ├── dynamic collections
    ├── circadian collections
    └── remembered atmospheres
```

The user-facing idea:

```text
Atlas is where the city becomes memory.
```

Atlas is not only “saved places.” It is:

- spatial memory
- saved venues
- emotional geography
- neighborhood resonance
- personal city layer

Recommended internal toggle:

```text
Spatial Atlas    Your Atlas
```

or, if visually too heavy:

```text
Spatial    Saved
```

The preferred naming is:

```text
Spatial Atlas    Your Atlas
```

because it feels more specific to Korantis.

---

### Level 3 — Card-Level Spatial Signal

**Priority:** Tertiary integration.

Venue cards may include a tiny spatial affordance, but it must behave like metadata, not a button cluster.

Recommended card metadata format:

```text
⌖ Palermo Hollywood
```

or with an icon:

```text
[small compass/location icon] Palermo Hollywood
```

Behavior options:

1. Tap venue card main surface -> open venue detail.
2. Tap bookmark -> save venue.
3. Tap tiny spatial marker/location -> open Atlas centered on that venue **or** open venue detail and scroll to `Spatial Placement`.

Preferred behavior:

```text
Tap tiny spatial marker -> open Atlas centered on selected venue
```

Fallback behavior:

```text
Tap tiny spatial marker -> open venue detail at Spatial Placement section
```

Important:

- Do not add visible “Map” buttons to every card.
- Do not create `Save | Map | Share | Details` action rows.
- Do not make map icons visually compete with venue name, image, tags, or bookmark.
- The spatial signal should whisper.

---

## 3. Navigation Architecture

Recommended app structure:

```text
APP STRUCTURE

Explore
├── Landing / search
├── Resonance feed
├── Venue cards
│   ├── tap card -> venue detail
│   ├── tap bookmark -> save
│   └── tap tiny spatial marker/location -> Atlas focused on venue
└── Quiet search compression

Venue Detail
├── Hero
├── Atmosphere narrative
├── Time / mood sections
├── Spatial Placement map block
├── Practical details
└── Similar atmospheres

Atlas
├── Spatial Atlas map
│   ├── all ranked venues
│   ├── current city
│   ├── selected venue preview
│   └── atmospheric markers
├── Your Atlas
│   ├── saved places
│   ├── dynamic collections
│   └── circadian collections
└── Nearby / related atmospheres

Taste
├── Taste coordinates
├── Radar profile
├── Atmospheric insights
├── Circadian affinities
└── Language / preferences
```

---

## 4. Bottom Navigation Rules

Bottom nav should remain a quiet HUD.

Recommended labels:

```text
Explore
Atlas
Taste
```

Recommended icons:

```text
Explore = search / compass / magnifying glass
Atlas   = compass / map / folded-map line icon
Taste   = user / radar / profile signal icon
```

Visual requirements:

- Bottom-centered.
- Glassy / blurred.
- Warm-black background.
- Champagne-gold active state.
- Low visual weight.
- No large badges.
- No bright fills.
- No fourth tab unless absolutely necessary.
- No “Map” label.
- No “Saved” as top-level tab.

Rationale:

`Saved` becomes part of Atlas. `Profile` becomes `Taste`.

---

## 5. Venue Detail Map Block

### Section Name

Preferred:

```text
Spatial Placement
```

### Section Position

Place after emotional content and before practical details.

Recommended structure:

```text
<section className="k-venue-spatial">
  <div className="k-section-kicker">SPATIAL PLACEMENT</div>
  <h2>Where this atmosphere lives</h2>
  <p>A warm point inside Palermo Hollywood’s slower grid.</p>

  <SpatialMapCard venue={venue} nearbyVenues={nearbyVenues} />

  <div className="k-spatial-actions">
    <button>Open in Atlas</button>
    <button>Explore nearby atmospheres</button>
  </div>
</section>
```

### Copy Direction

Avoid:

```text
Location
Address
View map
Get directions
```

Prefer:

```text
Spatial Placement
Where this atmosphere lives
Neighborhood Signal
Open in Atlas
Explore nearby atmospheres
```

Example copy:

```text
A warm point inside Palermo Hollywood’s slower grid.
```

or:

```text
Set just off the louder Palermo current, close enough to movement but protected from rush.
```

### Map Card Requirements

The detail map should be:

- A large rounded card.
- Dark, quiet, and atmospheric.
- Visually aligned with venue imagery.
- Not overfilled with controls.
- Not a standard Google-style utility block.
- Styled as a spatial continuation of the venue story.

Recommended height:

```text
mobile: 360px - 460px
desktop: 520px - 640px
```

Recommended radius:

```text
24px - 32px
```

Recommended map padding:

```text
16px - 24px page inset
```

---

## 6. Atlas Surface

### Main Role

Atlas is the spatial layer of Korantis.

It should answer:

```text
Where are the atmospheres?
Which places has the user remembered?
How does the city feel through the user’s taste profile?
```

### Atlas Layout

Recommended mobile structure:

```text
Header
├── KORANTIS
├── City selector

Title
├── Spatial Atlas
├── Subcopy: Places arranged by resonance, memory, and proximity.

Mode switch
├── Spatial Atlas
├── Your Atlas

Map block
├── Mapbox map
├── atmospheric markers
├── selected venue preview

Below map
├── Nearby atmospheres
├── Saved collections
├── Circadian collections
```

### Atlas Map Behavior

Initial state:

- Center on current selected city.
- Show current ranked venues.
- Highlight the strongest match or nearest selected venue.
- Use warm-black style.
- Use gold/cream markers.

When opened from card spatial marker:

- Center map on selected venue.
- Show selected venue marker as active.
- Reveal a small venue preview sheet/card.
- Keep surrounding markers quiet.

When opened from bottom nav:

- Show city-level atmospheric map.
- No venue should overpower unless selected.
- The map should feel exploratory, not transactional.

When opened from Saved / Your Atlas:

- Show saved venues first.
- Use saved/remembered marker treatment.
- Collections may filter visible markers.

---

## 7. Card Spatial Affordance

### Recommended Pattern

Venue card location line:

```text
⌖ Palermo Hollywood
```

or:

```text
<CompassIcon size={11} /> Palermo Hollywood
```

### Visual Rules

- Size: metadata scale.
- Color: muted warm gray or muted champagne.
- Opacity: low-to-medium.
- Should align with existing location metadata.
- Should not look like a button unless pressed.
- Can become subtly gold on press/hover.

### Behavior

Recommended:

```text
onSpatialTap(venue) -> navigate('/atlas?venueId={venue.id}')
```

or with state:

```text
setActiveTab('atlas')
setSelectedVenueId(venue.id)
setAtlasMode('spatial')
```

Alternative:

```text
navigateToVenueDetail(venue.id, { scrollTo: 'spatial-placement' })
```

### Accessibility

The tiny spatial affordance should still have an accessible label:

```text
aria-label="Open Oporto Almacén in Spatial Atlas"
```

---

## 8. Mapbox Visual Direction

The Mapbox layer must be restyled to match Korantis.

### Map Style

Use a dark custom Mapbox style if available.

Visual target:

```text
warm-black
low-contrast streets
muted labels
no bright blues
no saturated green parks
no default high-contrast UI
```

Avoid:

- default Mapbox bright controls
- blue location dots
- colorful POI icons
- standard commercial marker colors
- bright white streets
- app-like zoom UI dominance

### Controls

Allowed:

- zoom controls only if restyled or visually subdued
- compass / orientation control only if quiet
- attribution as required by Mapbox, but kept minimal and non-disruptive

Recommended:

```text
Hide or restyle default controls where legally and technically appropriate.
Use custom controls if needed.
```

### Marker System

Recommended marker hierarchy:

```text
Active venue
= gold glow + small black center

Ranked venue
= small champagne dot

Saved venue
= champagne outline + filled warm-black center

Nearby atmosphere
= muted cream/gold dot

Cluster
= translucent warm-black circle with champagne border
```

Active marker:

```text
outer glow: champagne / amber
center: warm black
size: 44px - 64px visual glow
actual center dot: 8px - 12px
```

Quiet marker:

```text
size: 6px - 9px
opacity: 0.55 - 0.75
```

### Selected Venue Preview

When a marker is selected, show a small preview card:

```text
Venue name
Neighborhood
Mood phrase
Tiny tags
Optional thumbnail
```

This preview should use existing venue card typography and image treatment, but remain compact.

Do not create a generic map popup.

---

## 9. Data Requirements

Each venue must have:

```ts
latitude: number
longitude: number
neighborhood: string
city: string
country?: string
```

Recommended additional spatial fields:

```ts
spatialLabel?: string
spatialDescription?: string
nearbyVenueIds?: string[]
mapPriority?: number
```

Example:

```ts
{
  id: "oporto-almacen",
  name: "Oporto Almacén",
  city: "Buenos Aires",
  neighborhood: "Palermo Hollywood",
  latitude: -34.5821,
  longitude: -58.4352,
  spatialLabel: "A warm point inside Palermo Hollywood’s slower grid.",
  spatialDescription: "Close enough to movement, protected enough for lingering.",
  mapPriority: 0.82
}
```

---

## 10. Component Architecture

Recommended components:

```text
components/map/
├── SpatialAtlas.tsx
├── SpatialMapCard.tsx
├── VenueDetailMapBlock.tsx
├── AtlasVenuePreview.tsx
├── KorantisMarker.tsx
├── MapboxProvider.tsx
└── mapStyle.ts
```

### `SpatialAtlas.tsx`

Full Atlas surface.

Responsibilities:

- Render Atlas page/tab.
- Own selected venue state.
- Own mode: `spatial` / `your-atlas`.
- Render Mapbox full card.
- Render selected venue preview.
- Render saved/dynamic collections below.

### `VenueDetailMapBlock.tsx`

Venue detail spatial block.

Responsibilities:

- Render section title/copy.
- Render one focused Mapbox card.
- Center on current venue.
- Show nearby atmosphere markers quietly.
- Provide “Open in Atlas” CTA.

### `SpatialMapCard.tsx`

Reusable map container.

Responsibilities:

- Receive center, markers, active venue.
- Apply Korantis map container style.
- Render Mapbox map.
- Render custom markers.
- Hide/reduce default controls.

### `KorantisMarker.tsx`

Custom marker rendering.

Responsibilities:

- Marker states: active, saved, ranked, nearby, cluster.
- Warm-black/champagne visual language.
- Optional glow.

### `AtlasVenuePreview.tsx`

Selected venue preview card.

Responsibilities:

- Use venue name, neighborhood, mood phrase, tags.
- Optional image thumbnail.
- CTA to open venue detail.

---

## 11. State / Routing

Recommended routes or tab states:

```text
Explore tab
/
?tab=explore

Atlas tab
/?tab=atlas
/?tab=atlas&mode=spatial
/?tab=atlas&mode=saved
/?tab=atlas&venueId=oporto-almacen

Taste tab
/?tab=taste
```

If using internal state instead of URL:

```ts
type MainTab = "explore" | "atlas" | "taste";
type AtlasMode = "spatial" | "saved";

selectedVenueId?: string;
atlasMode: AtlasMode;
```

Preferred:

Use URL/search params for shareability and easier visual testing.

---

## 12. Implementation Order

### Phase 1 — Document + Freeze Current Direction

- Create this document.
- Capture current UI screenshots.
- Do not modify Mapbox logic yet.

### Phase 2 — Bottom Nav Architecture

- Rename / restructure bottom nav to:

```text
Explore / Atlas / Taste
```

- Move saved screen under Atlas as `Your Atlas`.
- Keep visual style identical or quieter.
- Do not add a fourth tab.

### Phase 3 — Venue Detail Spatial Placement

- Add `VenueDetailMapBlock`.
- Add Mapbox card inside detail page.
- Use selected venue coordinates.
- Add “Open in Atlas” CTA.
- Keep section after emotional content.

### Phase 4 — Atlas Surface

- Build `SpatialAtlas`.
- Add Mapbox map for current city.
- Show all approved/ranked venues.
- Add selected venue preview.
- Add `Your Atlas` saved/collection view.

### Phase 5 — Card-Level Spatial Signal

- Add tiny spatial marker to location metadata.
- Add tap behavior.
- Keep affordance quiet.
- Validate card identity did not degrade.

### Phase 6 — Mapbox Visual Polish

- Apply custom warm-black map style.
- Restyle markers.
- Restyle or minimize controls.
- Add selected/active marker behavior.
- Add cluster behavior only if needed.

---

## 13. Validation Rules

Before implementation:

```bash
cd korantis-app
npm run test:visual
```

After each phase:

```bash
cd korantis-app
npm run test:visual
```

Do not update baselines automatically.

Expected diffs by phase:

### Bottom Nav Phase

Expected:

- Label changes.
- Possibly icon change.
- Saved/Profile tab renamed or reorganized.

Unexpected:

- Feed card visual changes.
- Search layout changes.
- Venue card image/tags/metadata changes.
- Profile content degradation.

### Venue Detail Map Phase

Expected:

- New `Spatial Placement` block.
- Detail page becomes longer.
- Map card appears after emotional content.

Unexpected:

- Hero becomes smaller.
- Narrative moves below utility.
- Cards change.
- Feed changes.

### Atlas Phase

Expected:

- Atlas tab changes significantly.
- Mapbox visual appears.
- Saved collections become part of Atlas.

Unexpected:

- Explore tab becomes map-first.
- Bottom nav becomes visually heavier.
- Cards become more utilitarian.

### Card Spatial Signal Phase

Expected:

- Tiny location/spatial icon added to metadata.

Unexpected:

- Visible action rows.
- Loud buttons.
- Bookmark behavior degradation.
- Card composition shift.

---

## 14. Forbidden Patterns

Do not implement:

```text
Explore / Map / Saved / Profile
```

Do not implement:

```text
Resonance Feed / Spatial Atlas
```

as a large dominant switch above the feed.

Do not add:

```text
Save | Map | Share | Details
```

inside cards.

Do not use default bright Mapbox styling.

Do not allow map controls to become the loudest UI element.

Do not move utility details above emotional venue content.

Do not turn Atlas into a generic nearby search map.

---

## 15. Acceptance Criteria

The implementation is accepted when:

- Bottom nav reads as `Explore / Atlas / Taste`.
- Atlas feels like spatial memory, not generic map mode.
- Saved places live conceptually inside Atlas.
- Each venue detail has a `Spatial Placement` map block.
- Venue cards have only a quiet spatial signal, not loud map buttons.
- Mapbox style follows Korantis warm-black / champagne / cream identity.
- Map markers feel atmospheric and restrained.
- Explore remains image-first and emotionally led.
- The map never dominates the product unless the user intentionally enters Atlas.
- Visual tests show only expected diffs for the active phase.

---

## 16. Final Product Principle

```text
Explore is emotional discovery.
Atlas is spatial memory.
Taste is personal calibration.
Venue Detail connects emotion to place.
```

Mapbox should make Korantis feel more spatial, not more generic.

The map is not the product.

The atmosphere is the product.
