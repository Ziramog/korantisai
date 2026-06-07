# Stage 06 Final Quality Gate Report

- Batch: batch_003_stage01_test
- Total venues: 5
- Ready for DB staging: 4
- Needs review: 0
- Blocked: 1

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
| Verne Club | blocked | no | no_hero_image | missing_instagram | no_hero_image |
| Oporto Almacén | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Gran Bar Danzon | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| La Biela | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Floreria Atlántico | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |

## Blocker Counts

- no_hero_image: 1

## Safety

- This gate only marks eligibility for future Supabase staging sync.
- No Supabase sync was run.
- No venue was published.
- No image was approved for publication.
- No MiniMax M3, MiniMax 2.7, OpenAI, or external model calls were made.
