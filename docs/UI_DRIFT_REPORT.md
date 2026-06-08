# Korantis UI Drift Report

## Compared Sources

Original:
- [CLAUDE_ORIGINAL_UI/app.html](F:/KORANTIS/CLAUDE_ORIGINAL_UI/app.html)
- [CLAUDE_ORIGINAL_UI/search.html](F:/KORANTIS/CLAUDE_ORIGINAL_UI/search.html)
- [CLAUDE_ORIGINAL_UI/venue.html](F:/KORANTIS/CLAUDE_ORIGINAL_UI/venue.html)
- [CLAUDE_ORIGINAL_UI/indexdemocards.html](F:/KORANTIS/CLAUDE_ORIGINAL_UI/indexdemocards.html)
- [CLAUDE_ORIGINAL_UI/homeresume.png](F:/KORANTIS/CLAUDE_ORIGINAL_UI/homeresume.png)
- [CLAUDE_ORIGINAL_UI/brandingpro.png](F:/KORANTIS/CLAUDE_ORIGINAL_UI/brandingpro.png)

Current:
- [src/app/page.tsx](F:/KORANTIS/korantis-app/src/app/page.tsx)
- [src/app/globals.css](F:/KORANTIS/korantis-app/src/app/globals.css)
- [VenueCard.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueCard.tsx)
- [VenueDetail.tsx](F:/KORANTIS/korantis-app/src/app/components/VenueDetail.tsx)
- [SearchBar.tsx](F:/KORANTIS/korantis-app/src/app/components/SearchBar.tsx)
- [GlobalNav.tsx](F:/KORANTIS/korantis-app/src/app/components/GlobalNav.tsx)
- [MapExplorer.tsx](F:/KORANTIS/korantis-app/src/app/components/MapExplorer.tsx)

## A. Preserved Elements

1. Core color identity
   Current app preserves warm black, cream text, champagne gold, muted gold, elevated surfaces, and warm borders.

2. Font pairing
   Current app still uses Cormorant Garamond and DM Sans through Next font loading.

3. Four main card names
   Current `VenueCard` preserves `immersive`, `cinematic`, `layered`, and `compact`.

4. Feed rhythm metadata
   Current venue data still includes `tight`, `breathe`, and `isolated`.

5. Global ambient system
   Current layout keeps `.k-circadian-ambient` and `.k-circadian-grain`.

6. Bottom floating nav
   Current `GlobalNav` preserves the bottom-centered blurred navigation idea, now with icon plus text labels.

7. Venue detail concept
   Current detail page keeps hero image, narrative, tags, time blocks, gallery, and utility information.

8. Taste profile concept
   Current app preserves taste/radar/profile as a product idea.

9. Saved atlas concept
   Current app preserves collections and saved places.

## B. Degraded Elements

1. Card A geometry changed.
   Original cinematic card is `3 / 2`. Current cinematic card is `16 / 9`, which makes it feel more video-thumbnail and less magazine-cover.

2. Card D geometry changed.
   Original immersive card is `9 / 16` with `max-height: 640px`. Current immersive card is `h-[75vh] max-w-md`, changing the precise story-like portrait object into viewport-relative UI.

3. Card E geometry changed.
   Original layered card is `3 / 4`. Current layered card is `aspect-square`, making it less editorial and less portrait-like.

4. Compact card changed.
   Original compact uses a `16 / 9` image and denser browse information. Current compact card is `aspect-[4/5]` overall with an image ratio of `4/3`, making it taller and less compact.

5. Image treatment weakened.
   Original CSS applies brightness/contrast/saturation filters, warm tonal pseudo-overlays, card grain, vignettes, and precise gradients. Current images rely mostly on opacity and Tailwind gradients.

6. Bookmark behavior became more visible and conventional.
   Original bookmarks are quiet and appear by proximity. Current bookmarks are generally visible as standard icon buttons.

7. Layered panel became more generic.
   Original panel is bottom-left, asymmetrical, transparent black `0.42`, blur `40px`, with extremely light borders. Current panel is centered by margin, denser, more rectangular, and heavier.

8. Search header lost sticky cinematic behavior.
   Original search header is fixed, compresses, blurs, and responds to scroll. Current `SearchBar` is a static block in normal page flow.

9. Motion became simpler.
   Original uses FLIP clone expansion, fade-through-black, scroll velocity awareness, reveal observer, tag stagger, and parallax. Current uses Framer crossfade, shared `layoutId`, layout spring, and hover scales.

10. Venue detail became less immersive.
   Original hero is `100vh`. Current hero is `52vh` mobile and `75vh` desktop, reducing cinematic arrival.

11. Venue detail sections became denser.
   Original detail uses large vertical silence and `70vh` time-shift blocks. Current time shifts are compact grid cards.

12. Gallery changed from tactile horizontal scroll to grid.
   Original venue gallery is oversized horizontal scroll with peeking items. Current gallery is a three-column grid.

13. Consumer UI moved wider.
   Original discovery is mobile-editorial with max width `428px`. Current search layout uses `max-w-4xl`, making the surface more web-app-like.

14. Root design laws became utility strings.
   Original system codifies card rules in CSS classes. Current implementation embeds many visual decisions directly in JSX utility classes.

## C. Lost Elements

1. Fade-through-black view choreography.
2. FLIP image clone transition from card to venue.
3. Fixed compressing search header.
4. Scroll velocity dimming / interaction pause.
5. Tag stagger reveal.
6. Card-level film grain overlays.
7. Warm-black tonal image overlay pseudo-elements.
8. Top vignette on immersive cards.
9. Original exact card aspect ratios.
10. Original venue `100vh` hero.
11. Original scroll-linked time-shift immersion.
12. Original oversized horizontal tactile gallery.
13. Original “similar atmospheres” section in venue detail.
14. Original icon-only luxury HUD nav.
15. Original map toggle as a quiet floating secondary action.

## D. Replaced Elements

1. Static CSS architecture was replaced by Tailwind utility composition.
2. Vanilla JS choreographies were replaced by Framer Motion.
3. Fixed search header was replaced by a centered prompt/search module.
4. Floating map button was replaced by a segmented feed/map toggle.
5. Icon-only bottom nav was replaced by icon-plus-label nav.
6. Root shell views were replaced by React conditional rendering.
7. Local card DOM classes were replaced by `VenueCard` switch branches.
8. Static taste/profile HTML was replaced by live `CircadianContext` state and canvas radar.

## E. New Elements That Improve The Product

1. Live Supabase-backed venue loading.
2. Auth-aware profile and saved venues.
3. Real saved/unsaved behavior.
4. Circadian state tied to current time.
5. User taste drift and identity vectors.
6. Feed ranking by circadian, taste, intent, quality, novelty, and memory.
7. Mapbox spatial atlas.
8. Language toggle.
9. City toggle.
10. Admin semantic inspection surface.
11. Debug HUD for taste/circadian state.
12. Dynamic saved collection counts.

## F. New Elements That Damage The Original Identity

1. Segmented control above the feed.
   It reads more like app UI than cinematic discovery.

2. Over-wide desktop feed.
   `max-w-4xl` weakens the original intimate mobile-editorial composition.

3. Utility-card time blocks in venue detail.
   They replace the original immersive scroll narrative with compact dashboard-like panels.

4. Visible debug/admin concepts near consumer architecture.
   Debug logic exists inside product components and can visually intrude.

5. More conventional controls.
   City/language pills, segmented toggle, and labeled nav increase product utility but reduce mystery.

6. Loss of precise CSS-authored card laws.
   The aesthetic now depends on component authors remembering the rules.

## What Changed

- Original UI was CSS-law driven; current UI is component-utility driven.
- Original motion was choreographic; current motion is transitional.
- Original feed was mobile-editorial; current feed is responsive app layout.
- Original cards were protected visual artifacts; current cards are React variants with approximate styling.
- Original venue detail was immersive and scroll-cinematic; current detail is more structured and informational.
- Original search header behaved like a cinematic instrument panel; current search behaves like a page section.

## What Was Lost

The most important loss is not a single color or component. It is the loss of enforced atmosphere.

Original Korantis had rules encoded in named CSS systems:
- image grading
- card aspect ratios
- feed rhythm
- slow reveal
- view choreography
- detail-page vertical silence

The current app preserves the theme but not the same degree of visual enforcement.

## What Should Be Restored

1. Restore original card aspect ratios.
2. Restore film-grade image treatment.
3. Restore card grain/vignette overlays.
4. Restore original layered-card asymmetry and transparency.
5. Restore venue detail full-height hero behavior.
6. Restore tactile horizontal venue gallery.
7. Restore time-shift sections as immersive scroll blocks.
8. Restore sticky/compressing search header or equivalent cinematic behavior.
9. Restore fade-through-black or comparable cinematic view transition.
10. Restore design laws as shared canonical classes/tokens, not scattered utilities.

## Restoration Priority Ranking

### Priority 1: Identity-Critical

1. Card aspect ratios and composition
   The card system is the atomic identity of Korantis.

2. Image treatment
   Without grading, vignettes, grain, and deep gradients, the UI becomes ordinary dark mode.

3. Feed rhythm
   Tight/breathe/isolated spacing must feel editorial, not merely margin variation.

4. Venue detail hero
   The original `100vh` arrival is central to cinematic immersion.

5. Design law centralization
   Visual rules need to exist as canonical design-system primitives.

### Priority 2: Cinematic Motion

1. Card-to-venue transition choreography.
2. Fade-through-black shell transition.
3. Slow reveal and tag stagger.
4. Scroll-linked parallax and atmosphere shifts.
5. Sticky search header compression.

### Priority 3: Product Surface Refinement

1. Reconsider segmented feed/map toggle visual prominence.
2. Keep city/language controls quieter.
3. Keep debug/admin UI visually separated from consumer surfaces.
4. Reconcile bottom nav with original icon-only HUD restraint.
5. Reintroduce similar atmospheres in detail page.

## Final Finding

The current Next.js implementation is not a visual failure. It preserves the broad Korantis identity: dark luxury, gold accents, serif typography, image-led venues, atmospheric language.

But it is drifting from the original Claude-generated visual system. The original system was more cinematic, more editorial, more mobile-intimate, and more strongly governed by named visual laws. The current app is more functional and product-complete, but it has become more conventional.

No files were modified.
