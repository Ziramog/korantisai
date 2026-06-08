# Korantis Enrichment Pipeline Architecture v1

Date: 2026-06-08

Status: proposal for review before implementation.

Scope: improve already discovered/staged/public venues with better evidence, richer editorial data, gallery photos, price/context metadata, and source-backed quality signals without breaking the current publication machine.

## Executive Summary

The current Korantis pipeline can discover venues, select a hero image, generate basic editorial copy, review manually, upload to Cloudinary, project to public tables, and activate venues. That machine works.

The next problem is not "can we publish?" The next problem is "is each venue rich, defensible, useful, and beautiful enough to scale Korantis as a product?"

The enrichment pipeline should be a separate layer that can run on:

- venues already active in `public.venues`
- venues in `pending_review`
- freshly generated batches before publication
- specific venue ids selected manually

It must be safe by default:

- read-only by default
- no public activation
- no destructive writes
- no image rights auto-approval
- no unsupported claims
- every enriched field must preserve source/evidence

## Current Baseline

Latest public catalog audit:

- Public venues read: 139
- Active: 73
- Pending review: 66
- Keep: 120
- Need fix: 19
- Review/remove: 0
- Remove candidate: 0
- Missing geo: 0
- Missing hero: 2
- Duplicates: 0
- Chain/generic brand candidates: 0

Interpretation:

- The catalog is not dirty enough to require mass deletion.
- The active set looks structurally safe.
- The weakness is enrichment depth, especially pending review venues with missing copy/moods and a few missing hero images.
- We should enrich before scaling too aggressively into more cities.

## Design Principle

Do not mutate the current publication flow into a complex monster.

Instead, add a dedicated enrichment subsystem:

```text
Catalog / Batch Input
  -> Evidence collection
  -> Source verification
  -> Image gallery expansion
  -> Venue facts extraction
  -> Editorial enrichment
  -> Deterministic enrichment quality gate
  -> Manual review
  -> Optional apply to staging/public
```

This lets the publication pipeline stay stable while enrichment improves over time.

## What We Need To Enrich

### 1. Venue Facts

Target fields:

- price band / average spend when source-backed
- best time to go
- reservation requirement when source-backed
- opening hours summary
- neighborhood micro-context
- venue category refinement
- website / booking / menu / Instagram links
- known awards or guide mentions, only if URL-verified
- cuisine or drink focus, only if source-backed
- ambience descriptors
- practical warnings, e.g. loud, crowded, touristy, formal, tiny

Important:

- Do not invent menu items.
- Do not invent Michelin, 50 Best, "iconic", "best", or award claims.
- If evidence is weak, store it as `unverified_hint`, not as user-facing truth.

### 2. Editorial Content

Target fields:

- stronger tagline
- grounded short description
- atmospheric long description for detail page
- "go when" moments
- "best for" labels
- "not for" labels
- mood tags mapped to final taxonomy
- confidence explanation
- source-backed claims list

Current Stage 05 is useful but too thin. It mainly uses Google Places + hero image metadata. Enrichment should add external evidence before asking a text model to write anything richer.

### 3. Gallery Photos

Current publication needs one hero. Product maturity needs:

- one hero image
- 3-6 gallery images
- optional exterior/context image
- optional food/drink image only if it supports the venue identity
- image roles:
  - `hero`
  - `interior`
  - `bar`
  - `table_scene`
  - `terrace_rooftop_patio`
  - `exterior_context`
  - `food_drink_supporting`
  - `detail_texture`

Do not let product-food dominate galleries. Korantis is not a food guide.

### 4. Evidence And Source Confidence

Every enriched venue should have an evidence profile:

```json
{
  "source_coverage_score": 0.0,
  "editorial_mentions_confirmed": [],
  "official_sources_found": [],
  "user_review_signal": {},
  "image_depth_score": 0.0,
  "facts_confidence": 0.0,
  "editorial_confidence": 0.0,
  "risk_flags": []
}
```

This lets us separate "beautiful but weakly sourced" from "strong, source-backed Korantis venue".

## Proposed Stages

### Stage E00 - Enrichment Target Selection

Goal:

Choose which venues need enrichment.

Inputs:

- `public.venues`
- `staging_venues`
- `venue_images`
- `quality_scores`
- batch outputs
- manual venue id list

Outputs:

```text
data/enrichment/<run_id>/enrichment_targets.json
data/enrichment/<run_id>/enrichment_target_report.md
```

Selection modes:

- `--active-only`
- `--pending-review`
- `--batch <batch_id>`
- `--venue-ids <ids>`
- `--missing-gallery`
- `--missing-editorial`
- `--city Buenos Aires`
- `--city New York`
- `--city Dubai`

Rules:

- prioritize active venues missing gallery depth
- prioritize pending_review venues missing copy/moods/hero
- avoid reprocessing venues enriched recently unless `--force`
- preserve current public status

### Stage E01 - Evidence Collection

Goal:

Collect source evidence without generating user-facing claims yet.

Sources:

- official website
- Google Places details already stored
- Stage 00B verified editorial URLs
- Michelin / 50 Best / Eater / Infatuation / Time Out / local sources when fetchable
- booking/menu pages if official
- existing review snippets if available locally

Outputs:

```text
enrichment_evidence.json
enrichment_evidence_report.md
```

Evidence object:

```json
{
  "venue_id": "...",
  "venue_name": "...",
  "sources_checked": [],
  "sources_confirmed": [],
  "official_links": {},
  "facts": {},
  "claims_allowed": [],
  "claims_blocked": [],
  "confidence": 0.0
}
```

Key rule:

Source-query candidates are not enough for claims. Only URL-confirmed evidence can support claims.

### Stage E02 - Gallery Discovery And Classification

Goal:

Find more images and classify them into gallery roles.

Inputs:

- existing Stage 03 image candidates if available
- existing M3 results if available
- official website images
- Google Places photo refs
- Cloudinary existing images

Forbidden:

- Instagram post scraping
- TripAdvisor scraping
- random Google Images
- unsupported image formats
- images without clear source URL

Outputs:

```text
gallery_candidates.json
gallery_classification_results.json
gallery_selection.json
gallery_report.md
```

Image policy:

- hero remains interior / experiential space first
- rooftop, terrace, patio count as experiential if they show where people sit/drink/eat
- facade-only exterior is fallback, not default
- gallery should include space variety, not five near-duplicates
- product_food allowed only as supporting image, never primary hero unless product is core identity and manually approved

### Stage E03 - Fact Extraction

Goal:

Turn evidence into structured facts.

No model is needed for simple deterministic fields. Use source parsing and existing data first.

Fields:

- price_level from Google Places if available
- price_text if official/menu evidence exists
- reservation_url
- menu_url
- website
- instagram_url
- phone
- opening_hours
- cuisine_or_drink_focus
- source-backed guide mentions
- source-backed editorial mentions

Outputs:

```text
venue_facts_enriched.json
venue_facts_report.md
```

Important:

If a field cannot be verified, store:

```json
{
  "value": null,
  "status": "unknown",
  "reason": "no_source"
}
```

Do not fill blanks with guesses.

### Stage E04 - Editorial Enrichment

Goal:

Generate richer editorial content using only grounded evidence.

Model:

- MiniMax M2.7 or configured text model
- strict JSON output
- no claims beyond evidence

Input evidence:

- official facts
- source-confirmed editorial mentions
- M3 image atmosphere
- gallery role signals
- Google rating/review count
- neighborhood
- venue type
- existing copy

Output:

```json
{
  "tagline": "",
  "description_short": "",
  "description_long": "",
  "mood_tags": [],
  "moments": [],
  "best_for": [],
  "not_for": [],
  "primary_atmosphere": "",
  "price_context": "",
  "planning_notes": [],
  "source_backed_claims": [],
  "blocked_claims": [],
  "evidence_confidence": 0.0,
  "editorial_confidence": 0.0
}
```

Rules:

- no "best", "iconic", "Michelin", "50 Best", "award-winning" unless URL-confirmed
- no exact menu item unless found in source
- no hard price unless source-backed
- keep tone atmospheric, not food-review oriented

### Stage E05 - Enrichment Quality Gate

Goal:

Decide whether enriched data can be applied.

Status options:

- `enrichment_ready`
- `needs_manual_review`
- `blocked_insufficient_evidence`
- `blocked_image_quality`

Required for `enrichment_ready`:

- valid venue id
- valid geo
- at least one usable hero image
- at least 3 gallery candidates or explicit reason not available
- tagline
- short description
- 2+ mood tags
- evidence confidence >= threshold
- no unsupported claims
- no image rights auto-approval

Outputs:

```text
enrichment_quality_gate.json
enrichment_quality_gate_report.md
```

### Stage E06 - Manual Enrichment Review Dashboard

Goal:

Human review before applying richer content.

Dashboard should show:

- current public card
- proposed enriched card
- hero and gallery images
- source-backed claims
- blocked claims
- confidence score
- approve / reject / pause
- reviewer notes

Output:

```text
enrichment_decision_manifest.json
enrichment_decision_manifest.reviewed.json
```

### Stage E07 - Apply Enrichment Dry Run

Goal:

Map approved enrichment into DB writes without applying.

Tables likely affected:

- `venues`
- `venue_images`
- maybe `venue_enrichment` if we add a dedicated table
- maybe `venue_gallery` if current `venue_images` is not enough

Recommended schema direction:

Prefer additive JSONB first:

```sql
venues.enrichment_data jsonb
venues.evidence_data jsonb
venues.gallery_status text
venue_images.role text
venue_images.gallery_rank int
venue_images.selection_data jsonb
```

But before changing schema:

- inspect current live schema
- prefer using existing `venue_images` if compatible
- avoid migration unless the dry-run proves it is needed

### Stage E08 - Apply Enrichment

Goal:

Apply reviewed enrichment.

Must require:

```text
--apply
```

Default:

```text
--dry-run
```

Safety:

- never activates venues
- never deletes existing images
- never removes existing copy without backup
- writes previous values into apply result
- batch-level rollback plan generated

Outputs:

```text
enrichment_apply_result.json
enrichment_apply_report.md
enrichment_rollback_plan.json
```

## Data Model Proposal

### Minimal First Version

Use existing tables where possible.

Venue enrichment payload:

```json
{
  "version": "enrichment_v1",
  "generated_at": "...",
  "facts": {},
  "editorial": {},
  "evidence": {},
  "source_backed_claims": [],
  "blocked_claims": [],
  "quality": {}
}
```

Image enrichment payload:

```json
{
  "role": "interior",
  "gallery_rank": 1,
  "scene_type": "gallery_atmosphere",
  "source_url": "...",
  "rights_status": "not_approved_for_publication",
  "selection_reason": "...",
  "risk_flags": []
}
```

### Better Long-Term Version

Create dedicated tables:

```text
venue_evidence
venue_editorial_versions
venue_gallery_images
venue_source_mentions
```

Do not start here unless current schema becomes painful. Additive JSONB is faster for the next iteration.

## How This Connects To Current Pipeline

Current pipeline:

```text
Stage 00-12 = discovery to publication
Stage 13-16 = audit/control/safety
```

Proposed enrichment:

```text
Stage E00-E08 = improve depth and quality
```

Integration points:

- Stage 00B editorial source verification feeds E01 evidence.
- Stage 03/04 image outputs feed E02 gallery.
- Stage 05 editorial can be reused but should become E04 for richer copy.
- Stage 16 public catalog audit feeds E00 target selection.
- Control center should expose enrichment runs separately from publication runs.

## Recommended Build Order

### Phase 1 - Read-Only Enrichment Audit

Build:

```text
pipeline/enrichment/00_select_targets.ts
pipeline/enrichment/01_collect_evidence.ts
```

Goal:

Know exactly which venues need what.

No models. No DB writes.

### Phase 2 - Gallery Depth

Build:

```text
pipeline/enrichment/02_build_gallery_candidates.ts
pipeline/enrichment/03_select_gallery.ts
```

Goal:

Every strong public venue gets 3-6 good images.

This is visually high-impact and directly improves product quality.

### Phase 3 - Source-Backed Facts

Build:

```text
pipeline/enrichment/04_extract_source_backed_facts.ts
```

Goal:

Add price/context/links/hours/guide mentions only when evidence exists.

### Phase 4 - Rich Editorial Rewrite

Build:

```text
pipeline/enrichment/05_generate_rich_editorial.ts
pipeline/enrichment/06_quality_gate.ts
```

Goal:

Upgrade copy only after evidence and gallery data exist.

### Phase 5 - Review And Apply

Build:

```text
pipeline/enrichment/07_review_dashboard.ts
pipeline/enrichment/08_apply_reviewed_enrichment.ts
```

Goal:

Human-approved enrichment writes.

## Priority Recommendation

Start with gallery and evidence, not with more copy.

Reason:

- Copy quality depends on evidence.
- Product perception depends heavily on images.
- Current public audit shows active venues are structurally safe, so the next visible improvement is gallery depth.
- Better source evidence will also improve seed quality and future editorial.

Concrete next implementation:

```text
1. Build enrichment target selector from Stage 16 audit.
2. Build gallery candidate selector for active venues missing gallery depth.
3. Generate gallery review dashboard.
4. Only then apply gallery images to DB.
5. Then add source-backed facts and rich editorial.
```

## Questions For Claude Review

Ask Claude to audit this architecture against:

1. Is the enrichment pipeline correctly separated from publication?
2. Are the evidence rules strict enough to avoid unsupported claims?
3. Should gallery enrichment happen before editorial rewrite?
4. Is additive JSONB enough for v1, or should we create normalized tables immediately?
5. What fields are missing for a high-quality venue detail page?
6. What should be the minimum evidence threshold for public-facing price/context claims?
7. What should be the manual review UX for gallery + editorial approval?
8. Which city-specific sources should be added for Buenos Aires, New York, and Dubai?
9. How should we avoid overfitting to prestige guides and missing local hidden gems?
10. What should be removed, simplified, or delayed from this plan?

## Non-Goals For First Build

- No automatic deletion of venues.
- No automatic public activation.
- No scraping Instagram posts.
- No scraping TripAdvisor.
- No claiming awards without URL evidence.
- No changing consumer UI during backend enrichment.
- No massive schema redesign unless dry-run proves current schema cannot support the data.

## Success Criteria

For the first enrichment release:

- 100 percent read-only target/evidence reports work.
- Every active venue has an enrichment health score.
- At least 50 active venues have 3+ gallery candidates.
- No unsupported editorial claims are generated.
- No image rights are auto-approved.
- Manual review can approve/reject/pause enrichment.
- Apply mode is explicit and reversible.

