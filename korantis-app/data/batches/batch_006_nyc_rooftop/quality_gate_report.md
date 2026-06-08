# Stage 06 Final Quality Gate Report

- Batch: batch_006_nyc_rooftop
- Total venues: 12
- Ready for DB staging: 7
- Needs review: 0
- Blocked: 5

## Fields Validated

- has_hero_image
- has_tagline
- has_description
- has_two_mood_tags
- evidence_confidence_minimum
- not_published
- image_not_approved_for_publication
- no_hard_blockers

## Venue Decisions

| Venue | Status | Passed | Blockers | Warnings | Reason |
| --- | --- | --- | --- | --- | --- |
| Maison Provence Restaurant | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Woodhul Wine Bar | blocked | no | no_hero_image | missing_instagram | no_hero_image |
| Pinkerton Wine Bar | blocked | no | no_hero_image | missing_instagram | no_hero_image |
| With Others | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Olympia | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Black Mountain Wine House | blocked | no | no_hero_image | low_mood_confidence, missing_instagram | no_hero_image |
| Anaïs | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Balvanera | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Brick Wine Bar | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Somm Time | blocked | no | no_hero_image | missing_instagram, missing_price_hint | no_hero_image |
| Jadis | blocked | no | no_hero_image | low_mood_confidence, missing_instagram | no_hero_image |
| Ainslie Bowery | ready_for_db_staging | yes | none | missing_instagram | all quality gate fields passed; venue data eligible for Supabase staging sync only |

## Blocker Counts

- no_hero_image: 5

## Safety

- This gate only marks eligibility for future Supabase staging sync.
- No Supabase sync was run.
- No venue was published.
- No image was approved for publication.
- No MiniMax M3, MiniMax 2.7, OpenAI, or external model calls were made.
