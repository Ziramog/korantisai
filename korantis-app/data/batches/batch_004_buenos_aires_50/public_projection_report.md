# Stage 10/11 Public Projection Dry Run - batch_004_buenos_aires_50

## Summary

- Generated at: 2026-06-07T21:17:39.796Z
- Total reviewed decisions: 50
- Approved projected: 30
- Paused skipped: 18
- Rejected skipped: 2
- Invalid approved skipped: 0
- Intended venues writes: 30
- Intended venue_images writes: 30

## Schema Compatibility

- Read-only live probe attempted: true
- Read-only live probe succeeded: true
- Tables detected: venues, venue_images

### venues

- Found: true
- Columns found: id, name, city, category, location, coordinates, card_size, spacing, hero_image, atmosphere, quality, tagline, narrative, tags, curation_status, taste_vector, publication_metadata
- Missing columns: none
- Decision: All expected public projection columns found.

### venue_images

- Found: true
- Columns found: id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id, source, status, rights_status, is_selected_hero, selection_data
- Missing columns: none
- Decision: All expected public projection columns found.

## Blockers Before Real Apply

- Manual final approval is required before any public venues write.
- Projected public venues must be inserted as curation_status pending_review; activation to active must be a separate later step.

## Safety Confirmations

- no_supabase_writes: true
- no_public_venues_writes: true
- no_cloudinary_uploads: true
- no_image_rights_approval: true
- no_external_model_calls: true
- no_consumer_ui_changes: true
- no_deploy: true
- apply_disabled: true

## Next Step

Review `public_projection_mapping.md`. A future apply stage must be explicitly enabled before any public write.