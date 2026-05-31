-- Phase D: Curated Discovery Engine
-- Additive only. Does not modify existing venue, staging, image, review, embedding, or quality tables.

create table if not exists public.city_districts (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  district text not null,
  subdistrict text,
  priority integer not null default 0,
  venue_target integer not null default 0,
  district_identity_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(city, district, subdistrict)
);

create table if not exists public.discovery_sources (
  id uuid primary key default gen_random_uuid(),
  source text not null unique,
  source_type text not null check (source_type in ('editorial', 'community')),
  base_url text,
  authority_score integer not null default 50 check (authority_score >= 0 and authority_score <= 100),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_venues (
  candidate_id uuid primary key default gen_random_uuid(),
  city text not null,
  district text not null,
  venue_name text not null,
  canonical_name text not null,
  aliases text[] not null default '{}',
  category text not null,
  source_count integer not null default 0,
  editorial_mentions integer not null default 0,
  community_mentions integer not null default 0,
  district_mentions integer not null default 0,
  consensus_score integer not null default 0 check (consensus_score >= 0 and consensus_score <= 100),
  discovery_score integer not null default 0 check (discovery_score >= 0 and discovery_score <= 100),
  sources jsonb not null default '[]'::jsonb,
  discovery_notes text,
  status text not null default 'discovered' check (status in (
    'discovered',
    'pending_editorial_review',
    'approved_for_enrichment',
    'rejected',
    'merged'
  )),
  merged_into uuid references public.candidate_venues(candidate_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(city, canonical_name, district)
);

create table if not exists public.candidate_source_mentions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidate_venues(candidate_id) on delete cascade,
  venue_name text not null,
  canonical_name text not null,
  source text not null,
  source_url text not null,
  city text not null,
  district text not null,
  category text not null,
  context text,
  rank_position integer,
  source_type text not null check (source_type in ('editorial', 'community')),
  created_at timestamptz not null default now()
);

create index if not exists idx_city_districts_city_priority on public.city_districts (city, priority desc);
create index if not exists idx_candidate_venues_city_status on public.candidate_venues (city, status);
create index if not exists idx_candidate_venues_discovery_score on public.candidate_venues (discovery_score desc);
create index if not exists idx_candidate_source_mentions_candidate on public.candidate_source_mentions (candidate_id);
create index if not exists idx_candidate_source_mentions_source on public.candidate_source_mentions (source);
