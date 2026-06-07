-- Proposal only. Do not apply until Batch 02 staging is explicitly approved.
-- Additive schema for external image candidates discovered by the multi-model pipeline.

create table if not exists public.external_image_candidates (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  run_id text not null,
  model_used text not null,
  venue_id uuid null references public.venues(id) on delete set null,
  venue_name text not null,
  source_url text not null,
  original_image_url text null,
  resolved_image_url text not null,
  source_type text null,
  source_quality text null,
  rights_hint text null,
  dedupe_hash text not null,
  sha256 text null,
  validation_status text not null default 'imported_needs_validation' check (
    validation_status in ('imported_needs_validation', 'approved_for_staging', 'rejected')
  ),
  publication_status text not null default 'not_approved_for_publication' check (
    publication_status in ('not_approved_for_publication', 'approved_for_publication', 'rejected')
  ),
  image_role text not null default 'reference_only' check (
    image_role in ('hero_candidate', 'card_candidate', 'gallery_candidate', 'reference_only', 'rejected')
  ),
  scene_type text null,
  has_identifiable_faces boolean not null default false,
  text_visible jsonb not null default '[]'::jsonb,
  is_dark_or_low_contrast boolean not null default false,
  resolution_quality text null,
  editorial_usable boolean not null default false,
  notes text null,
  real_width integer null,
  real_height integer null,
  bytes_received integer null,
  pil_format text null,
  rights_review_needed boolean not null default true,
  face_release_needed boolean not null default false,
  identity_review_needed boolean not null default false,
  below_preferred_resolution boolean not null default false,
  source_trust_only boolean not null default false,
  possible_cdn_unverified boolean not null default false,
  low_resolution boolean not null default false,
  product_only boolean not null default false,
  unsupported_format boolean not null default false,
  raw_m3_response jsonb not null default '{}'::jsonb,
  raw_pipeline_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_image_candidates_dimensions_check check (
    (real_width is null or real_width >= 0)
    and (real_height is null or real_height >= 0)
    and (bytes_received is null or bytes_received >= 0)
  )
);

create unique index if not exists external_image_candidates_batch_dedupe_idx
  on public.external_image_candidates (batch_id, dedupe_hash);

create unique index if not exists external_image_candidates_batch_url_idx
  on public.external_image_candidates (batch_id, resolved_image_url);

create unique index if not exists external_image_candidates_batch_sha256_idx
  on public.external_image_candidates (batch_id, sha256)
  where sha256 is not null;

create index if not exists external_image_candidates_venue_name_idx
  on public.external_image_candidates (venue_name);

create index if not exists external_image_candidates_status_role_idx
  on public.external_image_candidates (validation_status, publication_status, image_role);

create index if not exists external_image_candidates_risk_flags_idx
  on public.external_image_candidates (
    rights_review_needed,
    face_release_needed,
    identity_review_needed,
    below_preferred_resolution,
    low_resolution,
    product_only
  );
