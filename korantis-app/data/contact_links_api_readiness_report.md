# Contact Links API Readiness Report

Generated: 2026-06-01T17:26:51.537Z

## Current /api/venues Contact Fields

- Response fields present on sample venue: id, name, category, location, cardSize, spacing, heroImage, cardImage, imageUrl, galleryImages, images, atmosphere, quality, tagline, narrative, tags, tasteVector, lat, lng
- Nested contact object present: no
- Phone field present: no
- Website field present: no
- Google Maps field present: no
- Instagram field present: no
- WhatsApp field present: no
- Reservation field present: no

## Source Data Availability

- Phone links from Google enrichment: 10
- Website links from Google enrichment: 17
- Google Maps links from Google enrichment: 18

## Recommended Future Shape

```json
{
  "contact": {
    "phone": null,
    "website": null,
    "instagram": null,
    "whatsapp": null,
    "reservationUrl": null,
    "googleMapsUrl": null
  }
}
```

## Recommendation

- Add `venue_contact_links` first, then expose a normalized `contact` object through `/api/venues` after data has been verified.
- Do not add UI consumption until source confidence and explicit-link rules are stable.
