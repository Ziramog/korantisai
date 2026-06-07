# Korantis Batch Pipeline Runbook

## Phase 1: M2.7 Prep

Required files:

- `*_m27_manifest.json`
- `*_m27_source_fullres_queue.json`
- `*_m27_final_vision_queue_sanitized.json`
- `*_m27_codex_handoff.md`

Rules:

- Collect text scout, source preflight, contact, reservation, menu, price, and factual evidence.
- Prioritize spatial image sources: official gallery, press/media, Michelin, 50 Best, city tourism, and editorial interior review pages.
- Include image-search modifiers: `interior`, `salon`, `salón`, `dining room`, `bar interior`, `ambience`, `gallery`, and `press`.
- Resolve full-resolution images before M3.
- Validate real image dimensions, magic bytes, content type, and safe filename before M3.
- Reject SVG, GIF, AVIF, BMP, unsupported content, obvious thumbnails, logos, icons, menu images, payment badges, maps, sprites, and awards before M3.
- Mark 512-1023px images as `below_preferred_resolution`.
- Prefer 1024px or larger for hero/card candidates.
- Suppress product-heavy candidates before M3 using filename, alt text, URL context, surrounding text, and source page context. Product-heavy images can pass only when a venue has no spatial candidates.
- Dedupe by normalized resolved URL and bytes hash.
- Stop before M3.

## Phase 2: M3 Vision

Required files:

- `*_m3_vision_chunk_XX_runYY_results.json`
- `*_m3_vision_merged.json`
- `*_m3_vision_merged.md`
- `*_m3_selected_candidates.json`

Rules:

- Use image bytes/base64 inline.
- No URL-only inference.
- No web scouting.
- No queue expansion.
- No fallback vision model.
- Preserve skipped records with explicit `skip_reason`.
- Merge chunks structurally without re-inference.

## Phase 3: Codex Validation

Required scripts:

- `scripts/pipeline/validate_batch_02_outputs.ts`
- `scripts/pipeline/build_batch_vision_queue.ts`
- `scripts/pipeline/validate_final_vision_queue.ts`
- `scripts/pipeline/import_external_image_candidates_dry_run.ts`
- `scripts/pipeline/import_venue_evidence_dry_run.ts`
- `scripts/pipeline/generate_batch_02_publish_readiness_report.ts`
- `scripts/pipeline/check_pipeline_safe_filenames.ts`

Rules:

- Dry-run only.
- No Supabase calls.
- No Cloudinary uploads.
- No migration execution.
- No public UI changes.
- A final queue is M3-ready only when the pre-M3 validation report has no failures.

## Batch 03 Pre-M3 Gate

Before M3, run:

```bash
npx tsx scripts/pipeline/build_batch_vision_queue.ts --input <candidate-input.json> --output <final-queue.json>
npx tsx scripts/pipeline/validate_final_vision_queue.ts --input <final-queue.json>
```

The validation target is:

- At least 15 venues with 2+ non-product spatial candidates.
- 0 unsupported formats.
- 0 known thumbnails.
- 0 images below 512px max dimension.
- 0 records with width, height, and content length all zero.
- All 512-1023px records marked `below_preferred_resolution`.
- All filenames Windows-safe.

## Naming Conventions

- Use lowercase ASCII filenames.
- Use underscores between semantic parts.
- Use configurable `runYY` suffixes.
- Keep filename run suffix and JSON `run_id` aligned.
- Avoid Windows-incompatible characters: `< > : " / \ | ? *`.
- Avoid hardcoded `run01` suffixes.

## Cron And Structural Work

Pause cron or scheduled automation before structural repo operations that rename, move, or regenerate batch artifacts. Resume only after validation reports confirm that expected files and run IDs line up.

## Failed M3 Chunks

- Keep completed chunks intact.
- Resume from the failed chunk only.
- Do not rerun successful chunks unless their input changed.
- Record retry attempts and transient download failures.
- Do not retry invalid format or below-min-dimension records.

## Readiness Definitions

Publish-ready requires:

- Explicit human approval.
- `publication_status: approved_for_publication`.
- Rights, face, identity, and resolution checks cleared.
- Strong hero/card candidates available.

Staging-ready means:

- Safe to import into validation staging only.
- All candidates remain `imported_needs_validation`.
- No public surfaces are updated.
- No Cloudinary publication path is triggered.
