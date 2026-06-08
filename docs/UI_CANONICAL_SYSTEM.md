# Korantis UI Canonical System

## Source Files

Original visual source of truth:

- [app.html](F:/KORANTIS/CLAUDE_ORIGINAL_UI/app.html)
- [search.html](F:/KORANTIS/CLAUDE_ORIGINAL_UI/search.html)
- [venue.html](F:/KORANTIS/CLAUDE_ORIGINAL_UI/venue.html)
- [indexdemocards.html](F:/KORANTIS/CLAUDE_ORIGINAL_UI/indexdemocards.html)
- [homeresume.png](F:/KORANTIS/CLAUDE_ORIGINAL_UI/homeresume.png)
- [brandingpro.png](F:/KORANTIS/CLAUDE_ORIGINAL_UI/brandingpro.png)

## Visual Laws

1. Korantis is warm-black, not neutral dark.
   The canonical background is deep black with warm undertones: `#0A0A0A`, `#0F0D0B`, `#161412`, `#1A1714`.

2. Champagne gold is a signal, not decoration.
   Canonical accent is `#C9A96E`, with lighter `#D4B87A` and muted `#8A7A5A`. It appears in thin lines, metadata, icons, quiet outlines, and selected states.

3. Cream text replaces pure white.
   Canonical foreground is `#F5F0E8`. Secondary text is warm gray, not cold gray.

4. Atmosphere is produced by darkness plus detail.
   The UI must use gradients, vignettes, image darkening, soft grain, warm overlays, and low-opacity borders to make surfaces feel cinematic.

5. The brand mark is editorial-luxury.
   `brandingpro.png` establishes wide letter-spaced serif identity, compass/orientation motif, black-and-gold premium signage, and the phrase “Places for how you want to feel.”

6. Korantis should feel like a luxury editorial guide, not a dashboard.
   Buttons, chips, controls, and metadata are subordinate to imagery, pacing, and typography.

## Typography Laws

1. Display typography uses Cormorant Garamond.
   Used for venue names, hero headlines, poetic taglines, narrative blocks, and emotionally important headings.

2. Functional typography uses DM Sans.
   Used for controls, search input, metadata, labels, nav, status text, utility text, and tags.

3. Display type is light and spacious.
   Original headings use low weights, elegant line height, and restrained tracking. The “homeresume” landing hero uses large serif copy with italic emphasis.

4. Metadata is small, quiet, and uppercase.
   Original labels use `10px-11px`, uppercase, wide letter spacing, and muted warm gray/gold.

5. Taglines are often serif italic.
   Original cards treat tagline text as atmospheric captions, not utility descriptions.

6. Text hierarchy is image-first.
   Venue name dominates. Location and tags whisper. Descriptions support mood, not conversion.

## Card Laws

Canonical card variants from the original system:

1. Card A: Cinematic Full-Bleed
   - Original class: `k-card--cinematic`
   - Aspect ratio: `3 / 2`
   - Image fills entire card.
   - Typography lives inside the photograph.
   - Bottom gradient height around 85%.
   - Magazine-cover / movie-still composition.

2. Card D: Vertical Immersive
   - Original class: `k-card--immersive`
   - Aspect ratio: `9 / 16`
   - Max height: `640px`
   - Signature Korantis card.
   - Heavy bottom gradient.
   - Gold accent line above metadata.
   - Designed to feel screenshot-worthy.

3. Card E: Layered Editorial
   - Original class: `k-card--layered`
   - Aspect ratio: `3 / 4`
   - Full image base with radial vignette.
   - Frosted panel floats near bottom-left, slightly asymmetrical.
   - Panel blur is strong and architectural.
   - Panel is not a generic card; it reads as a caption embedded into the photo.

4. Card B: Editorial Split
   - Secondary.
   - Image top, content below.
   - Useful for denser layouts.

5. Card C: Compact Atmospheric
   - Secondary.
   - Image aspect: `16 / 9`.
   - Denser information.
   - Browse mode support.

6. Card F: Minimal Signal
   - Secondary.
   - Horizontal typographic/list card.
   - Small square image at right.
   - Future dense mode.

## Card Composition Laws

1. The image is the emotional surface.
2. The card never begins as a generic white-box pattern.
3. Gradients must protect text while preserving image mood.
4. Bookmark controls are quiet and proximity-revealed.
5. Tags are “whispered metadata,” not colorful filter badges.
6. Gold appears as accent line, faint tag tint, icon color, or subtle border.
7. Card hover movement is minimal: lift or scale must feel cinematic, not bouncy.
8. Card variants create rhythm by alternating scale, shape, and density.

## Motion Laws

1. Motion is cinematic and slow.
   Original durations include `600ms`, `800ms`, `1000ms`, `1200ms`, `1400ms`.

2. Canonical easing is cinematic.
   `cubic-bezier(0.22, 0.61, 0.36, 1)`.

3. Original app shell uses fade-through-black.
   `k-transition-overlay` exists specifically for cinematic view transitions.

4. Original card-to-venue transition uses FLIP clone choreography.
   The clicked image clones, expands to full viewport, then reveals the venue detail beneath.

5. Original scroll behavior is atmospheric.
   Search header compresses on scroll. Cards dim during high-velocity scroll. Images parallax softly.

6. Original reveal pattern is slow upward drift.
   `.k-reveal` starts with opacity `0` and `translateY(28px)`, then enters over `1.4s`.

7. Tag reveal is staggered.
   Tags appear slowly, one by one, as subtle editorial signals.

## Spacing Laws

1. The original system is mobile-editorial first.
   Canonical mobile max width is `428px`.

2. Feed rhythm is intentional.
   Original rhythm classes:
   - `k-feed-item--tight`
   - `k-feed-item--breathe`
   - `k-feed-item--isolated`

3. Spacing scale follows an 8px grid.
   Canonical scale runs from `2px` to `128px`.

4. Feed pacing alternates compression and silence.
   Compact cards create relief. Immersive cards create pause. Isolated cards create dramatic separation.

5. Venue detail uses large vertical silence.
   Original venue sections use `120px`, `160px`, `180px`, and `70vh` time blocks.

6. Density must remain low in consumer discovery.
   The original UI intentionally avoids dashboard-like compression.

## Image Laws

1. Images are film-graded.
   Original card images use brightness reduction, contrast boost, and desaturation.

2. Warm-black tonal shift unifies images.
   Priority cards use a warm overlay via pseudo-elements.

3. Film grain is part of the image system.
   Cards and global surfaces use subtle noise overlays.

4. Gradients are deep and layered.
   Original immersive cards use strong bottom fades and top vignettes.

5. Mood is more important than literal clarity.
   Original comments explicitly state: “Atmosphere > clarity. Mood > detail.”

6. Venue detail hero is immersive.
   Original detail page uses a `100vh` hero with oversized image bounds and parallax.

## Layout Laws

1. Search begins with a hybrid sticky header.
   Original search keeps the input as a fixed atmospheric control surface.

2. Discovery feed is vertically curated.
   It is not a uniform grid. It is a sequence.

3. Venue detail is scroll-cinematic.
   The original detail page moves from full-screen hero to narrative, tags, time-shift sections, tactile gallery, quiet utility, and similar atmospheres.

4. Bottom navigation is a luxury HUD.
   Original floating nav is icon-only, blurred, quiet, and bottom-centered.

5. Utility information is discovered late.
   Pacing, access, material investment, and related places come after emotional content.

## Emotional Design Principles

Korantis feels cinematic because it uses:
- dark full-bleed imagery
- deep gradients
- warm-black surfaces
- film grain
- slow reveal
- large vertical silence
- typography over image
- card-to-venue expansion choreography

Korantis feels editorial because it uses:
- serif headlines
- quiet metadata
- magazine-like captions
- asymmetrical glass panels
- restrained tags
- curated feed rhythm
- descriptive mood language

Korantis avoids generic SaaS by rejecting:
- bright panels
- dense dashboards
- colorful chip systems
- utility-first visual dominance
- uniform cards
- fast/bouncy motion
- explanatory UI text as the main experience
