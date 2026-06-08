# Korantis Public Catalog Audit

- Generated: 2026-06-08T21:15:18.926Z
- Mode: read_only_public_catalog_audit
- Supabase URL present: yes
- Supabase key present: yes
- Used service role: yes

## Summary

- public_venues_read: 139
- public_images_read: 1087
- staging_venues_read: 54
- quality_scores_read: 54
- active: 73
- pending_review: 66
- other_status: 0
- keep: 120
- fix: 19
- review_remove: 0
- remove_candidate: 0
- missing_geo: 0
- missing_hero: 2
- missing_cloudinary_hero: 2
- duplicates: 0
- chain_or_generic_brand_candidates: 0

## Table Reads

| Table | Found | Rows | Error |
| --- | --- | ---: | --- |
| venues | yes | 139 |  |
| venue_images | yes | 1087 |  |
| staging_venues | yes | 54 |  |
| quality_scores | yes | 54 |  |

## Remove Candidates

- none

## Review For Removal

- none

## Fix Before Scaling

- 878 Bar (ChIJy4qUv4q1vJUR8rayMlrFSIg): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Anchoita (ChIJ-dd4uo21vJURyRbXtTjQNlU): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Apu Nena (ChIJ9VPPDEW1vJUR5pnE3ycOTSU): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Blanca Deco and Cafe (ChIJHUjYLsO1vJUR3Miis48-MSE): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Cabaña Las Lilas (ChIJ7yoB8i01o5URXijw57yzW0U): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Corte Comedor (ChIJRz6gfke1vJURQy4TWxMJuSY): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Crisol (4403e7f1-09f5-4323-af0f-aae6df2b899d): Fix data before considering expansion: missing_or_short_description; blockers=missing_or_short_description; warnings=none
- Crisol Café (f770000d-7187-444e-8ee7-524645aa6824): Fix data before considering expansion: missing_hero_image; blockers=missing_hero_image; warnings=none
- El Cuartito (ChIJKcgRZLjKvJURv0XnanBXRCg): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Gran Bar Danzon (ChIJh9Qpx7nKvJURLoDB8VNMen8): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Guerrin (ChIJm86rLcTKvJURjRPk21bRoro): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Julia (ChIJMZMCq4y1vJURRfysuSq4vCA): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Melbourne Café (8775369b-fefd-4691-b298-de4b937e16a9): Fix data before considering expansion: missing_hero_image; blockers=missing_hero_image; warnings=none
- Milion (ChIJT1fyLrnKvJURP1-qNQDw3Kg): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Mixtape Bar (ChIJVfJW2oe1vJUR2NfFT9Dj6Ws): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Plaza Bar (ChIJhQIMStM0o5URWvHT37YudbM): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Reliquia (ChIJaZuHKES1vJURFUHa25lVQRI): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Roux (ChIJKYYltZnKvJUR1B3un_qNkho): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none
- Vini Bar (ChIJGfegidK1vJURGaueRjMuAc0): Fix data before considering expansion: missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; blockers=missing_or_short_tagline, missing_or_short_description, fewer_than_two_mood_tags; warnings=none

## Duplicate Groups

- none

## Safety

- read_only_supabase: true
- no_supabase_writes: true
- no_cloudinary_uploads: true
- no_external_model_calls: true
- no_publication_changes: true
- no_consumer_ui_changes: true

## Important

- This report does not delete or hide venues.
- Treat `remove_candidate` as a manual review queue, not an automatic deletion command.
- Chain/generic brand detection is conservative and should be reviewed by a human.
