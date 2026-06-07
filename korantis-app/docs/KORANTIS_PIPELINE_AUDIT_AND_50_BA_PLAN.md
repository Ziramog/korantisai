# Korantis Pipeline Audit and 50 Buenos Aires Plan

Generated: 2026-06-07

Scope: local pipeline audit, report-only source discovery upgrade, and 50-venue rollout plan. No UI, public projection, Cloudinary upload, production publish, or Stage 08 apply was run for this audit.

## Current Pipeline Reality

| Stage | Status | Input | Output | Source dependency | Google-only? | Current limitations | 50 BA changes needed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 Venue Seed | Exists | `pipeline/input/<batch>.json` | `stage_01_raw_venues.json`, `stage_01_report.md` | Google Places text search/details | Yes, by design | Google is canonical seed and currently the only structured venue source | Keep Google as seed; add dedupe, neighborhood coverage, and richer seed hints for 50 venues |
| 02 Source Discovery | Added, report-only | `stage_01_raw_venues.json` | `stage_02_source_discovery.json`, `stage_02_source_discovery_report.md` | Google website URL plus links found on official site | Partial | Conservative; does not run broad web search, Instagram verification, or editorial search yet | Add targeted official/Instagram/editorial search adapters and manual seed URL support |
| 03 Image Discovery Preflight | Exists | `stage_01_raw_venues.json` | `stage_03_image_candidates.json`, `stage_03_final_vision_queue.json`, `stage_03_report.md` | Google Places photos and official website image metadata | Mostly | Good pre-M3 quality gates; not yet connected to Cloudinary materialization | Preserve source trace, keep Google photo refs, add Cloudinary upload stage after approval |
| 04 M3 Vision Classification | Exists | `stage_03_final_vision_queue.json` | `stage_04_vision_results.json`, `stage_04_selected_images.json`, `stage_04_report.md` | MiniMax M3 over real image bytes | No, image source is mostly Google | Good selected hero output; does not approve publication | Keep for image suitability; do not use for source rights |
| Connector Selected Images | Exists | Stage 01 + Stage 04 | `batch_result_with_images.json`, `dashboard_with_images.html`, report | Stage 04 selected image | Mostly | Connects hero image but leaves image rights unapproved | Add MVP rights policy fields for Google-sourced images |
| 05 Editorial/Mood Generation | Exists | `batch_result_with_images.json` + grounded evidence | `batch_result_with_editorial.json`, `stage_05_editorial_results.json`, report | Google seed plus M3 image metadata | Mostly | Not enough external text evidence; currently too dependent on Google/image metadata | Feed Stage 02/03/04 evidence extraction into prompts and confidence scoring |
| 05B Editorial Retry | Exists | Stage 05 outputs | Updated Stage 05 outputs | MiniMax M2.7 for failed JSON only | Mostly | Retry-only utility | Keep for invalid JSON repair |
| 06 Quality Gate | Exists | `batch_result_with_editorial.json` | `batch_result_quality_gated.json`, `dashboard_quality_gated.html`, report | Deterministic | No | Staging readiness only; no public-readiness decision | Add source-discovery/evidence gates for 50 BA |
| 07 Approval Manifest | Exists | Quality gated result | `approval_manifest.json`, `.md`, report | Deterministic | No | Manual approval boundary only | Keep as human approval layer before Stage 08 |
| 08 Supabase Staging Sync | Exists | Approval manifest + quality gated result | Dry-run/apply reports | Supabase staging schema | No | Staging only; no Cloudinary; no `venue_atmosphere`; no public projection | Keep dry-run default; apply only after manual approval |
| 09 Editorial Review | Missing | Quality gated/staged venues | Not implemented | Local review workflow | No | No reviewer state beyond staging status | Add `ready_for_mvp`, `needs_editorial_review`, `needs_image_review`, `insufficient_sources` |
| 10 Public Projection | Missing/future | Approved staged venues | Not implemented | Public schema/API | No | Not safe to automate yet | Implement only after explicit approval |

## Current Bottleneck

The pipeline is still Google-heavy because Stage 01 is the only structured source acquisition stage, and Stage 05 editorial generation only sees Google seed fields plus M3-selected image metadata. Website and Instagram data were not previously discovered as first-class evidence, Cloudinary materialization is not wired into `pipeline/stages`, and external editorial/review evidence is not extracted into a normalized evidence layer.

The bottleneck is not Stage 08 anymore. Stage 08 can dry-run and apply to staging safely. The bottleneck is multi-source enrichment before scoring: source discovery, source fetch, evidence extraction, review/text NLP, and image materialization/source traceability.

## Stage 02 Upgrade Added

New report-only stage:

```bash
npx tsx pipeline/stages/02_discover_sources.ts batch_003_stage01_test
```

Outputs:

- `data/batches/batch_003_stage01_test/stage_02_source_discovery.json`
- `data/batches/batch_003_stage01_test/stage_02_source_discovery_report.md`

Latest test result:

- Venues processed: 5
- Websites attempted: 5
- Websites fetched: 5
- Instagram candidates: 3
- Menu candidates: 3
- Reservation candidates: 2
- WhatsApp candidates: 2
- Editorial/press mentions: 1
- Average source confidence: 0.78

Safety boundaries:

- No Supabase writes
- No Cloudinary uploads
- No external model calls
- No consumer UI changes
- Fetches only Google-seeded official websites and links found on those pages

## Existing vs Missing

Exists:

- Google Places seed extraction
- Image preflight hardening
- Real M3 image classification
- Selected hero connector
- M2.7 editorial generation and retry
- Deterministic quality gate
- Approval manifest
- Staging sync dry-run/apply with explicit safety flags
- Batch dashboards/reports

Missing or partial:

- First-class source registry for official website, Instagram, menu, reservation, WhatsApp, and editorial sources
- Source fetch stage for reusable text/metadata evidence
- Evidence extraction layer that feeds Stage 05 and Stage 06
- Review-derived atmosphere/NLP signals
- Cloudinary materialization inside the new pipeline stages
- MVP image rights policy fields in Stage 08 payloads
- Stage 09 editorial review workflow
- Stage 10 public projection workflow

## Image Pipeline Direction

Current state:

- Stage 03 discovers/probes image candidates from Google Places photos and simple official-site image metadata.
- Stage 04 uses MiniMax M3 on real image bytes and selects hero candidates.
- Stage 08 writes selected hero image rows to `venue_images` with selection data and `rights_status`.
- Cloudinary upload exists in older scripts such as `scripts/enrichment/6_materialize_candidate_images_to_cloudinary.ts` and `scripts/images/2_materialize_google_place_images_to_cloudinary.ts`, but it is not wired into `pipeline/stages`.

Detected image/storage schema:

- `venue_images` has `url`, `photo_reference`, `google_photo_reference`, `source`, `selection_data`, `rights_status`, `is_selected_hero`.
- Existing Cloudinary migration support includes `secure_url` and `public_id` in `supabase/07_cloudinary_image_materialization.sql`, but Stage 08 currently maps only staging-compatible selected-image references.

MVP image policy:

- Google Places images may be used for MVP if source traceability is preserved.
- Do not mark Google images as owned or licensed.
- Do not block MVP solely because an image came from Google.
- Use `rights_status = google_places_sourced` for Google-sourced images once the pipeline type/status constants are updated.
- Use `publication_mode = mvp_public` only after explicit approval and Cloudinary materialization.
- Preserve `source_trace` with venue id, batch id, source, original reference, Google photo reference, and upload timestamp.

Next image milestone:

1. Google Places selected hero candidate
2. Cloudinary dry-run preflight
3. Cloudinary upload after explicit approval
4. Preserve `source_trace`
5. Upsert `venue_images` with `cloudinary_url`/`secure_url`, `public_id`, original Google reference, `rights_status = google_places_sourced`
6. UI consumes Cloudinary URL only after public projection approval

## 50 Buenos Aires Rollout Plan

Batch id: `batch_004_buenos_aires_50`

Neighborhood mix:

- Palermo
- Recoleta
- San Telmo
- Chacarita
- Villa Crespo
- Retiro
- Centro
- Belgrano
- Colegiales

Venue mix:

- Cafes
- Bars
- Restaurants
- Cocktail bars
- Wine bars
- Cafe-bars

Minimum data gates:

- Name
- Google `place_id`
- Address
- Coordinates
- Category
- Neighborhood
- At least 1 hero image candidate
- Review count
- Rating
- Primary atmosphere candidate
- Mood tags candidate
- Source discovery attempted
- Staging readiness status

Blockers:

- `missing_hero_image`
- `missing_coordinates`
- `duplicate_place`
- `insufficient_evidence`
- `closed_or_uncertain_status`
- `no_category_match`

Rollout sequence:

1. Create `pipeline/input/batch_004_buenos_aires_50.json` with 50 venue names, city, neighborhood hints, and optional seed URLs.
2. Run Stage 01 and inspect Google matches before any model calls.
3. Run Stage 02 source discovery and review missing official/Instagram/menu/reservation fields.
4. Add manual seed URLs for weak venues.
5. Run Stage 03 image preflight.
6. Run Stage 04 M3 only after image queue quality passes.
7. Connect selected images.
8. Run Stage 05/05B editorial after evidence extraction is wired.
9. Run Stage 06/07 deterministic gates.
10. Run Stage 08 dry-run only.
11. Request manual approval before any Stage 08 apply or Cloudinary upload.

## Next Implementation Step

Highest leverage next step: build Stage 03 Source Fetch + Stage 04 Evidence Extraction for text/source evidence, using Stage 02 discovered sources as input.

Recommended immediate command:

```bash
npx tsx pipeline/stages/02_discover_sources.ts batch_003_stage01_test
```

Then inspect:

```bash
data/batches/batch_003_stage01_test/stage_02_source_discovery_report.md
```

Recommended next coding task:

- Create `pipeline/stages/03_fetch_sources.ts` or renumber the target architecture before expanding.
- Fetch official-site text/metadata conservatively from Stage 02 sources.
- Extract menu/reservation/social/contact/evidence snippets into a normalized evidence JSON.
- Keep it dry-run/report-only until the evidence format is stable.

## Risks and Blockers

- Stage numbering is now mixed: the implemented pipeline uses Stage 03 for image discovery, while the target architecture wants Stage 03 for source fetch. Do not rename existing stages without a migration plan; add source fetch as `02b` or document a future renumber.
- Instagram should not be scraped aggressively. Treat profile URLs as source metadata unless explicit compliant fetching is approved.
- Editorial/press discovery is currently weak because Stage 02 only follows official-site links. Add targeted search/manual seed URLs next.
- Cloudinary upload exists outside `pipeline/stages`; it must be integrated with dry-run, source traceability, and explicit approval.
- Google-sourced image rights statuses need a controlled status update before MVP public projection.
- Stage 08 dry-run detects existing staging rows from the prior successful apply. Future applies should be treated as idempotent upserts, not fresh inserts.

## Approvals Required

Before Stage 08 apply:

- Confirm batch id
- Confirm approved manifest
- Confirm unique index for `venue_images(venue_id, photo_reference)`
- Run Stage 08 dry-run and review report

Before Cloudinary upload:

- Confirm Cloudinary env
- Confirm selected image list
- Confirm source trace policy
- Confirm `rights_status = google_places_sourced`
- Confirm no image is marked owned/licensed

Before public publish/projection:

- Confirm Stage 09 review status
- Confirm Cloudinary-backed public image URLs
- Confirm no `public.venues` writes happen from staging sync
- Confirm consumer UI/API projection plan
