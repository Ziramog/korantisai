# Stage 06 Final Quality Gate Report

- Batch: batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side
- Total venues: 25
- Ready for DB staging: 14
- Needs review: 0
- Blocked: 11

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
| Paper Sons Cafe | blocked | no | no_hero_image | missing_instagram, missing_price_hint | no_hero_image |
| Café Colmado | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Yanni's Coffee | blocked | no | no_hero_image | low_mood_confidence, missing_instagram, missing_price_hint | no_hero_image |
| Sip Coffee & Matcha | blocked | no | no_hero_image | low_mood_confidence, missing_instagram, missing_price_hint | no_hero_image |
| Intelligentsia Coffee High Line Hotel Coffeebar | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| RHYTHM ZERO \| WEST VILLAGE | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Bakeri | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| A&C Super | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Paris Baguette | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Black Star Bakery & Cafe | blocked | no | no_hero_image | low_mood_confidence, missing_instagram | no_hero_image |
| Dawn’s Til Dusk | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Tous Les Jours | blocked | no | no_hero_image | low_mood_confidence, missing_instagram | no_hero_image |
| Almondine Bakery | blocked | no | no_hero_image | low_mood_confidence, missing_instagram | no_hero_image |
| Burrow | blocked | no | no_hero_image | low_mood_confidence, missing_instagram, missing_price_hint | no_hero_image |
| Rex | blocked | no | no_hero_image | low_mood_confidence, missing_instagram, missing_price_hint | no_hero_image |
| Kaida Coffee and Bakery | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Bourke Street Bakery | blocked | no | no_hero_image | missing_instagram | no_hero_image |
| La Bergamote (Chelsea) | blocked | no | no_hero_image | low_mood_confidence, missing_instagram | no_hero_image |
| Claude Bakery West Village | blocked | no | no_hero_image | low_mood_confidence, missing_instagram | no_hero_image |
| maman | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Aux Merveilleux de Fred | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| maman | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Stumptown Coffee Roasters | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Pura Vida - NoMad | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |
| Nick + Sons Bakery | ready_for_db_staging | yes | none | medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed | all quality gate fields passed; venue data eligible for Supabase staging sync only |

## Blocker Counts

- no_hero_image: 11

## Safety

- This gate only marks eligibility for future Supabase staging sync.
- No Supabase sync was run.
- No venue was published.
- No image was approved for publication.
- No MiniMax M3, MiniMax 2.7, OpenAI, or external model calls were made.
