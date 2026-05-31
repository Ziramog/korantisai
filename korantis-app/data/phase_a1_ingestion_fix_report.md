# Phase A.1 Ingestion Fix Report

Generated: 2026-05-31T16:44:50.496Z

## Summary

- Phase A venues evaluated: 10
- ready_for_review: 0
- pending_review: 0
- rejected: 10
- Venues with reviews: 10
- Venues with L3 embeddings: 10
- Venues with prose <= 70 words: 10
- Average eligibility score: 48.2
- Average prose word count: 55.9
- Venues missing rating/userRatingCount: 0
- Venues missing acceptable hero photo: 10
- Venues downgraded because of weak seating or atmosphere signal: 10
- Venues rejected for speculative atmosphere: 0

## Canonical Data Preservation

- PASS: Phase A staging venues preserve rating and userRatingCount where available.

## Venue Matrix

| Venue | Status | Eligibility | Seating | Hospitality | Atmosphere | Photo | Review Signal | Rejection | Warnings |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| Wine Window Argentina (Palermo Soho) | rejected | 49 | 80 | 85 | 32 | 0 | 38 | no_acceptable_hero_photo | no_acceptable_hero_photo, product_or_menu_photos_present, storefront_only_photos_present, weak_atmosphere_signal |
| Koofi | Café de especialidad | rejected | 24 | 25 | 73 | 2 | 0 | 0 | no_acceptable_hero_photo | no_acceptable_hero_photo, no_visible_seating, product_or_menu_photos_present, storefront_only_photos_present, takeaway_or_product_signal, no_atmosphere_signal, weak_seating_signal, weak_atmosphere_signal |
| Import Coffee Co. | rejected | 55 | 80 | 85 | 46 | 0 | 63 | no_acceptable_hero_photo | no_acceptable_hero_photo, product_or_menu_photos_present, weak_atmosphere_signal |
| Kaldi | rejected | 52 | 80 | 85 | 37 | 0 | 50 | no_acceptable_hero_photo | no_acceptable_hero_photo, product_or_menu_photos_present, storefront_only_photos_present, weak_atmosphere_signal |
| Don Julio Parrilla | rejected | 52 | 80 | 85 | 38 | 0 | 50 | no_acceptable_hero_photo | no_acceptable_hero_photo, product_or_menu_photos_present, storefront_only_photos_present, weak_atmosphere_signal |
| El Preferido de Palermo | rejected | 61 | 80 | 85 | 60 | 0 | 88 | no_acceptable_hero_photo | no_acceptable_hero_photo, product_or_menu_photos_present, storefront_only_photos_present, weak_atmosphere_signal |
| Ciro Palermo | rejected | 49 | 80 | 85 | 31 | 0 | 38 | no_acceptable_hero_photo | no_acceptable_hero_photo, product_or_menu_photos_present, storefront_only_photos_present, weak_atmosphere_signal |
| CICHAUS | rejected | 49 | 80 | 85 | 32 | 0 | 38 | no_acceptable_hero_photo | no_acceptable_hero_photo, product_or_menu_photos_present, weak_atmosphere_signal |
| Origen Coffee House | rejected | 39 | 80 | 73 | 10 | 0 | 13 | no_acceptable_hero_photo | no_acceptable_hero_photo, product_or_menu_photos_present, storefront_only_photos_present, takeaway_or_product_signal, weak_atmosphere_signal |
| RITA® Specialty Coffee Armenia | rejected | 52 | 80 | 85 | 39 | 0 | 50 | no_acceptable_hero_photo | no_acceptable_hero_photo, product_or_menu_photos_present, weak_atmosphere_signal |

## Before / After Prose Examples

### Wine Window Argentina (Palermo Soho)

Before: Bathed in the soft glow of hanging Edison bulbs, the air inside this charming venue hums with an inviting warmth, a refuge from the stifling heat outside. The gentle rustle of laughter and clinking glasses intertwines, creating a vibrant chorus that dances between solitude and camaraderie.

After: Wine Window Argentina offers a relaxed environment to enjoy wine tastings paired with small plates, including house-made empanadas. Guests generally appreciate the friendly staff and engaging atmosphere. This venue has a modern vibe with a hint of history, though it may feel more like a quick stop than a long stay.

### Koofi | Café de especialidad

Before: Previous poetic Phase A copy was replaced during Phase A.1.

After: Koofi is a specialty coffee stand providing quality beverages alongside large, tasty cookies. Known for its expertly brewed coffee and attentive staff, it’s a convenient spot for a quick caffeine fix. The service is friendly, with a focus on a quick service experience, making it suitable for those on the go.

### Import Coffee Co.

Before: Bathed in the soft, amber glow of early morning light, the venue unfolds like a secret garden tucked within the bustling streets of Buenos Aires. The air is laced with a gentle hum of social energy.

After: Import Coffee Co. is a popular coffee shop known for its exceptional brews and welcoming atmosphere. Located near WeWork offices, it serves a range of options including pour-over coffee, vegan pastries, and avocado toast. Customers appreciate the knowledgeable staff and relaxed vibe, making it an ideal spot for quick meetings or to unwind alone. Limited seating may affect longer stays.

### Kaldi

Before: In the gentle embrace of morning light, Kaldi unfolds like a well-loved book, each page a soft invitation to linger. Inside, a symphony of muted conversations hums beneath the hum of espresso machines.

After: Kaldi offers a casual atmosphere with limited indoor and outdoor seating, ideal for a quick breakfast or coffee on the go. The menu includes simple items like croissants and yogurt bowls, paired with straightforward coffee options. Service is described as polite and efficient, although some reviews indicate mixed experiences with staff demeanor and language barriers.

### Don Julio Parrilla

Before: In the hushed embrace of Don Julio, time unfurls gently, inviting the echoes of soft conversation and the delicate clink of glasses to linger in the air.

After: Don Julio Parrilla offers an elevated dining experience with a focus on expertly prepared Argentine steak and attentive service. Expect complimentary prosecco and snacks while you wait, and explore their well-curated wine selection. Reservations are recommended well in advance due to high demand. It’s important to note that the atmosphere can be busy, particularly during peak times.

## Photo Scoring

- Photo scoring artifact: data/phase_a_photo_scores.json
- Rule enforced: no acceptable hero photo means the venue cannot become ready_for_review.
- Current result: 10/10 Phase A venues have no acceptable hero photo according to the scorer.

## Verdict

Phase A.1 remains blocked from Phase B. The pipeline is technically complete for the 10 Phase A venues, but editorial readiness fails because no venue has an acceptable hero photo and most have weak atmosphere evidence. No venues were published.
