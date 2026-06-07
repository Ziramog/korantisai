# Batch 03 Preflight Readiness Checklist

Use this checklist before any MiniMax-M3 calls. Do not publish, upload, write Supabase, or modify UI as part of this preflight.

## Required Inputs

- [ ] M2.7 venue text scout complete.
- [ ] Source preflight complete for each venue.
- [ ] Contact, reservation, menu, price, and factual evidence collected with source URLs.
- [ ] Candidate image list includes `venue_name`, `source_url`, `resolved_image_url`, `source_type`, and `rights_hint`.
- [ ] Candidate image list includes real `width`, `height`, and `content_length`, or byte probe data.
- [ ] Candidate image list includes `sha256` when bytes were downloaded.

## Source Targeting

- [ ] Official gallery pages searched.
- [ ] Press/media pages searched.
- [ ] Michelin gallery sources searched where available.
- [ ] 50 Best gallery sources searched where available.
- [ ] City tourism sources searched where relevant.
- [ ] Editorial reviews with venue interior photography searched.
- [ ] Search modifiers used: `interior`, `salon`, `salón`, `dining room`, `bar interior`, `ambience`, `gallery`, `press`.

## Pre-M3 Rejection Gates

- [ ] 0 SVG files in final queue.
- [ ] 0 GIF files in final queue.
- [ ] 0 AVIF files in final queue.
- [ ] 0 BMP files in final queue.
- [ ] 0 unsupported content types in final queue.
- [ ] 0 known thumbnails in final queue.
- [ ] 0 candidates below 512px max dimension in final queue.
- [ ] Every 512-1023px candidate is marked `below_preferred_resolution`.
- [ ] 0 records have width, height, and content length all zero.
- [ ] Obvious logos/icons/menu/payment/map/sprite/award images are rejected before M3.
- [ ] Duplicate resolved URLs removed.
- [ ] Duplicate `sha256` values removed.

## Product-Food Suppression

- [ ] Product-heavy candidates detected from filename, alt text, URL context, surrounding text, and source page context.
- [ ] Product-heavy candidates are not passed when the venue has spatial candidates.
- [ ] Product-heavy candidates retained only as fallback when a venue has no spatial candidates.
- [ ] M3 queue contains fewer product-food candidates than Batch 02.

## Success Criteria

- [ ] At least 15 venues have 2+ non-product spatial candidates before M3.
- [ ] Final queue has 0 unsupported formats.
- [ ] Final queue has 0 known thumbnails.
- [ ] Final queue has 0 all-zero width/height/content_length records.
- [ ] All generated filenames are Windows-safe.
- [ ] `npx tsx scripts/pipeline/build_batch_vision_queue.ts --input <candidate-input.json> --output <final-queue.json>` has produced a queue report.
- [ ] `npx tsx scripts/pipeline/validate_final_vision_queue.ts --input <final-queue.json>` has no failures.
- [ ] `npx eslint scripts/pipeline` passes.
- [ ] Added-script TypeScript check passes.

## Stop Conditions

- [ ] Do not call M3 until the final queue validation report passes.
- [ ] Do not call Supabase.
- [ ] Do not upload Cloudinary.
- [ ] Do not apply migrations.
- [ ] Do not approve publication.
- [ ] Do not modify consumer UI.
