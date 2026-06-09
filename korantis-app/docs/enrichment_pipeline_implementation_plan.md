# Korantis Enrichment Pipeline Implementation Plan

Date: 2026-06-08

Inputs:

- `docs/enrichment_pipeline.md`
- `docs/enrichment_pipeline_claude_vision.md`
- `data/audits/public_catalog_audit_report.md`

Status: implementation plan, not yet code.

## Executive Decision

Claude's vision is directionally correct. We should adopt the stricter parts, but implement in a smaller sequence.

Accepted immediately:

- Enrichment must stay separate from publication.
- Default mode must be read-only.
- Evidence must be source-weighted.
- Claims need a deterministic anti-hallucination gate.
- Gallery needs a rights state machine.
- Quality gate needs numeric thresholds.
- Apply must be explicit, reversible, and partial.

Deferred:

- Full visual enrichment review dashboard.
- Normalized evidence/editorial tables.
- Model-assisted fact extraction.
- Large-scale apply/rollback machinery before outputs are trusted.

## Current Reality

Public catalog audit says:

- `139` public venues
- `73` active
- `66` pending review
- `120` keep
- `19` need fix
- `0` direct remove candidates
- `0` duplicates
- `0` missing geo
- `2` missing hero images

Conclusion:

We do not need a cleanup/delete sprint first. We need enrichment depth.

Most valuable next product improvement:

```text
gallery depth + evidence-backed venue facts
```

Not more generic copy.

## Architecture

Create a new folder:

```text
pipeline/enrichment/
```

Do not mix this into `pipeline/stages/00-16` yet. The existing publication machine works and should remain stable.

Recommended run shape:

```text
data/enrichment/<run_id>/
  enrichment_run_config.json
  enrichment_targets.json
  enrichment_target_report.md
  evidence_collected.json
  evidence_report.md
  gallery_candidates.json
  gallery_selection.json
  quality_gate_results.json
  review_queue.json
```

Run id:

```text
enrich_YYYY_MM_DD_HHmm
```

Example:

```powershell
npx tsx pipeline/enrichment/00_select_targets.ts --active-only --city "Buenos Aires" --missing-gallery --max-targets 25
```

## Phase 1 - Read-Only Target And Evidence Audit

Goal:

Know exactly which venues need enrichment and what evidence already exists.

Build:

```text
pipeline/enrichment/00_select_targets.ts
pipeline/enrichment/01_collect_evidence.ts
pipeline/enrichment/utils/enrichment_types.ts
pipeline/enrichment/utils/source_registry.ts
```

### E00 Target Selector

Inputs:

- Supabase `venues`
- Supabase `venue_images`
- Stage 16 audit output if present

CLI:

```text
--active-only
--pending-review
--city <city>
--venue-ids <comma-separated ids>
--missing-gallery
--missing-editorial
--missing-facts
--max-targets <n>
--force
```

Needs:

```text
gallery_depth       fewer than 3 usable images
hero_missing        no hero image
hero_weak           hero exists but weak or non-Cloudinary
editorial_thin      missing tagline/description/moods
facts_missing       no price/hours/links
evidence_weak       no evidence score or score < 0.4
stale               last enriched > 180 days or never
source_unchecked    no evidence collection run
```

Priority score:

```text
active venue +0.30
pending_review +0.10
hero_missing +0.30
gallery_depth +0.15
editorial_thin +0.15
facts_missing +0.05
evidence_weak +0.05
```

Outputs:

```text
enrichment_targets.json
enrichment_target_report.md
enrichment_run_config.json
```

Acceptance:

- Read-only Supabase.
- Selects active Buenos Aires targets.
- Shows exactly why each venue was selected.
- Caps run at `--max-targets`.
- Skips recently enriched venues unless `--force`.

### E01 Evidence Collector

Inputs:

- `enrichment_targets.json`
- current venue row
- current venue images
- stored `canonical_data`, `enrichment_data`, `publication_metadata` if present

Do now:

- Read stored Google Places fields.
- Read current links.
- HEAD-check official website URL.
- Record source authority.
- Extract deterministic facts only.

Do not do yet:

- No model calls.
- No full article scraping.
- No editorial rewrite.
- No Cloudinary upload.

Source authority:

```text
5 official venue source
4 Michelin / 50 Best / Eater / Infatuation / NYMag
3 Google Places / Time Out / established local media
2 local blogs / secondary guides
1 user-generated or weak signals
```

Outputs:

```text
evidence_collected.json
source_fetch_log.json
evidence_report.md
evidence_conflicts.json
```

Acceptance:

- Runs on 25-50 venues in under 5 minutes.
- Produces evidence coverage score.
- No writes.
- No user-facing claims generated.

## Phase 2 - Gallery Depth

Goal:

Every strong venue should have one hero and 3-6 gallery images.

Build:

```text
pipeline/enrichment/02_discover_gallery.ts
pipeline/enrichment/02b_classify_gallery.ts
pipeline/enrichment/02c_select_gallery.ts
pipeline/enrichment/utils/gallery_types.ts
pipeline/enrichment/utils/image_quality.ts
pipeline/enrichment/utils/perceptual_hash.ts
```

Image sources:

- existing `venue_images`
- previous Stage 03/04 outputs when batch is known
- Google Places photo refs already stored
- official website image candidates where available
- existing Cloudinary images

Forbidden:

- Instagram post scraping
- TripAdvisor
- random Google Images
- source-less images

Rights state machine:

```text
discovered
classified
rights_reviewed
upload_approved
uploaded
published
rejected
```

Default rights:

```text
google_places -> google_places_attribution_required
official_website -> official_website_assumed_ok
existing_cloudinary -> existing_cloudinary_ok
unknown -> unknown_requires_review
instagram_post -> rejected_rights_risk
```

Gallery selection:

```text
rank 1 hero: hero_interior or gallery_atmosphere, quality >= 0.7
rank 2-6 gallery: quality >= 0.5, no near duplicates
prefer role diversity
supporting_food_drink only if not dominant
```

Acceptance:

- Produces `gallery_candidates.json`.
- Produces `gallery_selection.json`.
- No Cloudinary uploads.
- No DB writes.
- M3 calls are counted and capped.
- Near-duplicate detection prevents repeated angles.

## Phase 3 - Deterministic Fact Extraction

Goal:

Extract structured facts without guessing.

Build:

```text
pipeline/enrichment/03_extract_facts.ts
pipeline/enrichment/utils/fact_types.ts
pipeline/enrichment/utils/confidence_calculator.ts
pipeline/enrichment/utils/conflict_resolver.ts
```

Fields:

```text
price_level
price_text
reservation_url
menu_url
website
instagram_url
phone
opening_hours
cuisine_focus
drink_focus
guide_mention
editorial_mention
neighborhood_context
practical_warning
```

Rule:

If unknown, store unknown. Do not invent.

Display rules:

```text
confirmed >= 0.7 -> can show
likely >= 0.5 -> can show with soft language
weak_hint -> internal only
conflict -> manual review
stale -> internal until reverified
```

Acceptance:

- Facts have source URL or stored source reference.
- Conflicts are explicit.
- User-facing fields only appear if confidence threshold passes.

## Phase 4 - Rich Editorial

Goal:

Generate richer copy only after evidence + gallery + facts exist.

Build:

```text
pipeline/enrichment/04_generate_editorial.ts
pipeline/enrichment/utils/editorial_prompt.ts
pipeline/enrichment/utils/editorial_validator.ts
pipeline/enrichment/utils/anti_hallucination.ts
pipeline/enrichment/utils/mood_tag_mapper.ts
```

Evidence depth:

```text
evidence < 0.3 -> minimal only
0.3-0.6 -> standard
> 0.6 -> full detail page copy
```

Blocked without evidence:

```text
best
iconic
legendary
famous
award-winning
Michelin
50 Best
World's Best
must-visit
unmissable
exact prices
specific menu claims
since/opened year
reservation required
```

Mood taxonomy:

```text
intimate
warm
social
energetic
refuge
contemplative
refined
creative
romantic
historic
productive
celebratory
```

Acceptance:

- Strict JSON.
- Prompt version stored.
- Max 2 text model calls per venue.
- Anti-hallucination gate runs after generation.
- Unsupported claims block the venue.

## Phase 5 - Enrichment Quality Gate

Goal:

Deterministic score before review.

Build:

```text
pipeline/enrichment/05_quality_gate.ts
pipeline/enrichment/utils/quality_scorer.ts
```

Weights:

```text
evidence_coverage 0.15
evidence_authority 0.10
image_depth 0.20
image_hero_quality 0.15
fact_confidence 0.10
editorial_grounding 0.15
rights_safety 0.10
freshness 0.05
```

Hard blockers:

```text
unsupported_claims > 0
missing hero or hero_quality < 0.4
rights_safety < 0.5
evidence_coverage < 0.3 and evidence_authority < 0.3
editorial validation errors
coordinates missing or out of bounds
```

Statuses:

```text
enrichment_ready
needs_manual_review
blocked_insufficient_evidence
blocked_image_quality
blocked_rights_risk
blocked_claim_risk
blocked_validation_failure
```

Acceptance:

- No model calls.
- No DB writes.
- Exact blockers per venue.
- `review_queue.json` generated.

## Phase 6 - Review Manifest

Goal:

Manual approval without building a big dashboard yet.

Build:

```text
pipeline/enrichment/06_generate_review_manifest.ts
```

Output:

```text
enrichment_review_manifest.json
enrichment_review_report.md
enrichment_decisions.json
```

Actions:

```text
approve_all
approve_gallery_only
approve_facts_only
approve_editorial_only
reject_all
pause
request_rerun
```

Acceptance:

- Shows current vs proposed.
- Shows risks.
- Shows claims and sources.
- Produces decision template.

## Phase 7 - Dry Run And Apply

Do not build until Phases 1-6 produce trusted outputs.

Build later:

```text
pipeline/enrichment/07_dry_run.ts
pipeline/enrichment/08_apply.ts
pipeline/enrichment/rollback.ts
```

Apply rules:

- `--dry-run` default.
- `--apply` required.
- partial apply supported.
- rollback data required before writes.
- no venue activation.
- no delete.
- no overwrite without previous value.

## Minimal Schema Proposal

Do not apply now. Plan only.

```sql
alter table venues add column if not exists enrichment_data jsonb default '{}';
alter table venues add column if not exists evidence_data jsonb default '{}';
alter table venues add column if not exists enrichment_version text;
alter table venues add column if not exists last_enriched_at timestamptz;

alter table venue_images add column if not exists gallery_rank integer;
alter table venue_images add column if not exists quality_score numeric;
alter table venue_images add column if not exists source_origin text;
alter table venue_images add column if not exists selection_data jsonb default '{}';
```

Rollback table later:

```sql
create table if not exists venue_enrichment_rollback (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null,
  run_id text not null,
  field_path text not null,
  previous_value jsonb,
  new_value jsonb,
  applied_at timestamptz default now(),
  rollback_status text default 'applied'
);
```

## Immediate Next Build

Build only Phase 1 first.

Reason:

- It is read-only.
- It tells us which venues need gallery vs facts vs editorial.
- It prevents wasting M3/M2.7 calls on the wrong venues.
- It gives the control center a clear enrichment queue.

Exact next implementation:

```text
1. Create pipeline/enrichment/utils/enrichment_types.ts
2. Create pipeline/enrichment/00_select_targets.ts
3. Create pipeline/enrichment/01_collect_evidence.ts
4. Run on active Buenos Aires venues only
5. Review reports before any model/image work
```

Test command:

```powershell
npx tsx pipeline/enrichment/00_select_targets.ts --active-only --city "Buenos Aires" --missing-gallery --max-targets 25
npx tsx pipeline/enrichment/01_collect_evidence.ts --run-id <run_id>
```

Expected first report:

```text
How many active BA venues need gallery depth?
How many have thin editorial?
How many have facts missing?
Which venues should be enriched first?
Which sources are already present?
```

## Decision

Proceed with Phase 1 implementation first.

Do not start M3 gallery calls, editorial generation, schema migrations, Cloudinary uploads, or DB writes until Phase 1 reports are trusted.

