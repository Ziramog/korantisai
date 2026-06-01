-- Phase E: Venue Intelligence Foundation
-- Additive only. Does not modify public.venues or existing staging/discovery tables.

create table if not exists public.staging_venue_intelligence (
  id uuid primary key default gen_random_uuid(),
  staging_venue_id text,
  candidate_id text,
  google_place_id text,
  city text,
  district text,
  category text,
  scores jsonb not null default '{}'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  experience_signals jsonb not null default '{}'::jsonb,
  intent_scores jsonb not null default '{}'::jsonb,
  photo_intelligence jsonb not null default '{}'::jsonb,
  eligibility jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  derived_archetypes jsonb not null default '[]'::jsonb,
  version text not null default 'venue_intelligence_v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staging_venue_intelligence_candidate_id
  on public.staging_venue_intelligence (candidate_id);

create index if not exists idx_staging_venue_intelligence_google_place_id
  on public.staging_venue_intelligence (google_place_id);

create index if not exists idx_staging_venue_intelligence_city
  on public.staging_venue_intelligence (city);

create index if not exists idx_staging_venue_intelligence_district
  on public.staging_venue_intelligence (district);

create index if not exists idx_staging_venue_intelligence_category
  on public.staging_venue_intelligence (category);

create index if not exists idx_staging_venue_intelligence_version
  on public.staging_venue_intelligence (version);
