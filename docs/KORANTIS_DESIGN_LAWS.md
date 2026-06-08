# Korantis Design Laws

This document defines the immutable Korantis UI laws extracted from the canonical original visual system. It is a governance reference for future UI restoration and product work.

These laws describe the original visual identity as a protected system. They are not implementation instructions and do not modify application code.

## 1. Brand Identity Laws

1. Korantis is warm-black, not neutral dark. The canonical surface family is built from `#0A0A0A`, `#0F0D0B`, `#161412`, and `#1A1714`.
2. Champagne gold is signal, not decoration. The canonical gold family includes `#C9A96E`, `#D4B87A`, and `#8A7A5A`, used for thin rules, metadata, icons, quiet outlines, selected states, and atmospheric accents.
3. Cream text replaces pure white. The foreground tone is warm cream, led by `#F5F0E8`, with secondary text in warm gray.
4. The brand identity is editorial luxury: wide letter-spaced serif identity, compass or orientation motifs, black-and-gold premium signage, and the phrase "Places for how you want to feel."
5. Korantis is a luxury editorial guide, not a dashboard. Controls, filters, and metadata must remain visually subordinate to imagery, pacing, typography, and atmosphere.
6. The interface should feel like curated nightlife, cinema, architecture, and magazine culture rather than operational software.

## 2. Typography Laws

1. Display typography uses Cormorant Garamond.
2. Functional typography uses DM Sans.
3. Display type is light, spacious, and editorial, with restrained weight and elegant line-height.
4. Metadata typography is small, quiet, uppercase, and widely tracked, typically around 10-11px.
5. Metadata uses muted warm gray or champagne gold rather than high-contrast white.
6. Taglines and atmospheric captions may use serif italic treatment.
7. Text hierarchy is image-first. Venue names dominate; location, tags, and supporting metadata whisper.
8. Typography should create cinematic pause, not dashboard density.

## 3. Card System Laws

1. The venue card is the atomic unit of Korantis identity.
2. Canonical card variants are protected:
   - Card A: Cinematic Full-Bleed
   - Card B: Editorial Split
   - Card C: Compact Atmospheric
   - Card D: Vertical Immersive
   - Card E: Layered Editorial
   - Card F: Minimal Signal
3. Card A is `k-card--cinematic`: 3/2 ratio, full image surface, text embedded in the photo, bottom gradient around 85%, and a magazine/movie-still feeling.
4. Card D is `k-card--immersive`: 9/16 ratio, max height around 640px, signature vertical presence, heavy bottom gradient, and gold accent line.
5. Card E is `k-card--layered`: 3/4 ratio, radial vignette, frosted bottom-left asymmetric panel, strong blur, and caption embedded in photo.
6. Cards must not begin from a generic white-box or SaaS-card pattern.
7. The image is the emotional surface of every primary card.
8. Gradients exist to protect text while preserving mood.
9. Bookmark affordances are quiet and proximity-revealed.
10. Tags are whispered metadata, not colorful filter badges.
11. Hover behavior is a minimal cinematic lift or scale, not bouncy or playful motion.
12. Card variants create rhythm by alternating scale, shape, density, silence, and image dominance.
13. Uniformity across all venue cards weakens the original system.

## 4. Motion Laws

1. Motion is cinematic and slow.
2. Canonical duration families include 600ms, 800ms, 1000ms, 1200ms, and 1400ms.
3. Canonical easing is `cubic-bezier(0.22, 0.61, 0.36, 1)`.
4. The shell transition uses fade-through-black as a cinematic page behavior.
5. Card-to-venue transition uses FLIP clone choreography.
6. Scroll behavior is atmospheric: search header compression, card dimming on high scroll velocity, image parallax, and progressive reveal.
7. Reveal patterns use slow upward drift: opacity from 0, translateY around 28px, and entry over roughly 1.4s.
8. Tags stagger into view one by one.
9. Motion should feel like film pacing, not interface animation for its own sake.

## 5. Layout Laws

1. The original system is mobile-editorial first, with a canonical feed width around 428px.
2. Discovery is a vertical curated sequence, not a uniform grid.
3. Feed rhythm uses alternating pacing categories: tight, breathe, and isolated.
4. The spacing system follows an 8px rhythm, from micro spacing around 2px through large atmospheric spacing around 128px.
5. Feed pacing must alternate compression and silence.
6. Venue detail uses large vertical silence, including spacing blocks around 120px, 160px, 180px, and immersive 70vh/100vh sections.
7. Bottom navigation is a luxury HUD: icon-only, blurred, quiet, and bottom-centered.
8. Utility information is discovered late, after emotional content establishes venue atmosphere.
9. Layout should preserve visual pacing before maximizing visible information.

## 6. Image Treatment Laws

1. Images are film-graded: brightness is reduced, contrast is increased, and saturation is restrained.
2. Warm-black tonal overlays unify the image system.
3. Film grain is part of the image system.
4. Gradients are deep and layered; immersive cards use bottom fades and top vignettes.
5. Mood is prioritized over literal clarity.
6. "Atmosphere > clarity. Mood > detail." is a canonical image principle.
7. Venue detail hero imagery is immersive, full-height, oversized, and supports parallax.
8. Images should carry emotional information before factual information.

## 7. Atmosphere Laws

1. Atmosphere is produced by darkness plus detail.
2. The UI must use gradients, vignettes, image darkening, soft grain, warm overlays, and low-opacity borders as part of its identity system.
3. Korantis feels cinematic through dark full-bleed imagery, deep gradients, warm-black surfaces, grain, slow reveal, vertical silence, typography over image, and card-to-venue choreography.
4. Korantis feels editorial through serif headlines, quiet metadata, magazine captions, asymmetrical glass panels, restrained tags, curated feed rhythm, and mood language.
5. Consumer discovery must remain low-density.
6. Admin and debug surfaces must not leak into the consumer aesthetic.
7. Atmosphere systems are not decorative extras; they are part of product meaning.

## 8. Forbidden Changes

- Do not replace the warm-black palette with neutral or cold dark palettes.
- Do not use pure white as the default text color.
- Do not promote champagne gold into a dominant filled surface color.
- Do not remove the Cormorant Garamond and DM Sans pairing.
- Do not alter canonical card ratios without architectural review.
- Do not make venue cards uniform.
- Do not remove image grading, grain, gradients, or vignettes from cinematic cards.
- Do not replace whispered metadata with colorful SaaS chips.
- Do not make motion fast, bouncy, or generic.
- Do not remove feed rhythm categories.
- Do not convert discovery into a dashboard grid.
- Do not reduce venue detail to compact utility cards as the primary experience.
- Do not expose debug or admin aesthetic patterns in the consumer UI.
- Do not let implementation convenience override the card system.
- Do not treat atmosphere as optional decoration.
