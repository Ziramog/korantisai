# Korantis — Phase 4 Task Tracker

Track the evolution of the Korantis platform into a persistent, cloud-synced psychogeographic engine.

---

## [/] Phase 4A: Identity Layer
- [x] Install `@supabase/ssr` for secure cookie-based auth.
- [x] Create SQL schemas for `profiles` (`identity_centroid`, `current_drift`, `identity_plasticity`).
- [x] Create SQL schemas for `venue_interactions` (`saved`, `visited`, `resonated`, `discovered`, `ignored`).
- [x] Implement Magic Link login flow in `GlobalNav` / `Profile` tab.
- [x] Refactor `CircadianContext` to hydrate vectors from Supabase on successful auth instead of `localStorage`.
- [x] Sync `recordClick`, `recordDwell`, and `toggleSaveVenue` to push updates to Supabase asynchronously.

## [x] Phase 4B: Geospatial Layer
- [x] Install `mapbox-gl` and `react-map-gl`.
- [x] Refactor `<MapExplorer />` (currently a placeholder) to render a Mapbox canvas.
- [x] Apply a dark, atmospheric Mapbox style (e.g., Mapbox Dark).
- [x] Render breathing markers for top-ranked venues based on the Hybrid Rank equation.
- [x] Ensure Map Explorer triggers the same interaction telemetry (clicks) as the list feed.
- [ ] Compute Spatial Context ($S_p$) bounding queries.

## [x] Phase 4C: Admin Engine
- [x] Build `/admin` protected route.
- [x] Implement UI for human-guided atmospheric seeding (prior vector injection) via Supabase `venue_priors`.
- [x] Wire the Admin Engine priors into the Hybrid Rank equation so they heavily bias the venue's overall vector.
