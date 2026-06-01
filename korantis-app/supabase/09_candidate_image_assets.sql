create table if not exists public.candidate_image_assets (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null,
  staging_venue_id text null,
  google_place_id text null,
  venue_name text not null,
  city text not null,
  district text null,
  normalized_category text null,
  url text null,
  public_id text not null,
  role text not null check (role in ('hero', 'card', 'gallery')),
  sort_order integer not null default 0,
  source text not null default 'google_places',
  google_photo_reference text not null,
  width integer null,
  height integer null,
  quality_score numeric null,
  hero_suitability_score numeric null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists candidate_image_assets_public_id_idx
  on public.candidate_image_assets (public_id);

create unique index if not exists candidate_image_assets_google_photo_ref_idx
  on public.candidate_image_assets (candidate_id, google_photo_reference);

create index if not exists candidate_image_assets_candidate_role_sort_idx
  on public.candidate_image_assets (candidate_id, role, sort_order);

create index if not exists candidate_image_assets_google_place_id_idx
  on public.candidate_image_assets (google_place_id);

