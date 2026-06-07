-- Proposal only. Do not apply until pipeline staging is explicitly approved.
-- Additive schema for AI-first defensive staging batches and candidates.

create table if not exists public.pipeline_batches (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  city text not null,
  status text not null default 'needs_review' check (
    status in (
      'auto_staged',
      'needs_review',
      'blocked',
      'approved',
      'rejected',
      'staged',
      'published'
    )
  ),
  input_count integer not null default 0,
  auto_staged_count integer not null default 0,
  needs_review_count integer not null default 0,
  blocked_count integer not null default 0,
  approved_count integer not null default 0,
  rejected_count integer not null default 0,
  staged_count integer not null default 0,
  published_count integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  stage_statuses jsonb not null default '[]'::jsonb,
  cost_data jsonb not null default '{}'::jsonb,
  runtime_data jsonb not null default '{}'::jsonb,
  errors text[] not null default '{}',
  warnings text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pipeline_batches_batch_id_idx
  on public.pipeline_batches (batch_id);

create index if not exists pipeline_batches_status_idx
  on public.pipeline_batches (status);

create index if not exists pipeline_batches_city_created_idx
  on public.pipeline_batches (city, created_at desc);

create table if not exists public.pipeline_candidates (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  candidate_key text not null,
  venue_name text not null,
  status text not null default 'needs_review' check (
    status in (
      'auto_staged',
      'needs_review',
      'blocked',
      'approved',
      'rejected',
      'staged',
      'published'
    )
  ),
  venue_data jsonb not null default '{}'::jsonb,
  image_candidates jsonb not null default '[]'::jsonb,
  evidence_data jsonb not null default '{}'::jsonb,
  errors text[] not null default '{}',
  warnings text[] not null default '{}',
  staging_score integer not null default 0 check (staging_score >= 0 and staging_score <= 100),
  review_reason text null,
  published_venue_id uuid null,
  approved_at timestamptz null,
  rejected_at timestamptz null,
  staged_at timestamptz null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.pipeline_candidates.published_venue_id is
  'Nullable UUID reserved for future linkage to public.venues. No FK is declared here because existing venue id compatibility should be confirmed before applying this proposal.';

create unique index if not exists pipeline_candidates_batch_candidate_key_idx
  on public.pipeline_candidates (batch_id, candidate_key);

create index if not exists pipeline_candidates_batch_status_idx
  on public.pipeline_candidates (batch_id, status);

create index if not exists pipeline_candidates_venue_name_idx
  on public.pipeline_candidates (venue_name);

create index if not exists pipeline_candidates_score_idx
  on public.pipeline_candidates (batch_id, staging_score desc);

create index if not exists pipeline_candidates_errors_gin_idx
  on public.pipeline_candidates using gin (errors);

create index if not exists pipeline_candidates_warnings_gin_idx
  on public.pipeline_candidates using gin (warnings);
