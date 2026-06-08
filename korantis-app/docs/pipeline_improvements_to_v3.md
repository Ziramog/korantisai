# Korantis Pipeline Improvements To v3

Date: 2026-06-08

Source inputs:

- `docs/korantis_pipeline_arch_v1.md`
- `docs/korantis_pipeline_arch_v1_claude_opinion.md`
- Current pipeline behavior after `batch_004_buenos_aires_50` and `batch_005_buenos_aires_restaurants_50`

## Executive View

Claude's audit is directionally correct: the pipeline works, but the next version should harden production safety, evidence grounding, image depth, and operator workflow before scaling to more cities.

My view is more specific:

- The core architecture is sound. We should not rewrite it from scratch right now.
- The biggest immediate gap is not candidate discovery. It is post-publication safety: audit, rollback, read-back verification, and lifecycle controls.
- The second biggest gap is evidence grounding. Stage 05 currently writes plausible atmospheric copy from Google Places + selected image metadata, but it does not have enough external evidence to justify richer editorial claims.
- The third biggest gap is media depth. One hero image is enough to publish a card, but not enough for a mature Korantis venue detail experience.
- Some Claude findings are already partially solved: visual review exists, one-click reviewed publication exists, mood tags are constrained in code, and publication uses `pending_review -> active`.

The v3 plan should be incremental. Do not rename or collapse all stages yet. First harden what already works.

## What Claude Got Right

### 1. Post-Activation Audit Is Critical

This is the highest-priority missing stage.

Current flow can activate venues, but after activation we do not automatically read production back and verify:

- venue row exists
- `curation_status = active`
- coordinates are valid
- coordinates are inside expected city bounds
- hero image exists
- Cloudinary URL resolves
- tagline exists
- tags are valid
- public API can actually return the venue

This should be implemented before publishing many more batches.

### 2. Rollback Is Missing

We need a fast recovery command.

If a batch goes live with bad data, the current system has no simple batch-level rollback. We need:

```text
npx tsx pipeline/stages/14_rollback_public_batch.ts <batch_id> --dry-run
npx tsx pipeline/stages/14_rollback_public_batch.ts <batch_id> --apply
```

The apply mode should flip venues from `active` back to `pending_review`, not delete rows.

### 3. Evidence Grounding Is Still Too Weak

Stage 05 uses:

- Google Places metadata
- selected hero vision fields
- practical links/hours when present

That is enough for basic copy, but not enough for strong editorial claims.

We need evidence richness scoring and external source discovery before generating richer descriptions.

### 4. Multi-Image Support Is Needed

The consumer app already has concepts around `galleryImages`. The pipeline currently treats publication as one selected hero image.

V3 should publish:

- one hero image
- 2-4 gallery images where available
- clear image roles
- source and rights metadata for every image

### 5. City-Specific Configuration Is Required

Buenos Aires and NYC should not share only CLI parameters. They need different configs:

- coordinate bounds
- neighborhood allowlists
- source priorities
- language assumptions
- venue category mix
- review/evidence thresholds
- editorial source targets

## What Claude Overstated Or Needs Updating

### Review Dashboard

Claude criticized JSON editing. That was true earlier, but we now have:

- visual publication review dashboard
- approve/reject/pause buttons
- live counters
- one-click reviewed publication action

Still missing:

- decisions persisted directly from the dashboard to disk/server
- proper full-screen review route
- better UX for large batches
- ability to re-open only paused venues

So the criticism is partially resolved, but not fully.

### Mood Vocabulary

Claude says mood tags are unconstrained. Current code already has an allowed `MoodTag` union and Stage 05 normalization filters to allowed tags.

However, this still needs improvement:

- The vocabulary may not match the final product taxonomy.
- We currently mix English internal tags like `warm`, `refined`, `date_night`, `hidden_gem`.
- Product may want a smaller canonical mood system such as `intimate`, `warm`, `social`, `energetic`, `refuge`, `contemplative`, `refined`, `creative`, `romantic`, `historic`.

This needs product re-analysis before changing code because changing tags affects filtering, scoring, UI, and existing venue data.

### Hero Interior Vs Exterior

Claude is correct: Korantis should prefer experiential interiors, not facades.

The corrected policy should be:

```text
1. hero_interior / experiential space
2. gallery_atmosphere
3. hero_exterior only as fallback
```

Important nuance:

- Rooftop, terrace, patio, garden, outdoor bar, or sidewalk dining should count as experiential interior if it shows where the guest actually sits/drinks/eats.
- Facade/sign/street-only exterior should be fallback.

This has already been corrected in the M3 prompt and Stage 04 scoring policy.

### Full Stage Renumbering

Claude proposes collapsing 13+ stages into 11 stages. That is conceptually cleaner but not urgent.

My recommendation:

- Do not renumber the working pipeline now.
- Add missing safety stages as `13/14/15` or named scripts.
- Later, once stable, create a v3 orchestrator that groups stages into phases while preserving backward compatibility.

Renumbering today would create churn without improving data quality.

## Immediate v3 Priorities

### Priority 1: Stage 13 Post-Activation Audit

Create:

```text
pipeline/stages/13_post_activation_audit.ts
```

Inputs:

- `public_activation_apply_result.json`
- Supabase public `venues`
- Supabase `venue_images`
- optional public API endpoint if available

Outputs:

```text
data/batches/<batch_id>/post_activation_audit.json
data/batches/<batch_id>/post_activation_audit_report.md
```

Checks:

- every activated venue id exists in `venues`
- every activated venue has `curation_status = active`
- `name` exists
- `city` exists
- `coordinates` parse
- coordinates are inside configured city bounds
- `tagline` exists and is not placeholder
- `narrative` or description exists
- `tags` exist and are within allowed vocabulary
- hero image row exists
- hero image uses Cloudinary secure URL
- hero image URL resolves with valid image content type
- no venue from the batch has `active` without Cloudinary hero

Behavior:

- dry-run/read-only only
- no writes
- report pass/fail
- control center should surface audit status

Why first:

This catches bad production rows after activation and gives us confidence that the public app has valid data.

### Priority 2: Stage 14 Rollback Public Batch

Create:

```text
pipeline/stages/14_rollback_public_batch.ts
```

Commands:

```text
npx tsx pipeline/stages/14_rollback_public_batch.ts <batch_id> --dry-run
npx tsx pipeline/stages/14_rollback_public_batch.ts <batch_id> --apply
```

Outputs:

```text
data/batches/<batch_id>/public_rollback_dry_run.json
data/batches/<batch_id>/public_rollback_dry_run_report.md
data/batches/<batch_id>/public_rollback_apply_result.json
data/batches/<batch_id>/public_rollback_apply_report.md
```

Apply behavior:

- only affects rows where `publication_metadata.batch_id = <batch_id>`
- only changes `curation_status`
- `active -> pending_review`
- does not delete venues
- does not delete images
- does not touch Cloudinary
- requires explicit `--apply`
- command center requires `RUN`

Why second:

If audit finds a production problem, we need fast recovery.

### Priority 3: City Config System

Create:

```text
pipeline/config/cities.ts
```

Initial configs:

- Buenos Aires
- New York

Each city config should include:

- city id
- display name
- coordinate bounds
- default neighborhoods
- Korantis-priority neighborhoods
- allowed venue types
- default type mix presets
- source priority list
- editorial language
- timezone
- review count threshold ranges
- known editorial sources

Example:

```ts
{
  city_id: 'buenos_aires',
  display_name: 'Buenos Aires',
  bounds: {
    min_lat: -34.80,
    max_lat: -34.40,
    min_lng: -58.65,
    max_lng: -58.20
  },
  priority_neighborhoods: [
    'Palermo',
    'Recoleta',
    'Chacarita',
    'Villa Crespo',
    'Colegiales',
    'Belgrano',
    'San Telmo',
    'Almagro',
    'Retiro',
    'Puerto Madero'
  ],
  editorial_sources: [
    'Infobae Gastronomia',
    'Planeta Joy',
    'Time Out Buenos Aires',
    'Michelin Guide'
  ]
}
```

Use city config in:

- Stage 00 candidate detection
- Stage 01 Google Places validation
- Stage 06 quality gate
- post-activation audit
- control center new batch form

Why third:

NYC expansion will fail or produce noisy results without city-specific bounds and source priorities.

### Priority 4: Stronger Quality Gate

Update:

```text
pipeline/stages/06_quality_gate.ts
pipeline/stages/06_score_and_stage.ts
```

Add deterministic checks:

- coordinates inside city bounds
- hero image shortest side >= configured threshold
- hero image URL is Cloudinary by publication stage
- mood tags all valid
- tagline min/max length
- description min/max length
- no placeholders like `TBD`, `lorem`, `example`, `not confirmed`
- neighborhood belongs to configured city list or is marked `unknown_neighborhood_review`
- hero image does not have identifiable faces if policy is strict

Important:

Do not block too aggressively at Stage 06 if the issue is publication-only. Some checks belong to Stage 11/12/13.

Recommended split:

- Stage 06: ready for DB/publication review
- Stage 11/12: ready for public write/activation
- Stage 13: active production integrity

### Priority 5: Evidence Richness Score

Create:

```text
pipeline/utils/evidence_scorer.ts
```

Score evidence richness from:

- Google rating present
- review count present
- website present
- hours present
- phone present
- source discovery richness
- hero image quality
- number of image candidates
- future review snippets
- future editorial mentions

Use score to gate Stage 05:

```text
0.00-0.29: minimal factual copy only
0.30-0.59: standard short editorial
0.60-1.00: full atmospheric editorial
```

This should prevent over-written copy for weak evidence venues.

### Priority 6: Source Discovery v2

Update Stage 02 to collect more evidence, but keep rights safe.

Targets:

#### Buenos Aires

- Michelin Guide
- Time Out Buenos Aires
- Infobae Gastronomia
- Planeta Joy
- Turismo Buenos Aires
- official venue website

#### NYC

- Michelin Guide
- Eater
- The Infatuation
- New York Magazine / Grub Street
- Time Out New York
- official venue website

Output should include:

```text
editorial_mentions[]
review_snippets[]
official_source_confidence
source_confidence
evidence_richness_inputs
```

Rules:

- Do not scrape paywalled full articles.
- Store short facts and URLs, not copyrighted article text.
- Prefer source presence and paraphrased evidence.
- Keep external source claims traceable.

### Priority 7: Gallery Builder

Current publication path uploads one hero.

V3 should select:

- `hero`
- `gallery_1`
- `gallery_2`
- `gallery_3`

Selection rules:

- no duplicate URLs/hash
- no product-only as hero
- product/food can appear only as secondary gallery if spatial images exist
- prefer experiential interiors/outdoors
- avoid faces
- prefer Cloudinary transformations
- preserve source attribution and rights metadata

Implementation options:

1. Extend Stage 04 selected output to include `selected_gallery_images`.
2. Extend Stage 10 Cloudinary upload to upload all selected image roles.
3. Extend Stage 11 public projection to write multiple `venue_images` rows.
4. Use existing consumer `galleryImages` support.

### Priority 8: Review Dashboard Persistence

Current state:

- Visual review dashboard exists.
- Operator downloads `publication_decision_manifest.reviewed.json`.
- One-click publish consumes that manifest.

This works but is still clunky.

V3 should add:

- local API endpoint to save decisions directly
- per-card auto-save
- filter paused/rejected/approved
- open paused-only view
- show evidence richness
- show image scene/quality
- show source links
- show gallery candidates

Files:

```text
pipeline/control_center_server.ts
pipeline/stages/09_generate_publication_review.ts
```

Do not turn this into a public admin product yet. Keep it local until workflow stabilizes.

## Medium-Term v3 Improvements

### Semantic Korantis Fit

Claude recommends embedding similarity to activated venues. This is a good idea, but it needs careful design.

Do not implement blindly.

First re-analyze:

- Which activated venues are actually good examples?
- Which ones were compromises?
- What is the canonical Korantis archetype?
- Should the embedding be based on name/type/reviews/source snippets or human labels?

Potential implementation:

- generate embeddings for activated venues
- create positive/negative seed sets
- score candidates with cosine similarity
- add `korantis_fit_semantic_score`
- reduce Google popularity weight

This should be a v3.5 task, not immediate v3.

### Stage 00 Scoring Formula

Claude is right that current scoring is too Google-popularity-biased.

Before changing weights, analyze:

- accepted vs rejected venues from batch 004/005
- which high-scoring candidates were bad
- which low-scoring candidates should have been selected
- distribution by review count, neighborhood, category, visual candidate count

Then adjust:

```text
decrease google_presence/review_volume
increase source_diversity
increase visual/evidence potential
add anti-signals
later add semantic fit
```

### Google Places Match Confidence

Stage 01 should explicitly report:

- name similarity
- city/neighborhood match
- category/type match
- distance from input coordinate if provided
- match confidence

Block or warn:

- low name similarity
- wrong city
- closed venue
- coordinates outside city bounds

### Cost Controls

Needed before running larger batches:

- max M3 calls per batch
- max M2.7 calls per batch
- cost estimate before run
- abort if queue exceeds threshold unless `--confirm-large-run`
- retry/backoff already exists for text; Stage 04 should also have explicit rate-limit/backoff policy

### Lifecycle Management

Eventually needed:

- refresh active venue
- deactivate closed venue
- re-run image selection
- re-run editorial
- re-audit active city
- stale data detection

## What Needs Re-Analysis Before Implementation

### 1. Final Mood Taxonomy

Current internal tags:

```text
quiet, warm, romantic, lively, intimate, cinematic, historic, creative,
work_friendly, date_night, late_night, outdoor, hidden_gem, refined, social
```

Possible product taxonomy:

```text
intimate, warm, social, energetic, refuge, contemplative, refined,
creative, romantic, historic
```

This affects:

- editorial generation
- venue filtering
- consumer UI pills
- scoring
- existing published data

Decision needed before migration.

### 2. Image Rights And Attribution

Google Places photos are currently used and uploaded to Cloudinary.

Need re-analysis:

- What attribution does Google require in consumer UI?
- Are we allowed to cache/store/materialize those images in Cloudinary?
- Should Google Places images be treated as temporary references only?
- Should official website images be preferred for publication?
- Should public cards show attribution metadata?

This is a legal/product decision, not just code.

### 3. Hero Policy

Current product-aligned rule:

```text
interior/experience first
gallery atmosphere second
facade/exterior fallback
```

Need re-analysis:

- Do users understand venue faster with interior or exterior?
- Should card hero and detail hero differ?
- Should exterior be first image in gallery but not card hero?
- Should venues with iconic facades be manually marked?

### 4. NYC Source Strategy

NYC cannot rely on the same signals as Buenos Aires.

Need decide:

- allowed neighborhoods
- initial count
- category mix
- editorial sources
- minimum evidence threshold
- whether to use stricter review before activation

### 5. Publication Workflow

One-click publication now works, but it combines Cloudinary, public projection, and activation.

Need decide:

- Is one-click acceptable for production?
- Should activation remain a separate final button?
- Should one-click stop at `pending_review` by default?
- Should post-activation audit automatically run and rollback on failure?

My recommendation:

- Keep one-click for small curated batches.
- Add automatic post-activation audit immediately.
- Do not auto-rollback yet; report and show rollback button.

## Proposed v3 Stage Additions

### Stage 13: Post-Activation Audit

```text
pipeline/stages/13_post_activation_audit.ts
```

Read-only. Runs after activation. Produces audit report.

### Stage 14: Rollback Public Batch

```text
pipeline/stages/14_rollback_public_batch.ts
```

Dry-run/apply. Flips active venues back to pending_review.

### Stage 15: Gallery Builder

```text
pipeline/stages/15_build_gallery_selection.ts
```

Can be added before full Stage 04 refactor. Uses existing M3 vision results to select secondary images.

### Stage 16: Source Evidence Enrichment

```text
pipeline/stages/16_enrich_editorial_evidence.ts
```

Should eventually move earlier, but can be introduced as an additive evidence pass.

## Control Center v3 Plan

Add:

- `Run post-activation audit`
- `Rollback batch dry-run`
- `Rollback batch apply`
- `Open review full screen`
- `Save review decisions`
- `Paused-only review`
- `Audit status` stat
- `Rollback available` stat
- `Published from this batch` stat

Change:

- Keep Command Center layout stable.
- Do not over-optimize embedded iframe review UX.
- Use full-screen review for real manual decisions.

## Recommended Implementation Order

### Sprint 1: Production Safety

1. Implement `13_post_activation_audit.ts`.
2. Add audit button to control center.
3. Implement `14_rollback_public_batch.ts`.
4. Add rollback dry-run/apply buttons to control center.
5. Add audit result to one-click publication report.

This should happen before the next large activation.

### Sprint 2: Quality Gate And City Config

1. Add `pipeline/config/cities.ts`.
2. Add coordinate bounds validation to Stage 06 and post-activation audit.
3. Add neighborhood validation/warnings.
4. Add tagline/description placeholder checks.
5. Add stronger public API read-back checks.

This should happen before NYC batch > 15 venues.

### Sprint 3: Evidence And Editorial

1. Implement `evidence_scorer.ts`.
2. Add evidence richness to Stage 05 prompt choice.
3. Add source evidence report to review dashboard.
4. Add Google review snippets if API/data access supports it.
5. Add editorial source cross-reference for Michelin/TimeOut/Eater/Infatuation.

This should happen before scaling beyond curated small batches.

### Sprint 4: Multi-Image Gallery

1. Extend Stage 04 output with gallery selections.
2. Extend Stage 10 Cloudinary to upload gallery roles.
3. Extend Stage 11 projection to write multiple `venue_images`.
4. Verify consumer app gallery renders correctly.
5. Add gallery review in Stage 09.

This should happen before positioning the venue detail page as a rich editorial product.

### Sprint 5: Candidate Scoring v3

1. Analyze accepted/rejected batches.
2. Add anti-signals.
3. Reduce review-volume bias.
4. Add source diversity/evidence bias.
5. Prototype semantic Korantis-fit scoring.

This should happen after we have enough high-quality approved/rejected labels.

## Honest Assessment

The pipeline is no longer just a prototype. It can publish real venues end-to-end.

But it is not yet a mature publication system.

The most urgent issue is not finding more venues. It is making sure published venues remain correct, reversible, auditable, and legally safer.

I would not run a 200-venue activation until we have:

- post-activation audit
- rollback
- city bounds
- stronger evidence gating
- image rights/attribution decision

I would continue using it for controlled 15-50 venue batches with human review, as long as we audit after activation.

## Next Concrete Task

Implement first:

```text
pipeline/stages/13_post_activation_audit.ts
```

Then wire it into:

```text
pipeline/stages/run_reviewed_publication_apply.ts
pipeline/control_center_server.ts
```

So the one-click publication flow becomes:

```text
Stage 11 dry-run
Stage 10 Cloudinary apply
Stage 11 public projection apply
Stage 12 activation dry-run
Stage 12 activation apply
Stage 13 post-activation audit
```

If the audit fails, the batch is not silently considered done. It should be marked:

```text
published_with_audit_failures
```

and the control center should show a rollback option.
