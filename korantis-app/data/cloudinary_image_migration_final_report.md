# Cloudinary Image Migration Final Report

Generated: 2026-06-01T12:41:13.906Z

## Preflight

- Write ready: yes
- Schema missing columns: none

## Database Coverage After Upsert

- Total public venues: 50
- Database fallback count: 3
- Database legacy proxy count: 0
- Image rows missing Cloudinary public_id: 301

## Ref Collection

- Target venues: 50
- Venues with refs: 47
- Unsafe/no-match warnings: 3

## Materialization

- Mode: write
- Images uploaded: 281
- Dry-run images: 0
- Upload/materialization errors: 1

## Upsert

- Mode: write
- venue_images inserted: 132
- venue_images updated: 149
- venue_images skipped: 0
- Upsert schema blockers: none

## Final Coverage

- /api/venues count: 50
- Cloudinary hero count: 0
- Final fallback count: 3
- Final legacy proxy count: 47
- Final gallery complete count: 47

## Unresolved Venues

- Total unresolved: 3
- Crisol Café: no photo refs or unsafe match
- Invernadero: no photo refs or unsafe match
- Melbourne Café: no photo refs or unsafe match

## Commands Run

- npx tsx scripts/images/00_preflight_image_materialization.ts
- npx tsx scripts/images/0_audit_public_venue_images.ts
- npx tsx scripts/images/1_collect_missing_venue_photo_refs.ts --include-legacy --google-search
- npx tsx scripts/images/2_materialize_google_place_images_to_cloudinary.ts --dry-run
- npx tsx scripts/images/2_materialize_google_place_images_to_cloudinary.ts --write
- npx tsx scripts/images/3_upsert_venue_images.ts --dry-run
- npx tsx scripts/images/3_upsert_venue_images.ts --write
- npx tsx scripts/images/4_verify_public_venue_images.ts

## Visual Production Readiness

PENDING DEPLOY: database has Cloudinary-backed venue_images, but production /api/venues is still returning legacy /api/venue-images proxy URLs.
