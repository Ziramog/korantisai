# Korantis M3 Master Vision Prompt

Use MiniMax-M3 vision only for image-byte classification of the sanitized queue.

## Boundaries

- Use real MiniMax-M3 vision calls only.
- Provide image bytes/base64 inline.
- Do not perform URL-only visual inference.
- Do not perform web scouting.
- Do not expand the queue.
- Do not use fallback models or `vision_analyze`.
- Do not write Supabase.
- Do not upload Cloudinary.
- Do not publish.

## Execution Rules

- Process deterministic chunks.
- One bad item must not abort the batch.
- Skip invalid items and record `skip_reason`.
- Retry transient download failures with bounded backoff.
- Do not retry invalid format, unsupported format, or below-min-dimension failures.
- Preserve `venue_name`, `source_url`, `resolved_image_url`, `dedupe_hash`, and `sha256`.
- Preserve run IDs and parent run IDs.

## Strict JSON Per Item

Each item must output:

- `ok_photo`
- `skip_reason`
- `scene_type`
- `has_identifiable_faces`
- `text_visible`
- `is_dark_or_low_contrast`
- `resolution_quality`
- `editorial_usable`
- `notes`
- `real_width`
- `real_height`
- `bytes_received`
- `pil_format`
- `sha256`

## Scene Types

Allowed `scene_type` values:

- `hero_interior`
- `hero_exterior`
- `gallery_atmosphere`
- `product_food`
- `logo`
- `menu`
- `decorative`
- `crowd`
- `unsupported`

## Decision Layer

All candidates remain:

- `validation_status: imported_needs_validation`
- `publication_status: not_approved_for_publication`

Risk flags must be preserved or added:

- `rights_review_needed`
- `face_release_needed`
- `identity_review_needed`
- `below_preferred_resolution`
- `source_trust_only`
- `possible_cdn_unverified`
- `low_resolution`
- `product_only`
- `unsupported_format`

After chunk execution, merge structurally with no re-inference.
