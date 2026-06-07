-- Korantis public publication gate.
-- Purpose:
--   Allow pipeline-approved public venue rows to be inserted safely without
--   appearing in the consumer API until a later explicit activation step.
--
-- Safety:
--   - Additive only.
--   - Nullable/defaulted columns only.
--   - No table drops, renames, or destructive changes.
--   - Does not publish existing rows.

alter table if exists venues
  add column if not exists curation_status text default 'pending_review';

alter table if exists venues
  add column if not exists hero_image text;

alter table if exists venues
  add column if not exists taste_vector jsonb;

alter table if exists venues
  add column if not exists publication_metadata jsonb;

comment on column venues.curation_status is
  'Publication gate for Korantis public API. active rows are visible; pending_review/rejected/quarantined rows should remain hidden.';

comment on column venues.hero_image is
  'Optional direct hero image URL fallback. Canonical public images should also be represented in venue_images.';

comment on column venues.taste_vector is
  'Optional public taste vector payload. Null is allowed until vector generation is implemented.';

comment on column venues.publication_metadata is
  'Traceability metadata for pipeline publication projection and manual review decisions.';
