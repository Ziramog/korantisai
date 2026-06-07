-- Korantis pipeline staging bridge proposal.
-- PLAN ONLY: do not apply automatically from Codex.
-- Purpose: add nullable staging fields needed before Stage 08 can safely run in apply mode.
-- Safety: additive only; no drops, renames, public.venues changes, or consumer-runtime changes.

begin;

alter table public.staging_venues
  add column if not exists enrichment_data jsonb,
  add column if not exists pipeline_batch_id text,
  add column if not exists pipeline_status text,
  add column if not exists eligibility_score numeric,
  add column if not exists primary_atmosphere text,
  add column if not exists mood_tags text[];

alter table public.venue_images
  add column if not exists selection_data jsonb,
  add column if not exists rights_status text,
  add column if not exists is_selected_hero boolean;

alter table public.quality_scores
  add column if not exists pipeline_quality_data jsonb;

create index if not exists idx_staging_venues_pipeline_batch_id
  on public.staging_venues (pipeline_batch_id);

create index if not exists idx_staging_venues_pipeline_status
  on public.staging_venues (pipeline_status);

create index if not exists idx_venue_images_selected_hero
  on public.venue_images (venue_id, is_selected_hero)
  where is_selected_hero is true;

commit;
