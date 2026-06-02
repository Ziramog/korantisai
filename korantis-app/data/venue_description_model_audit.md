# Venue Description Model Audit

Generated: 2026-06-02T11:41:49.741Z
Runtime source inspected: /api/venues (66 active venues)

## Current Display Path

| UI area | Current source | Status | Notes |
|---|---|---|---|
| Hero category | public.venues.category -> /api/venues.category -> localizeVenueForDisplay.displayCategory | canonical/generated | Category exists, but normalized_category is not exposed in /api/venues. |
| Hero atmosphere | public.venues.atmosphere -> /api/venues.atmosphere | canonical/generated | Display localized through dictionary. |
| Quote/tagline | public.venues.tagline -> /api/venues.tagline | generated/canonical copy | Often poetic and not practical enough. |
| Body narrative | public.venues.narrative -> /api/venues.narrative | generated/canonical copy | Often atmospheric but missing fit/caveats. |
| Tags | public.venues.tags -> /api/venues.tags | generated/fallback | Useful as weak signals; not enough for decision support. |
| Price block | dictionary fallback only | missing | No runtime price_level is exposed. |
| Reservation hint | not displayed | missing | No reservation/contact field exposed. |
| Best-for | not explicit | missing | Can be inferred cautiously from category/tags/atmosphere. |
| Gallery | venue_images -> /api/venues.galleryImages | available | Useful evidence for visual/spatial confidence. |

## Canonical Fields Available in public.venues via /api/venues

- id, name, createdAt, updatedAt
- category, location, atmosphere, quality
- tagline, narrative, tags
- heroImage, cardImage, imageUrl, galleryImages/images
- tasteVector, lat, lng

## Fields Missing for Useful Venue Descriptions

- price_level / price band
- reservation availability or reservation URL
- opening hours by daypart
- rating and review_count in consumer API
- normalized_category in consumer API
- intent scores such as dinner/date/work/wine/cocktail
- verified noise level, seating/laptop suitability, and practical constraints

## V2 Decision

Venue Description Model v2 is implemented as a presentation-layer model. It does not rewrite public.venues and it does not invent missing facts. Missing practical fields are surfaced as cautious caveats such as price not confirmed and reservation not confirmed.
