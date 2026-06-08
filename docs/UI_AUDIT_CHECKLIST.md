# Korantis UI Audit Checklist

This checklist verifies whether the current Korantis UI conforms to the canonical visual system defined in:

- `docs/UI_CANONICAL_SYSTEM.md`
- `docs/UI_DRIFT_REPORT.md`
- `docs/KORANTIS_DESIGN_LAWS.md`

It is intended for both human reviewers and AI agents. Each item must be evaluated against visible UI output, implementation references, or both.

Severity definitions:

- LOW: Minor local inconsistency that does not alter core identity.
- MEDIUM: Noticeable drift in a secondary surface or flexible UI area.
- HIGH: Drift affecting a protected surface or repeated pattern.
- CRITICAL: Change that breaks a canonical Korantis design law.

## Typography

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Display font | Venue names, hero headings, poetic taglines, and narrative headings use Cormorant Garamond or the canonical display serif. | Display surfaces use a generic sans-serif, system font, or non-canonical serif. | CRITICAL |
| Functional font | Controls, metadata, nav, labels, tags, utility text, and search use DM Sans or the canonical functional sans. | Functional UI uses inconsistent font families or a generic browser default. | HIGH |
| Display weight | Display type appears light, spacious, editorial, and restrained. | Display type appears heavy, cramped, bold by default, or dashboard-like. | HIGH |
| Metadata scale | Metadata labels remain small, quiet, uppercase, and widely tracked, generally around 10-11px. | Metadata becomes large, loud, title-like, or visually competes with venue names. | HIGH |
| Metadata tone | Metadata uses muted warm gray or champagne gold. | Metadata uses pure white, cold gray, saturated color, or high-contrast treatment. | HIGH |
| Hierarchy | Venue name dominates; location, tags, and details whisper. | Utility text, tags, labels, or controls dominate the venue name or image. | HIGH |
| Italic atmospheric captions | Poetic captions and taglines may use serif italic treatment where appropriate. | Atmospheric captions are flattened into generic utility descriptions. | MEDIUM |
| Text density | Text preserves cinematic pause and low-density editorial rhythm. | Cards or detail sections become dense, explanatory, or SaaS-like. | HIGH |

## Colors

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Warm-black foundation | Primary surfaces use warm black tones aligned with `#0A0A0A`, `#0F0D0B`, `#161412`, and `#1A1714`. | Surfaces shift to neutral black, cold slate, blue-black, gray dashboard tones, or bright panels. | CRITICAL |
| Cream foreground | Primary foreground text uses warm cream aligned with `#F5F0E8`. | Pure white becomes the default text color. | CRITICAL |
| Champagne gold role | Gold appears as signal: thin rules, metadata, icons, subtle borders, selected states. | Gold becomes a dominant filled surface, broad background, or decorative wash. | HIGH |
| Secondary text warmth | Secondary text uses warm muted gray. | Secondary text uses cold gray, blue-gray, or low-contrast accidental gray. | MEDIUM |
| Border behavior | Borders are low-opacity, warm, and quiet. | Borders are bright, cold, thick, or visually structural in a dashboard way. | MEDIUM |
| Control contrast | Controls remain legible while subordinate to imagery and atmosphere. | Controls become the loudest visual elements on the page. | HIGH |
| Color consistency | Core palette remains consistent across feed, detail, nav, and search. | Individual components introduce unrelated palettes or one-off color systems. | HIGH |

## Card Geometry

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Card A cinematic ratio | Cinematic full-bleed card uses 3/2 aspect ratio. | Cinematic card uses 16/9, square, viewport-relative, or arbitrary ratio. | CRITICAL |
| Card D immersive ratio | Vertical immersive card uses 9/16 aspect ratio with max height around 640px. | Immersive card becomes viewport-relative only, square, wide, or loses portrait-object identity. | CRITICAL |
| Card E layered ratio | Layered editorial card uses 3/4 aspect ratio. | Layered card becomes square, wide, or generic panel geometry. | CRITICAL |
| Compact card geometry | Compact atmospheric card uses a 16/9 image and denser browse information. | Compact card becomes tall, portrait-heavy, or no longer compact. | HIGH |
| Variant distinction | Card variants remain visibly distinct in scale, shape, density, and rhythm. | All cards converge toward one uniform card template. | CRITICAL |
| Mobile editorial width | Feed card system preserves the original mobile-editorial intimacy around 428px where applicable. | Cards stretch into over-wide desktop content blocks without editorial constraint. | HIGH |
| Geometry stability | Card dimensions do not shift unpredictably due to hover, loading, metadata, or control states. | Card size changes during interaction or content loading in a way that breaks rhythm. | MEDIUM |

## Card Composition

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Image as emotional surface | Primary cards are image-led, with the photograph carrying the emotional experience. | Cards read first as text panels, utility boxes, or generic content cards. | CRITICAL |
| Text embedded in image | Cinematic and immersive cards place key typography inside the photograph with protective gradients. | Text is moved into detached conventional card bodies on primary cinematic cards. | HIGH |
| Gradient protection | Gradients protect readability while preserving image mood. | Text sits directly on unreadable imagery, or gradients become flat opaque blocks. | HIGH |
| Layered panel behavior | Layered card panel is asymmetrical, bottom-left, translucent, blurred, and editorial. | Panel is centered, heavy, rectangular, opaque, or reads as a generic nested card. | HIGH |
| Bookmark behavior | Bookmark controls are quiet, subtle, and proximity-revealed where possible. | Bookmark controls are permanently loud, visually dominant, or conventional app buttons. | MEDIUM |
| Tag behavior | Tags are whispered metadata with restrained color and small scale. | Tags become colorful chips, filters, badges, or primary UI elements. | HIGH |
| Gold accents | Gold appears as accent lines, icons, faint tints, and subtle borders. | Gold is overused as large fill, bright badge, or decorative emphasis. | MEDIUM |
| Hover behavior | Hover is minimal cinematic lift or scale. | Hover is bouncy, playful, abrupt, or changes card hierarchy. | MEDIUM |

## Motion

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Motion duration | Major UI motion uses cinematic durations in the 600-1400ms family. | Motion uses fast default transitions that feel utilitarian or abrupt. | HIGH |
| Motion easing | Motion uses cinematic easing aligned with `cubic-bezier(0.22, 0.61, 0.36, 1)`. | Motion uses generic ease, springy bounce, or inconsistent easing. | HIGH |
| Shell transition | Page/view changes preserve fade-through-black or an equivalent cinematic transition. | Page/view changes are instant, generic crossfades, or utility transitions only. | HIGH |
| Card-to-venue choreography | Card selection expands or transitions in a way that preserves image continuity and cinematic arrival. | Card-to-detail navigation feels disconnected, abrupt, or purely modal. | CRITICAL |
| Reveal behavior | Elements reveal with slow upward drift and fade. | Elements appear instantly, pop in, or use fast generic entrance animation. | MEDIUM |
| Tag stagger | Tag groups reveal subtly and sequentially where used. | Tags appear as static utility chips without atmospheric timing. | MEDIUM |
| Scroll behavior | Scroll supports atmosphere through compression, parallax, dimming, or other cinematic response. | Scroll is purely static and utilitarian across primary discovery surfaces. | HIGH |
| Motion restraint | Motion supports mood and navigation without calling attention to itself. | Motion feels playful, bouncy, ornamental, or inconsistent with luxury editorial tone. | HIGH |

## Feed Rhythm

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Vertical curation | Discovery feed is a curated vertical sequence. | Discovery becomes a uniform dashboard grid or dense directory. | CRITICAL |
| Rhythm classes | Feed preserves tight, breathe, and isolated pacing behavior or an exact equivalent. | Feed spacing collapses into uniform margins only. | HIGH |
| Compression and silence | Compact cards create relief; immersive cards create pause; isolated cards create dramatic separation. | Every card receives the same visual weight and spacing. | HIGH |
| Mobile intimacy | Feed remains intimate and editorial, especially on mobile. | Feed reads as a broad responsive web-app layout with no curated pacing. | HIGH |
| 8px spacing logic | Spacing follows the canonical 8px rhythm, including micro and atmospheric spacing ranges. | Spacing is arbitrary, inconsistent, or driven only by local utility convenience. | MEDIUM |
| Consumer density | Consumer discovery remains low-density and image-led. | Consumer discovery becomes compact, data-dense, or operational. | HIGH |
| Utility placement | Utility controls do not interrupt the feed's atmospheric pacing. | Toggles, filters, debug states, or counters dominate the top of the feed. | HIGH |

## Venue Detail

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Hero immersion | Venue detail opens with an immersive full-height or near-full-height cinematic hero. | Hero is reduced to a compact banner or ordinary detail header. | CRITICAL |
| Hero image treatment | Hero imagery is oversized, darkened, graded, and atmospheric. | Hero image is plain, bright, ungraded, or treated as utility media. | HIGH |
| Narrative order | Detail moves from emotional arrival to narrative, atmosphere tags, time shifts, gallery, utility, and related places. | Detail prioritizes facts, controls, or utility cards before emotional context. | HIGH |
| Vertical silence | Detail sections use large spacing and cinematic pauses. | Detail page becomes dense, stacked, or dashboard-like. | HIGH |
| Time shifts | Time-based atmosphere appears as immersive story blocks. | Time shifts become compact utility cards only. | HIGH |
| Gallery behavior | Gallery feels tactile, oversized, horizontal, or peeking where canonical. | Gallery becomes a generic static grid without editorial tactility. | HIGH |
| Similar atmospheres | Related/similar atmosphere content appears as part of venue discovery where applicable. | Detail lacks continuation into related atmosphere discovery. | MEDIUM |
| Utility timing | Practical details appear after emotional content. | Practical details dominate the initial detail experience. | HIGH |

## Navigation

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Bottom HUD placement | Navigation remains bottom-centered, blurred, quiet, and HUD-like. | Navigation becomes a conventional top nav, sidebar, or loud app bar on consumer surfaces. | HIGH |
| Icon restraint | Nav uses restrained icon-first behavior consistent with luxury HUD identity. | Nav becomes label-heavy, bright, or visually dominant. | HIGH |
| Visual weight | Navigation is accessible but subordinate to venue imagery and feed rhythm. | Navigation competes with card imagery or search as a primary visual element. | MEDIUM |
| Active state | Active state uses subtle warm/gold signal. | Active state uses loud fills, saturated colors, or generic tab treatment. | MEDIUM |
| Map access | Map entry remains quiet and secondary to discovery unless explicitly in map mode. | Map toggle becomes a dominant segmented app control that disrupts cinematic discovery. | MEDIUM |
| Admin/debug separation | Admin and debug navigation do not appear as consumer visual patterns. | Consumer navigation exposes admin/debug concepts or implementation surfaces. | HIGH |

## Atmosphere Systems

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Global ambient layer | Circadian or ambient atmosphere remains present as a subtle visual identity layer. | Ambient layer is removed or invisible across consumer surfaces. | HIGH |
| Grain | Soft grain appears globally and/or on key cards as part of the cinematic texture. | Grain is removed entirely from primary consumer surfaces. | HIGH |
| Vignettes | Vignettes support focus and cinematic depth on imagery. | Imagery appears flat, evenly lit, or unframed by atmosphere. | HIGH |
| Warm overlays | Warm-black overlays unify imagery and surfaces. | Images and surfaces feel mismatched, cold, or stock-like. | HIGH |
| Low-opacity detail | Borders, rules, and overlays remain subtle and low-opacity. | Atmosphere is replaced by hard borders, bright outlines, or heavy panels. | MEDIUM |
| Consumer/admin separation | Consumer surfaces remain cinematic while admin/debug surfaces remain isolated. | Debug or admin aesthetics leak into consumer discovery or detail pages. | HIGH |
| Atmosphere as product meaning | Atmosphere systems visibly support the idea of finding places by feeling. | Atmosphere becomes optional decoration or disappears behind utility UI. | CRITICAL |

## Image Treatment

| Check | PASS Criteria | FAIL Criteria | Severity |
|---|---|---|---|
| Film grading | Venue images use reduced brightness, increased contrast, and restrained saturation. | Images appear raw, bright, stock-like, or ungraded. | CRITICAL |
| Deep gradients | Primary cards and hero images use deep layered gradients for readability and mood. | Gradients are missing, shallow, or replaced by flat opaque blocks. | HIGH |
| Top vignette | Immersive cards retain top vignette behavior where applicable. | Immersive images lack top depth and feel flat. | MEDIUM |
| Bottom fade | Cinematic and immersive cards retain strong bottom fades for embedded text. | Text readability depends on raw image contrast or hard panels only. | HIGH |
| Image continuity | Card and detail imagery preserve emotional continuity across discovery and detail. | Detail image treatment feels unrelated to feed card treatment. | HIGH |
| Mood over literal clarity | Images prioritize atmosphere while remaining legible enough for venue recognition. | Images are optimized only for clarity, brightness, or literal documentation. | HIGH |
| Full-bleed behavior | Primary cards and detail hero use image as a full-bleed emotional surface. | Images are contained in small thumbnails or secondary media slots. | CRITICAL |

## Audit Result Format

Use this format when recording an audit:

| Section | Item | Result | Severity | Evidence | Notes |
|---|---|---|---|---|---|
| Typography | Display font | PASS or FAIL | CRITICAL | File, screenshot, or observed UI reference | Short factual note |

Accepted result values:

- PASS
- FAIL
- NOT_APPLICABLE
- NEEDS_REVIEW

Evidence should reference one or more of:

- Screenshot
- Component file
- CSS/token file
- Source document
- Browser observation
- Design archive file
