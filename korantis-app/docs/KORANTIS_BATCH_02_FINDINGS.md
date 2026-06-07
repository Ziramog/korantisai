# Korantis Batch 02 Findings

## Conclusion

Batch 02 is not ready for publishing. It is partially ready for evidence and external image candidate staging as dry-run output only.

## Confirmed Counts

- Sanitized M3 queue: 52 items.
- M3 ok_photo: 30.
- M3 skipped: 22.
- Skipped reason: below minimum dimension.
- Items below preferred resolution among ok_photo: 22.

## Scene Distribution

- `product_food`: 18.
- `hero_interior`: 6.
- `gallery_atmosphere`: 2.
- `logo`: 1.
- `decorative`: 1.
- `hero_exterior`: 1.
- `crowd`: 1.

## Selected Candidates

- Verne Club: hero interior candidate, below preferred resolution.
- Oporto Almacen: hero interior candidate, full resolution, strongest candidate.
- La Biela: hero exterior candidate, requires venue verification.
- Floreria Atlantico: hero interior candidate, below preferred resolution.
- Gran Bar Danzon: gallery/card candidate, below preferred resolution.

## Main Problems

- Many ok_photo results are product-food images.
- Many candidates are thumbnails or below preferred resolution.
- Only one strong full-resolution hero interior candidate emerged.
- Face release flags appear across otherwise usable candidates.
- The sanitizer did not validate real image dimensions before M3.

## Pipeline Fix

Move real image dimension, content type, magic bytes, and format validation before M3. Items below 512px must never reach M3. Items from 512px to 1023px should be marked `below_preferred_resolution` before M3 so the queue can prioritize stronger candidates.

## Batch 03 Hardening Actions

- Add `scripts/pipeline/image_prefilter_utils.ts` as the shared pre-M3 gate library.
- Use `scripts/pipeline/build_batch_vision_queue.ts` to build a smaller, higher-quality final queue.
- Use `scripts/pipeline/validate_final_vision_queue.ts` to block weak queues before M3.
- Source-target spatial photography first: official gallery, press/media, Michelin, 50 Best, city tourism, and editorial interior review pages.
- Suppress product-heavy images using only non-vision metadata: filename, alt text, URL context, surrounding text, and source page context.
- Reject logos, icons, menu images, payment badges, maps, sprites, awards, thumbnails, and unsupported formats before M3.
- Require real width/height/content length or byte-derived dimensions before M3.

## Batch 03 Target

- At least 15 venues with 2+ non-product spatial candidates before M3.
- 0 unsupported formats in the final queue.
- 0 known thumbnails in the final queue.
- 0 records with width, height, and content length all zero.
- Fewer product-food candidates reaching M3.
- All filenames Windows-safe.
