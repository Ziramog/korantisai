# Korantis M2.7 Master Pipeline Prompt

Use MiniMax-M2.7 for preparation only. Stop before MiniMax-M3 vision.

## Boundaries

- Do not publish.
- Do not upload to Cloudinary.
- Do not write Supabase.
- Do not modify `public.venues` or `venue_images`.
- Do not approve any image for publication.
- Do not run M3.

## Required Phases

1. Text scout each venue.
2. Source preflight for official site, official social, trusted editorial, and reservation/menu surfaces.
3. Extract contact, reservation, menu, price, and factual evidence with source URLs preserved.
4. Run source-specific image search, preferring official and venue-controlled sources.
5. Target pages likely to contain spatial venue photography:
   - official gallery pages
   - press/media pages
   - Michelin galleries
   - 50 Best galleries
   - city tourism pages
   - editorial reviews with venue interiors
   - queries containing `interior`, `salon`, `salón`, `dining room`, `bar interior`, `ambience`, `gallery`, and `press`
6. Resolve full-resolution image URLs before queueing.
7. Probe each resolved image with real `GET` or `HEAD`, and prefer `GET` when CDNs hide dimensions.
8. Validate magic bytes and content type from the response body, not only from URL extension.
9. Extract dimensions using PIL or equivalent image decoder.
10. Sanitize filenames to Windows-safe ASCII before writing any file.
11. Reject SVG, GIF, AVIF, BMP, and unsupported content before M3.
12. Reject images below 512px max dimension before M3.
13. Mark images from 512px to 1023px max dimension as `below_preferred_resolution`.
14. Prefer images at or above 1024px max dimension for strong candidates.
15. Reject obvious logos, icons, menu images, payment badges, maps, sprites, and awards before M3.
16. Suppress product-heavy candidates before M3 using filename, alt text, URL context, surrounding text, and source page context. Do not pass product-heavy images unless the venue has no spatial candidates.
17. Dedupe by normalized resolved URL and bytes hash.
18. Split final queue into deterministic chunks.
19. Produce a Codex handoff report with counts, risks, skipped items, and required files.

## Output Contract

Each queued image item must include:

- `venue_name`
- `source_url`
- `original_image_url`
- `resolved_image_url`
- `source_type`
- `source_quality`
- `rights_hint`
- `width`
- `height`
- `content_type`
- `content_length`
- `dedupe_hash`
- `sha256` when bytes were downloaded
- `risk_flags`
- `source_targeting`
- `prefilter_notes`
- `validation_status: imported_needs_validation`
- `publication_status: not_approved_for_publication`

## Stop Condition

Stop after producing the sanitized M3 queue, chunk files, manifest, and Codex handoff. M2.7 must not make vision calls or infer image contents from URL text alone.

## Batch 03 Success Criteria

- At least 15 venues have 2 or more non-product spatial candidates before M3.
- Final M3 queue contains 0 SVG, GIF, AVIF, BMP, or unsupported formats.
- Final M3 queue contains 0 known thumbnails.
- Final M3 queue contains 0 records where width, height, and content length are all zero.
- Product-food candidates are materially reduced before M3.
- All generated filenames are Windows-safe.
