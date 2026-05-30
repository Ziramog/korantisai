-- Enable the pgvector extension
create extension if not exists vector;

-- Drop existing tables to ensure clean schema application
drop table if exists public.staging_venues cascade;
drop table if exists public.venues cascade;
drop table if exists public.venue_images cascade;
drop table if exists public.venue_reviews cascade;
drop table if exists public.venue_embeddings cascade;
drop table if exists public.quality_scores cascade;
drop table if exists public.pipeline_jobs cascade;

-- 1. STAGING VENUES
-- Holds venues discovered from Google Places before they are enriched and approved.
create table public.staging_venues (
  id text primary key, -- google_place_id
  name text not null,
  city text not null, -- 'buenos_aires', 'new_york'
  category_seed text not null, -- e.g., 'cafe', 'restaurant'
  status text not null default 'pending', -- 'pending', 'enriched', 'ready_for_review', 'rejected', 'published'
  
  -- Extracted during Pipeline
  canonical_data jsonb,
  atmosphere_prose text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PUBLISHED VENUES
-- The final, curated dataset for the Korantis frontend.
create table public.venues (
  id text primary key, -- google_place_id
  name text not null,
  city text not null,
  category text not null,
  location text not null, -- neighborhood or address
  coordinates jsonb not null, -- {lat, lng}
  
  -- Curated Metadata
  card_size text not null check (card_size in ('immersive', 'cinematic', 'layered', 'compact')),
  spacing text not null check (spacing in ('tight', 'breathe', 'isolated')),
  atmosphere text not null check (atmosphere in ('morning', 'afternoon', 'golden-hour', 'night', 'late-night', 'dawn')),
  quality real not null,
  
  -- Content
  tagline text not null,
  narrative text not null,
  tags text[] not null default '{}',
  
  -- Semantic Vectors
  l2_vector vector(384), -- Editorial vector
  l3_vector vector(384), -- Crowd vector
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. VENUE IMAGES
-- Stores metadata and references for photos. Full WebP/Storage migration deferred to Phase 5.3.
create table public.venue_images (
  id uuid default gen_random_uuid() primary key,
  venue_id text not null, -- references staging_venues or venues
  photo_reference text not null, -- Google Places photo reference
  width integer,
  height integer,
  html_attributions jsonb,
  is_cover boolean default false,
  status text not null default 'reference_only', -- 'reference_only', 'downloaded', 'processed'
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. VENUE REVIEWS
-- The raw corpus of reviews used for Layer 3 extraction.
create table public.venue_reviews (
  id uuid default gen_random_uuid() primary key,
  venue_id text not null,
  author_name text,
  rating integer,
  text text not null,
  time timestamp with time zone,
  language text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. VENUE EMBEDDINGS (Archive/Audit Trail)
-- Optional table if we want to store historical embeddings.
create table public.venue_embeddings (
  id uuid default gen_random_uuid() primary key,
  venue_id text not null,
  layer text not null check (layer in ('L2', 'L3')),
  embedding vector(384) not null,
  model_name text not null, -- 'Xenova/all-MiniLM-L6-v2'
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. QUALITY SCORES
-- Tracks the resonance and completeness of a venue before publication.
create table public.quality_scores (
  venue_id text primary key,
  review_count integer default 0,
  has_images boolean default false,
  has_prose boolean default false,
  has_embeddings boolean default false,
  
  resonance_score real, -- cosine similarity between L2 and L3
  editorial_themes text[],
  crowd_themes text[],
  overlap_themes text[],
  interpretation_notes text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. PIPELINE JOBS
-- Tracks the execution state of the ingestion pipeline.
create table public.pipeline_jobs (
  id uuid default gen_random_uuid() primary key,
  venue_id text not null,
  step_name text not null, -- '1_fetch_places', '2_fetch_reviews', etc.
  status text not null check (status in ('pending', 'running', 'success', 'error')),
  error_message text,
  
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- HNSW Indexes for Vector similarity search
create index on public.venues using hnsw (l3_vector vector_l2_ops);
create index on public.venue_embeddings using hnsw (embedding vector_l2_ops);

-- Triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_staging_venues_updated_at before update on public.staging_venues for each row execute procedure public.handle_updated_at();
create trigger handle_venues_updated_at before update on public.venues for each row execute procedure public.handle_updated_at();
create trigger handle_quality_scores_updated_at before update on public.quality_scores for each row execute procedure public.handle_updated_at();

-- Enable Row Level Security (RLS) on all tables to silence Supabase warnings
alter table public.staging_venues enable row level security;
alter table public.venues enable row level security;
alter table public.venue_images enable row level security;
alter table public.venue_reviews enable row level security;
alter table public.venue_embeddings enable row level security;
alter table public.quality_scores enable row level security;
alter table public.pipeline_jobs enable row level security;

-- Allow public read access to the published 'venues' and their 'venue_images'
create policy "Allow public read access to published venues" on public.venues for select to public using (true);
create policy "Allow public read access to venue images" on public.venue_images for select to public using (true);

