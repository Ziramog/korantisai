-- Venue data curation reset.
-- Additive only: do not drop or delete existing generated data.

alter table public.venues
  add column if not exists curation_status text not null default 'active'
    check (curation_status in ('active', 'pending_review', 'rejected', 'quarantined', 'needs_reprocess')),
  add column if not exists hero_image text,
  add column if not exists eligibility_score integer,
  add column if not exists eligibility jsonb,
  add column if not exists evidence jsonb,
  add column if not exists primary_atmosphere text,
  add column if not exists best_for text[] not null default '{}',
  add column if not exists not_ideal_for text[] not null default '{}',
  add column if not exists curation_notes text;

alter table public.staging_venues
  add column if not exists curation_status text not null default 'pending_review'
    check (curation_status in ('active', 'pending_review', 'rejected', 'quarantined', 'needs_reprocess')),
  add column if not exists eligibility_score integer,
  add column if not exists eligibility jsonb,
  add column if not exists evidence jsonb,
  add column if not exists primary_atmosphere text,
  add column if not exists best_for text[] not null default '{}',
  add column if not exists not_ideal_for text[] not null default '{}',
  add column if not exists grounded_description text,
  add column if not exists curation_notes text;

alter table public.venue_images
  add column if not exists photo_scores jsonb,
  add column if not exists hero_suitability_score integer,
  add column if not exists rejection_reason text;

create index if not exists idx_venues_curation_status on public.venues (curation_status);
create index if not exists idx_staging_venues_curation_status on public.staging_venues (curation_status);

