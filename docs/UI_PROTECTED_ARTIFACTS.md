# Korantis Protected Visual Artifacts

This document defines the protected visual artifacts of Korantis. It formalizes which parts of the product cannot be freely altered, why they are protected, what changes are allowed, what changes are forbidden, and what review level is required before modification.

This is a governance document only. It does not modify application code.

## Review Levels

| Level | Name | Requirement |
|---|---|---|
| LEVEL 1 | Minor implementation change | Engineering review only. The change must preserve the existing visual result. |
| LEVEL 2 | Visual review required | A before/after visual check is required against the baseline capture. |
| LEVEL 3 | Design-law review required | The change must be checked against `KORANTIS_DESIGN_LAWS.md` and `UI_GOVERNANCE.md`. |
| LEVEL 4 | Canonical-system review required | The change must be checked against `UI_CANONICAL_SYSTEM.md`, original archive references, visual baseline diffs, and an explicit architecture decision. |

## Artifact 1: Venue Card System

### Description

The full venue card system, including card variants, image dominance, typography hierarchy, metadata placement, tag treatment, bookmark affordances, borders, overlays, and card-level composition.

### Why It Is Protected

The venue card is the atomic unit of Korantis identity. The drift audit identifies card degradation as the highest-priority visual issue: cards moved from protected editorial artifacts to approximate React variants with scattered utility styling.

### Allowed Modifications

- Content-only updates to venue copy, category labels, tags, and localized text.
- Implementation refactors that preserve the exact visual output.
- Accessibility improvements that preserve visual hierarchy and card composition.
- Minor border or opacity tuning after visual review.
- Adding governed reusable primitives that encode existing canonical card behavior.

### Forbidden Modifications

- Making venue cards visually uniform.
- Replacing image-led cards with generic content boxes.
- Moving metadata into loud dashboard-like structures.
- Converting tags into colorful SaaS chips.
- Making bookmark controls dominant by default.
- Removing full-bleed imagery from primary card variants.
- Changing primary card composition without canonical review.

### Review Level Required

LEVEL 4 for any change to primary card structure, composition, or identity. LEVEL 2 for minor implementation changes that preserve existing card laws.

## Artifact 2: Card Ratios

### Description

The canonical aspect ratios and size constraints of Korantis card variants:

- Card A / Cinematic Full-Bleed: `3 / 2`
- Card D / Vertical Immersive: `9 / 16`, max height around `640px`
- Card E / Layered Editorial: `3 / 4`
- Card C / Compact Atmospheric image: `16 / 9`

### Why It Is Protected

The drift report identifies changed card ratios as a direct loss of visual identity. Ratios define whether Korantis feels like cinema, editorial photography, and curated discovery, or like generic web content.

### Allowed Modifications

- Fixing implementation to restore canonical ratios.
- Minor responsive constraints that preserve the canonical ratio.
- Secondary Card B, C, or F tuning when it does not affect primary identity cards.

### Forbidden Modifications

- Changing Card A, D, or E ratios without canonical-system review.
- Replacing fixed editorial ratios with viewport-relative approximations.
- Making compact cards taller than their browse-mode role requires.
- Allowing responsive behavior to distort protected ratios.

### Review Level Required

LEVEL 4 for Card A, D, or E ratio changes. LEVEL 3 for compact or secondary card geometry changes.

## Artifact 3: Card Variant Taxonomy

### Description

The protected taxonomy of card types:

- Card A: Cinematic Full-Bleed
- Card B: Editorial Split
- Card C: Compact Atmospheric
- Card D: Vertical Immersive
- Card E: Layered Editorial
- Card F: Minimal Signal

### Why It Is Protected

Variant taxonomy creates rhythm, contrast, and editorial pacing. Removing the taxonomy makes the feed uniform and weakens the original curated sequence.

### Allowed Modifications

- Restoring missing canonical variants.
- Renaming implementation classes only if canonical names remain documented and mapped.
- Adding internal helper names that preserve canonical taxonomy.
- Content/data changes that assign venues to existing variants.

### Forbidden Modifications

- Removing canonical variants.
- Collapsing variants into a single reusable card.
- Introducing new variants that compete with A/D/E before restoration is complete.
- Treating variant names as arbitrary style options rather than protected artifacts.

### Review Level Required

LEVEL 4 for taxonomy changes. LEVEL 3 for implementation mapping changes.

## Artifact 4: Feed Rhythm

### Description

The vertical discovery rhythm created by `tight`, `breathe`, and `isolated` spacing categories, mobile-editorial width, and alternation between compression and silence.

### Why It Is Protected

Korantis discovery is a curated vertical sequence, not a grid or dashboard. Feed rhythm controls pacing and makes venue cards feel intentionally placed.

### Allowed Modifications

- Restoring canonical spacing behavior.
- Adjusting local spacing only when it preserves tight/breathe/isolated intent.
- Changing venue ordering through ranking/data systems without removing rhythm categories.

### Forbidden Modifications

- Removing rhythm categories.
- Converting the discovery feed into a uniform grid.
- Expanding the core feed into a broad dashboard-like layout.
- Compressing the feed to maximize visible information at the expense of atmosphere.

### Review Level Required

LEVEL 4 for feed width or rhythm model changes. LEVEL 3 for spacing scale changes.

## Artifact 5: Image Grading System

### Description

The cinematic treatment of venue imagery: reduced brightness, increased contrast, restrained saturation, warm-black overlays, deep gradients, vignettes, and mood-first image handling.

### Why It Is Protected

Images are the emotional surface of Korantis. Without grading, vignettes, and warm tonal unification, the interface becomes ordinary dark mode.

### Allowed Modifications

- Restoring canonical grading primitives.
- Tuning image treatment to improve legibility while preserving mood.
- Applying consistent grading across cards and venue detail imagery.
- Replacing poor source images when replacement images preserve atmosphere and composition.

### Forbidden Modifications

- Removing image grading from primary cards.
- Prioritizing literal image clarity over atmosphere.
- Replacing warm-black overlays with neutral or cold dark overlays.
- Using flat opacity alone as the image-treatment system.
- Allowing each component to invent its own unrelated image treatment.

### Review Level Required

LEVEL 4 for global image-treatment changes. LEVEL 3 for component-level grading changes.

## Artifact 6: Film Grain System

### Description

The subtle global and card-level grain/noise layer that contributes to the cinematic, tactile surface quality of Korantis.

### Why It Is Protected

Grain is part of the atmosphere system, not decoration. It helps prevent the interface from reading as flat software.

### Allowed Modifications

- Adjusting grain intensity within subtle bounds.
- Improving implementation performance while preserving visible result.
- Restoring card-level grain where it was lost.
- Respecting accessibility and reduced-motion/performance constraints where applicable.

### Forbidden Modifications

- Removing grain entirely from consumer atmosphere.
- Making grain loud, dirty, or visually distracting.
- Applying grain inconsistently as a decorative effect rather than a governed system.

### Review Level Required

LEVEL 3 for opacity or implementation changes. LEVEL 4 for removal or replacement.

## Artifact 7: Typography System

### Description

The Cormorant Garamond and DM Sans pairing, including display hierarchy, metadata scale, uppercase tracking, serif atmospheric captions, and warm cream/gray text treatment.

### Why It Is Protected

Typography is a core signal of editorial luxury. It separates Korantis from operational dashboards and generic directories.

### Allowed Modifications

- Copy and localization changes that preserve hierarchy and density.
- Minor responsive sizing adjustments after visual review.
- Accessibility fixes that do not alter the type system identity.
- Implementation refactors that preserve font family, hierarchy, and metadata behavior.

### Forbidden Modifications

- Replacing Cormorant Garamond or DM Sans.
- Making metadata large, loud, or high-contrast.
- Using pure white as default text.
- Flattening the hierarchy so venue names no longer dominate.
- Turning atmospheric captions into utility descriptions.

### Review Level Required

LEVEL 4 for font-family or hierarchy changes. LEVEL 3 for metadata sizing, weight, or tracking changes.

## Artifact 8: Color Identity

### Description

The warm-black, champagne-gold, and cream identity system:

- Warm black surfaces: `#0A0A0A`, `#0F0D0B`, `#161412`, `#1A1714`
- Champagne gold accents: `#C9A96E`, `#D4B87A`, `#8A7A5A`
- Cream foreground: `#F5F0E8`

### Why It Is Protected

Color establishes the luxury editorial identity. The product must remain warm-black, not neutral dark or cold blue-gray.

### Allowed Modifications

- Minor alpha tuning for borders, overlays, and subtle state changes.
- Token cleanup that preserves exact color identity.
- Accessibility adjustments that preserve warm-black/champagne/cream philosophy.

### Forbidden Modifications

- Replacing warm black with neutral/cold dark palettes.
- Using pure white as the default foreground.
- Promoting champagne gold into a dominant filled-surface color.
- Introducing loud accent colors into consumer discovery.

### Review Level Required

LEVEL 4 for token or palette changes. LEVEL 2 for minor opacity tuning.

## Artifact 9: Circadian Ambient Layer

### Description

The global circadian atmosphere layer, including ambient radial glow, warm darkness, time-based emotional temperature, and the relationship between ambient state and product mood.

### Why It Is Protected

The circadian layer is part of Korantis product meaning. It makes discovery feel alive over time and connects visual atmosphere to the ranking/taste concept.

### Allowed Modifications

- Subtle opacity or interpolation tuning after visual review.
- Performance improvements that preserve visual output.
- Bug fixes that prevent the ambient layer from obscuring content.

### Forbidden Modifications

- Removing the ambient layer from consumer discovery.
- Making the ambient layer decorative, loud, or disconnected from circadian state.
- Replacing warm tonal behavior with cold generic gradients.
- Allowing ambient effects to dominate venue imagery or text.

### Review Level Required

LEVEL 4 for behavior or conceptual changes. LEVEL 3 for visual tuning.

## Artifact 10: Venue Hero

### Description

The immersive venue detail hero: full-screen or near-full-screen image arrival, oversized image behavior, warm overlay, strong typographic hierarchy, and story-first entry into the venue page.

### Why It Is Protected

The original venue detail page is scroll-cinematic. The hero is the emotional arrival point and must not collapse into a compact information panel.

### Allowed Modifications

- Restoring the canonical `100vh` hero.
- Improving legibility while preserving immersion.
- Tuning responsive behavior to avoid clipping while keeping the hero dominant.

### Forbidden Modifications

- Reducing the hero to a utility card.
- Prioritizing facts or controls before emotional arrival.
- Removing image dominance.
- Converting the detail page into a compact dashboard layout.

### Review Level Required

LEVEL 4 for hero height, composition, or narrative-order changes.

## Artifact 11: Motion Language

### Description

The cinematic motion system: slow durations, canonical easing, fade-through-black, card-to-venue FLIP clone choreography, upward reveal, tag stagger, scroll velocity awareness, and parallax support.

### Why It Is Protected

Motion is part of the cinematic identity. Generic fast transitions make Korantis feel like ordinary app UI.

### Allowed Modifications

- Restoring canonical motion behaviors.
- Respecting reduced-motion preferences.
- Performance improvements that preserve perceived pacing.
- Minor hover-state refinements that remain restrained.

### Forbidden Modifications

- Replacing cinematic motion with fast or bouncy defaults.
- Removing shell transitions or card-to-venue continuity without review.
- Adding decorative animation unrelated to atmosphere or story.
- Allowing motion to obscure content or harm usability.

### Review Level Required

LEVEL 4 for page, shell, reveal, scroll, or card-to-venue motion changes. LEVEL 2 for minor hover tuning.

## Artifact 12: Search Header

### Description

The search experience as an atmospheric instrument panel: sticky or fixed behavior, compression, blur, quiet controls, and subordinate relationship to the feed.

### Why It Is Protected

Search should not read as an ordinary SaaS form. It is the entry point into atmospheric discovery and must preserve the image-first experience.

### Allowed Modifications

- Restoring sticky/fixed cinematic behavior.
- Copy or placeholder updates that preserve tone.
- Input and filter refinements that remain visually quiet.
- Ranking/intent integration changes that do not alter visual hierarchy.

### Forbidden Modifications

- Turning search into a dominant dashboard control panel.
- Making filters louder than venue imagery.
- Removing compression or atmospheric behavior without review.
- Expanding search controls into a generic utility surface.

### Review Level Required

LEVEL 4 for layout, stickiness, compression, or prominence changes. LEVEL 2 for copy-only changes.

## Artifact 13: Bottom Navigation

### Description

The bottom-centered luxury HUD navigation: blurred, quiet, low-density, and visually subordinate to discovery.

### Why It Is Protected

Navigation frames the product without becoming the product. The original identity used restrained HUD behavior rather than conventional app navigation.

### Allowed Modifications

- Icon asset updates that preserve weight and restraint.
- Label/copy adjustments after visual review.
- Accessibility improvements that preserve the HUD feel.
- Restoring quieter icon-led behavior.

### Forbidden Modifications

- Moving navigation to a dominant top app bar without review.
- Making navigation visually heavy, bright, or dashboard-like.
- Adding large labels or badges that compete with venue cards.
- Removing the blurred bottom-centered HUD behavior without canonical review.

### Review Level Required

LEVEL 4 for location, structure, or visual-weight changes. LEVEL 2 for minor icon or copy tuning.

## Artifact 14: Metadata Style

### Description

The small uppercase metadata system used for categories, locations, tags, atmospheric labels, score/debug-adjacent labels, and secondary venue descriptors.

### Why It Is Protected

Metadata must whisper. It supports atmosphere without making discovery feel like a database or filtering UI.

### Allowed Modifications

- Copy and localization changes.
- Minor spacing or tracking adjustments after visual review.
- Accessibility changes that preserve secondary hierarchy.
- Restoring gold-muted, warm-gray, small uppercase behavior.

### Forbidden Modifications

- Turning metadata into colorful chips.
- Making metadata brighter or larger than venue names or imagery.
- Using metadata as the primary visual structure of cards.
- Introducing admin/debug metadata patterns into consumer discovery.

### Review Level Required

LEVEL 3 for metadata scale, color, placement, or hierarchy changes. LEVEL 1 for copy-only edits.

## Artifact 15: Similar Atmospheres Section

### Description

The venue detail section that connects the current venue to related atmospheres after the primary emotional story has been established.

### Why It Is Protected

Similar atmospheres reinforce the product's psychogeographic model and maintain story-first navigation between venues. The drift report identifies this section as lost from the current detail experience.

### Allowed Modifications

- Restoring the section after primary venue story content.
- Updating related venue selection logic while preserving visual quietness.
- Using protected card primitives for related places.
- Copy changes that preserve atmospheric tone.

### Forbidden Modifications

- Moving related places above the venue's emotional story.
- Turning the section into a dense recommendation grid.
- Making it visually louder than the primary venue.
- Using generic ecommerce or directory recommendation patterns.

### Review Level Required

LEVEL 3 for visual structure changes. LEVEL 4 if the section changes venue detail narrative order.

## Enforcement Rules

1. Any change touching a protected artifact must declare its review level before implementation.
2. LEVEL 3 and LEVEL 4 changes must reference `KORANTIS_DESIGN_LAWS.md` and `UI_GOVERNANCE.md`.
3. LEVEL 4 changes must also reference `UI_CANONICAL_SYSTEM.md` and the original UI archive.
4. Visual changes must be checked against the Playwright baseline defined in `UI_BASELINE_CAPTURE.md`.
5. Expected visual diffs must be mapped to the active restoration phase in `UI_RESTORATION_PLAN.md`.
6. Admin and debug surfaces must remain visually isolated from consumer protected artifacts.
7. Product utility may expand only when it remains subordinate to atmosphere, imagery, pacing, and typography.

## Final Rule

Protected artifacts are not preferences. They are the visual architecture of Korantis. Any implementation convenience that weakens them is aesthetic drift unless explicitly reviewed and accepted.
