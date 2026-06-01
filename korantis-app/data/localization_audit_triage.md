# Localization Audit Triage

Generated: 2026-06-01

## real_user_facing

- `src/app/components/AtmosphereDebug.tsx`: `Reset latent taste profile`, `Baseline profile`, `Transient profile`. Debug-only HUD, but still visible when enabled.
- `src/app/components/HeaderControls.tsx`: dropdown glyph/interaction label has no localized accessible label. City names are proper nouns and should stay unchanged.
- `src/app/components/map/SpatialAtlas.tsx`: fallback literals still present in `||` expressions, including `Your saved atmospheres and dynamic collections.`, `Dynamic Collections`, `After Midnight`, `Morning Ritual`, `Sunday Calm`, `Saved Atmospheres`, `Your atlas is empty.`, `Discover Atmospheres`.
- `src/app/page.tsx`: image alt text `Sanctuary` and `Ritual` are visible to assistive tech and should use localized labels.

## intentional_proper_noun_or_canonical

- `Buenos Aires`
- `New York`
- Venue names
- District/location strings from venue data
- Source names
- Canonical search values such as `quiet`, `warm`, `natural light`, `hidden gem`
- English canonical venue descriptions when no safe Spanish variant exists

## code_false_positive

- Import paths such as `../contexts/CircadianContext`, `./mapStyle`, `./KorantisMarker`, `./components/SearchBar`.
- TypeScript/JSX fragments captured by the current regex.
- CSS class names and CSS values.
- Animation names such as `easeOut`.
- Browser APIs such as `IntersectionObserver`.
- Dictionary keys already routed through `t(...)`, such as `searchPlaceholder`, `nearbyAtmospheres`, `hiddenSanctuary`.
- Non-user runtime values such as `Feature`, `Point`, `currentColor`, `noopener noreferrer`.
- Template math/format strings in canvas/debug internals.

## deferred_description_translation

- Venue card taglines and venue detail narratives remain English when no curated `tagline_es` or `narrative_es` exists.
- Current API/database canonical copy stays English by design.
- A future safe layer should use curated Spanish variants or a deterministic translation cache, not destructive DB overwrites.

## action_plan

- Remove fallback English literals where dictionary keys already exist.
- Localize debug-only labels when cheap and safe.
- Add accessible localized labels for city toggle and image alts.
- Improve the audit scanner to ignore imports, className/style strings, dictionary keys, `t(...)` keys, TypeScript fragments, and animation/API internals.
