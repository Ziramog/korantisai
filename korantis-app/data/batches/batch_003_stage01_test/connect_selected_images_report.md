# Connect Selected Images Report

- Batch: batch_003_stage01_test
- Venues processed: 5
- Venues with hero_image attached: 4
- Venues still missing hero_image: 1
- Stage 04 venues without hero candidate: Verne Club
- Selected images rejected during mapping: 0

## Score Before/After

| Venue | Hero Attached | Before Score | After Score | Status | Remaining Blocking Errors |
| --- | --- | ---: | ---: | --- | --- |
| Verne Club | no | 24 | 32 | blocked | no_hero_image, missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum |
| Oporto Almacén | yes | 24 | 68 | blocked | missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum |
| Gran Bar Danzon | yes | 24 | 68 | blocked | missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum |
| La Biela | yes | 24 | 68 | blocked | missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum |
| Floreria Atlántico | yes | 24 | 68 | blocked | missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum |

## Mapping Issues

- none

## Expected Remaining Blockers

- Venues may still be blocked by editorial/evidence gaps until Stage 02 and Stage 05 are implemented.
- No venue was published.
- No image was approved for publication.
- No M3, MiniMax, Supabase, Cloudinary, deploy, or consumer UI calls were made.
