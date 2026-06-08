# Korantis Pipeline Architecture v1

Date: 2026-06-08

Scope: venue discovery, enrichment, image selection, editorial generation, quality gating, Cloudinary materialization, Supabase staging/public projection, activation, and the local control center.

This document is written as an audit handoff. It should be readable without prior chat context.

## Executive Summary

Korantis now has a local batch pipeline that can discover venues, enrich them with Google Places data, find and classify images, generate editorial fields, run deterministic quality gates, upload selected hero images to Cloudinary, write approved venues to public tables as hidden `pending_review` rows, and activate reviewed venues into production.

The pipeline is intentionally staged. Expensive or risky actions are separated from deterministic preparation:

- Discovery and scoring happen before any vision/text model spend.
- M3 vision only sees prefiltered image candidates.
- Editorial generation happens after a usable hero image is attached.
- Public database writes happen only after manual review.
- Public visibility happens only after a separate activation step.

The current control center runs locally at:

```text
http://localhost:4317
```

It exposes whitelisted actions, embedded command output, batch status, reports, manual documentation, and a configurable new-batch form.

## Current Production Proof

Batch `batch_004_buenos_aires_50` reached production:

- Input venues: `50`
- Quality gate ready: `44`
- Manually approved: `30`
- Cloudinary hero uploads: `30`
- Public rows projected: `30`
- Public rows activated: `30`

This confirms the end-to-end path works, but the system still needs product hardening before operating as a fully mature internal tool.

## Core Pipeline Philosophy

Korantis is not trying to ingest every venue. It is trying to find places with enough evidence, atmosphere, image quality, geographic precision, and editorial fit to become useful curated recommendations.

The system is built around four constraints:

- Avoid duplicates before spending API/model budget.
- Prefer venues with strong spatial/atmospheric image potential.
- Keep publication behind explicit human review.
- Preserve traceability for every selected image and venue field.

## High-Level Flow

```text
Stage 00 candidate detection
  -> Stage 01 Google Places extraction
  -> Stage 02 source discovery
  -> Stage 03 image discovery preflight
  -> Stage 04 MiniMax-M3 vision classification
  -> connect selected images into VenueComplete
  -> Stage 05 MiniMax-M2.7 editorial generation
  -> Stage 05B retry invalid editorial JSON
  -> Stage 06 deterministic quality gate
  -> Stage 07 approval manifest
  -> Stage 08 Supabase staging sync/dry-run/apply
  -> Stage 09 publication review dashboard
  -> Stage 10 Cloudinary materialization
  -> Stage 11 public projection as pending_review
  -> Stage 12 public activation
  -> Stage 13 control panel
```

## Data Collected

### Venue Identity

Collected primarily from Google Places:

- Venue name
- Google place id
- Address
- Neighborhood hint
- City
- Latitude/longitude
- Google Maps URL
- Place types
- Business status
- Website
- Phone
- Opening hours
- Rating
- User ratings total
- Price level when available
- Raw Google response snapshot

### Source Signals

Collected from Stage 02 and Stage 03:

- Official website URL
- Instagram URL when detectable
- Menu URL when detectable
- Reservation URL when detectable
- Official website HTML image candidates
- Open Graph image candidates
- Google Places photo candidates

The pipeline does not currently scrape Instagram post images, TripAdvisor, or random Google Images.

### Image Metadata

Collected before vision:

- `source_url`
- `resolved_image_url`
- `original_image_url`
- `source_type`
- `rights_hint`
- `rights_risk`
- Width
- Height
- Content type
- Content length
- SHA-256 when bytes are downloaded
- Alt text
- Source page context
- Risk flags

### Vision Classification

MiniMax-M3 classifies accepted image candidates into:

- `hero_interior`
- `gallery_atmosphere`
- `hero_exterior`
- `product_food`
- `logo`
- `menu`
- `crowd`
- `decorative`
- `unusable`

It also returns:

- Whether the image shows the venue space
- Whether it is hero usable
- Whether it is product-only
- Whether it has identifiable faces
- Quality level
- Atmosphere signal
- Visual reason

### Editorial Data

MiniMax-M2.7 generates:

- Tagline
- Short description
- Mood tags
- Moments
- Best-for labels
- Not-for labels
- Primary atmosphere
- Evidence confidence
- Mood confidence
- Editorial notes
- Grounded description

The prompt requires grounded data only. It must not invent awards, exact menu items, prices, or booking policies unless those fields exist in source data.

## Stage 00 Candidate Selection

Stage 00 is the start of the machine.

Script:

```text
pipeline/stages/00_build_venue_seed.ts
```

Inputs:

- Arbitrary `batch_id`
- Target count
- City
- Neighborhood list
- Type mix

Example:

```powershell
npx tsx pipeline/stages/00_build_venue_seed.ts batch_005_buenos_aires_restaurants_50 --count 50 --city "Buenos Aires" --neighborhoods "Palermo,Recoleta,Chacarita,Villa Crespo,Colegiales,Belgrano,San Telmo,Almagro,Retiro,Puerto Madero" --type-mix "restaurants=50" --continue
```

### Duplicate Checks

Before final selection, Stage 00 checks known venues from:

- Supabase `staging_venues` when readable
- Supabase `venues` when readable
- Previous `data/batches/*/venue_seed.json`
- Previous `stage_01_raw_venues.json`
- Previous `batch_result_with_editorial.json`
- Previous `batch_result_quality_gated.json`

It excludes candidates by:

- Exact place id
- Normalized name + neighborhood
- Normalized name + city
- Known alias when available

If Supabase read access is unavailable, it falls back to local files and reports the skipped DB check.

### Candidate Score Formula

Stage 00 ranks candidates with:

```text
candidate_score =
  google_presence_score * 0.20 +
  review_volume_score * 0.15 +
  visual_strength_score * 0.20 +
  category_fit_score * 0.15 +
  neighborhood_balance_score * 0.10 +
  atmosphere_potential_score * 0.15 +
  source_diversity_score * 0.05
```

Interpretation:

- `google_presence_score`: match quality, place id, address, coordinates, website, status.
- `review_volume_score`: enough review volume for evidence.
- `visual_strength_score`: photo count and photo dimensions.
- `category_fit_score`: restaurant, bistro, bar, cocktail bar, wine bar, cafe, parrilla, etc.
- `neighborhood_balance_score`: avoids over-selecting one neighborhood.
- `atmosphere_potential_score`: terms and signals like bistro, terraza, wine, salon, rooftop, club, hidden, garden, casa.
- `source_diversity_score`: more source signals improve confidence.

### Hard Rejections

Stage 00 rejects:

- Existing venues
- Obvious chains/franchises
- Irrelevant Google categories
- Closed/non-operational venues
- Candidates without review evidence
- Candidates without photo signal
- Low-evidence candidates
- Duplicates inside the current candidate pool

## Stage 01 Google Places Extraction

Script:

```text
pipeline/stages/01_extract_data.ts
```

Utility:

```text
pipeline/utils/google_places.ts
```

Env:

```text
GOOGLE_PLACES_API_KEY
```

Stage 01 takes venue names and hints from `pipeline/input/<batch_id>.json`, searches Google Places, selects the best match, and writes:

```text
data/batches/<batch_id>/stage_01_raw_venues.json
data/batches/<batch_id>/stage_01_report.md
```

It preserves original hints and does not abort the whole batch if one venue fails.

## Stage 02 Source Discovery

Script:

```text
pipeline/stages/02_discover_sources.ts
```

Stage 02 is currently report-oriented. It fetches simple official website data when available and records contact/source links such as:

- Website
- Instagram
- Menu
- Reservation

It does not scrape social media content.

## Stage 03 Image Discovery Preflight

Script:

```text
pipeline/stages/03_discover_images.ts
```

Utilities:

```text
pipeline/utils/image_downloader.ts
pipeline/validation/image_validator.ts
```

Input:

```text
stage_01_raw_venues.json
```

Outputs:

```text
stage_03_image_candidates.json
stage_03_final_vision_queue.json
stage_03_report.md
```

Sources:

- Google Places photos
- Official website `og:image`
- Large official website images visible in simple HTML

Rejected before M3:

- SVG
- GIF
- AVIF
- BMP
- Non-image content
- Unsupported content type
- Max dimension below 512
- Logos
- Icons
- Menus
- Payment assets
- Maps
- Known thumbnails
- Duplicate URLs
- Duplicate SHA-256
- Product-food-heavy candidates when spatial alternatives exist

Marked:

- `below_preferred_resolution` for max dimension 512-1023
- `preferred_resolution` for max dimension >= 1024
- `rights_review_needed` when source is not venue-controlled
- `source_trust_only` when bytes cannot be downloaded but source seems plausible

## Stage 04 MiniMax-M3 Vision

Script:

```text
pipeline/stages/04_classify_images.ts
```

Utility:

```text
pipeline/utils/minimax_m3_vision.ts
```

Env:

```text
MINIMAX_API_KEY
MINIMAX_BASE_URL
MINIMAX_M3_MODEL
```

Stage 04 downloads real image bytes, sends them to MiniMax-M3, requires JSON output, and writes:

```text
stage_04_vision_results.json
stage_04_selected_images.json
stage_04_report.md
```

Selection priority:

1. `hero_interior`
2. `gallery_atmosphere`
3. `hero_exterior`

Rejected as hero:

- `product_food`
- `logo`
- `menu`
- `decorative`
- `crowd`
- `unusable`

Preferred:

- >= 1024 max dimension
- No identifiable faces
- Good quality
- Spatial/interior/atmosphere content

No image is approved for publication by M3. M3 only classifies suitability.

## Selected Image Connector

Script:

```text
pipeline/stages/connect_selected_images.ts
```

This maps Stage 04 selected images into `VenueComplete.hero_image` and reruns scoring. It preserves:

- Source URL
- Resolved image URL
- Width/height
- Source type
- Risk flags
- Model used
- Vision fields
- Validation status
- Publication status

## Stage 05 Editorial Generation

Script:

```text
pipeline/stages/05_generate_editorial.ts
```

Utility:

```text
pipeline/utils/minimax_text.ts
```

Env:

```text
MINIMAX_API_KEY
MINIMAX_BASE_URL
MINIMAX_TEXT_MODEL
```

Uses MiniMax-M2.7 to generate editorial fields from grounded evidence:

- Venue name
- Type/category
- Neighborhood/address
- Rating/review count
- Website/phone/hours
- Stage 04 vision fields

It outputs strict JSON. Invalid JSON is recorded and retried only by Stage 05B.

## Stage 05B Editorial Retry

Script:

```text
pipeline/stages/05b_retry_failed_editorial.ts
```

Only retries failed or invalid editorial outputs. It does not rerun successful venues.

## Stage 06 Quality Gate

Script:

```text
pipeline/stages/06_quality_gate.ts
```

Deterministic local gate. No model calls.

A venue can become `ready_for_db_staging` only if:

- Has coordinates
- Has address
- Has Google Maps URL
- Has neighborhood
- Has type
- Is operational
- Has hero image
- Hero image passes quality checks
- Has tagline
- Has description
- Has at least two mood tags
- Evidence confidence passes threshold
- No hard blockers remain

Known blockers include:

- `missing_coordinates`
- `missing_address`
- `missing_google_maps_url`
- `missing_neighborhood`
- `venue_not_operational`
- `no_hero_image`
- `hero_does_not_show_space`
- `hero_not_usable`
- `missing_or_short_tagline`
- `missing_description`
- `fewer_than_two_mood_tags`
- `evidence_confidence_below_minimum`

Important: a venue without geo should not pass the quality gate.

## Stage 07 Approval Manifest

Script:

```text
pipeline/stages/07_generate_approval_manifest.ts
```

Separates ready venues from blocked venues. This is still not public publication.

## Stage 08 Supabase Staging Sync

Script:

```text
pipeline/stages/08_sync_supabase_staging.ts
```

Default behavior is dry-run.

Apply requires explicit:

```powershell
--apply
```

It writes approved staging-ready venues into staging-compatible tables, not public consumer publication.

Target tables:

- `staging_venues`
- `venue_images`
- `quality_scores`

It skips `venue_atmosphere` for apply because it references public venues.

## Stage 09 Publication Review

Script:

```text
pipeline/stages/09_generate_publication_review.ts
```

Outputs:

```text
publication_review_dashboard.html
publication_decision_manifest.json
publication_review_report.md
```

The dashboard defaults all venues to `pause`. Human reviewer decides:

- `approve`
- `reject`
- `pause`

The reviewed manifest must be saved as:

```text
publication_decision_manifest.reviewed.json
```

## Stage 10 Cloudinary Materialization

Script:

```text
pipeline/stages/10_materialize_cloudinary.ts
```

Uploads approved hero images to Cloudinary.

Outputs:

```text
cloudinary_materialization_result.json
cloudinary_materialization_report.md
cloudinary_public_assets.json
```

The public path now prefers Cloudinary `secure_url`.

## Stage 11 Public Projection

Script:

```text
pipeline/stages/11_project_to_public.ts
```

Dry-run:

```powershell
npx tsx pipeline/stages/11_project_to_public.ts <batch_id> --dry-run
```

Apply:

```powershell
npx tsx pipeline/stages/11_project_to_public.ts <batch_id> --apply
```

Writes approved venues into public tables as:

```text
curation_status = pending_review
```

This means rows exist in public tables but remain hidden from the consumer API.

Target public tables:

- `venues`
- `venue_images`

Stage 11 requires Cloudinary hero URLs for apply.

## Stage 12 Public Activation

Script:

```text
pipeline/stages/12_activate_public_venues.ts
```

Dry-run:

```powershell
npx tsx pipeline/stages/12_activate_public_venues.ts <batch_id> --dry-run
```

Apply:

```powershell
npx tsx pipeline/stages/12_activate_public_venues.ts <batch_id> --apply
```

Activation flips:

```text
pending_review -> active
```

This is the final live-publication step.

## Stage 13 Control Panel

Script:

```text
pipeline/stages/13_generate_control_panel.ts
```

Creates a static control panel snapshot. The newer local command center is more useful for operation.

## Local Command Center

Script:

```text
pipeline/control_center_server.ts
```

URL:

```text
http://localhost:4317
```

Features:

- Batch selector
- Prioritized batch ordering by operational progress
- Live batch status
- Artifact viewer for HTML, Markdown, and JSON
- Embedded console
- Whitelisted pipeline actions
- New batch form
- Manual viewer
- Confirmation requirement for write/public actions

New batch form fields:

- Batch id
- City
- Count
- Neighborhoods
- Type mix

Type mix examples:

```text
restaurants=50
```

```text
cafes=15,restaurants=15,bars=10,cocktails=5,wine=5
```

```text
restaurants=20,parrilla=10,bistro=10,wine=5,cocktails=5
```

The current command center is local only. It uses Node HTTP and `spawn` to run whitelisted commands.

## Supabase Schema Assumptions

Public `venues` must support:

- `id`
- `name`
- `city`
- `category`
- `location`
- `coordinates`
- `card_size`
- `spacing`
- `hero_image`
- `atmosphere`
- `quality`
- `tagline`
- `narrative`
- `tags`
- `curation_status`
- `taste_vector`
- `publication_metadata`

Public `venue_images` must support:

- `id`
- `venue_id`
- `photo_reference`
- `google_photo_reference`
- `width`
- `height`
- `is_cover`
- `role`
- `sort_order`
- `url`
- `secure_url`
- `public_id`
- `source`
- `status`
- `rights_status`
- `is_selected_hero`
- `selection_data`

The bridge migration added:

```text
supabase/migrations/07_public_publication_gate.sql
```

## Image Rights And Source Traceability

Current source reality:

- Most hero images come from Google Places.
- Some images may come from official websites.
- Selected images are uploaded to Cloudinary.
- Image rights are not treated as owned.
- `rights_status` preserves source risk and attribution requirements.

For Google Places images, current status is:

```text
google_places_sourced_attribution_required
```

This should be reviewed legally/product-wise before scaling beyond MVP.

## Current Safety Controls

- Stage 08 is dry-run by default.
- Stage 10 Cloudinary upload requires explicit apply.
- Stage 11 public projection requires explicit apply and writes `pending_review`.
- Stage 12 activation requires explicit apply.
- Command center uses whitelisted actions only.
- Dangerous actions require typing `RUN`.
- Publication review defaults to pause.
- Quality gate blocks missing geo, missing hero, weak editorial, and low evidence.

## Known Weaknesses

### Control Center UX

The command center is functional but still early:

- It is a local Node server, not a full authenticated admin app.
- It does not persist user preferences.
- It does not yet display venue cards inline from the publication review manifest.
- It does not yet show per-venue state transitions in a timeline.
- It does not yet support editing `publication_decision_manifest.reviewed.json` directly.

### Candidate Selection

Stage 00 is heuristic and Google Places biased:

- It may miss venues with weak Google presence but high Korantis fit.
- It relies heavily on review count and photo count.
- Atmosphere scoring is term-based, not semantic.
- Neighborhood weighting is basic.
- Type mix is user-provided and can be too narrow.

### Image Discovery

Stage 03 is conservative and shallow:

- Official website image extraction is simple HTML parsing.
- It does not crawl deeper gallery pages unless exposed.
- It does not use editorial source pages yet.
- It does not use city tourism or press/media sources deeply.

### Vision And Editorial Cost

M3 and M2.7 calls happen per candidate/image/venue. The pipeline has resume/progress support, but larger batches need stronger cost and rate-limit controls.

### Publication Review

Manual review still requires exporting or maintaining a reviewed manifest file. The control center should eventually edit and persist decisions directly.

### Geo Integrity

Quality gate should block missing coordinates. If a venue without geo appears in production, that is a bug in projection, schema serialization, or an older batch path. Add a production read-back audit after activation.

## Recommended Improvements

### Priority 1: Operator UX

- Add a venue-card review view inside the command center.
- Let reviewer approve/reject/pause directly from the control center.
- Save reviewed manifest via local API.
- Show stage timeline per venue.
- Add explicit status badges: seed, extracted, image_ready, editorial_ready, quality_ready, reviewed, cloudinary_uploaded, projected, active.

### Priority 2: Production Safety

- Add post-activation read-back audit:
  - every active venue has coordinates
  - every active venue has Cloudinary hero
  - every active venue has narrative/tagline/tags
  - no active venue has blocker flags
- Add rollback command:
  - `active -> pending_review`
  - optionally deactivate by batch id
- Add duplicate check against public active rows before Stage 11 apply.

### Priority 3: Better Discovery

- Add curated source search:
  - local editorial reviews
  - official gallery pages
  - press/media pages
  - tourism/city guides
- Add semantic Korantis-fit scoring from textual evidence.
- Add a source reliability score.
- Improve type mix into presets:
  - restaurants
  - cafes
  - cocktail/wine
  - mixed atmospheric
  - neighborhoods expansion

### Priority 4: Image Pipeline

- Upload more than one image per approved venue:
  - hero
  - card
  - gallery
- Use Cloudinary transformations for consistent aspect ratios.
- Store attribution metadata in a structured table or JSONB field.
- Add broken-image monitor.

### Priority 5: Cost And Reliability

- Add batch-level budget caps:
  - max M3 images
  - max M2.7 calls
  - max Cloudinary uploads
- Add retry policies with exponential backoff.
- Add rate-limit dashboard indicators.
- Add resumable checkpoints for every stage.

### Priority 6: Admin Productization

- Move local command center into an authenticated internal admin route or standalone internal app.
- Add user roles:
  - operator
  - reviewer
  - publisher
- Add audit log for every decision and activation.
- Add batch comparison across cities/neighborhoods.

## Questions For Claude 4.6 Review

1. Is the Stage 00 scoring formula aligned with Korantis product goals?
2. What signals are over-weighted or under-weighted?
3. Should Google Places images be acceptable for MVP publication after Cloudinary materialization?
4. What additional rights/attribution fields should be stored?
5. Is `pending_review -> active` sufficient as the publication gate?
6. What are the highest-risk failure modes before scaling to hundreds of venues?
7. Should the control center remain local or move into an authenticated admin app?
8. What schema changes would make publication and rollback safer?
9. How should the review dashboard evolve to reduce operator error?
10. How should the pipeline choose better venues when Google evidence is weak?

## Key Files

```text
pipeline/stages/00_build_venue_seed.ts
pipeline/stages/01_extract_data.ts
pipeline/stages/02_discover_sources.ts
pipeline/stages/03_discover_images.ts
pipeline/stages/04_classify_images.ts
pipeline/stages/connect_selected_images.ts
pipeline/stages/05_generate_editorial.ts
pipeline/stages/05b_retry_failed_editorial.ts
pipeline/stages/06_quality_gate.ts
pipeline/stages/07_generate_approval_manifest.ts
pipeline/stages/08_sync_supabase_staging.ts
pipeline/stages/09_generate_publication_review.ts
pipeline/stages/10_materialize_cloudinary.ts
pipeline/stages/11_project_to_public.ts
pipeline/stages/12_activate_public_venues.ts
pipeline/stages/13_generate_control_panel.ts
pipeline/control_center_server.ts
pipeline/run_full_batch.ts
pipeline/types.ts
pipeline/config.ts
```

## Bottom Line

Korantis now has a working ingestion-to-publication machine with human review and separated activation. The highest-value next work is not adding more stages; it is making the operator experience safer and clearer, improving source quality beyond Google Places, and adding post-publication auditing/rollback.
