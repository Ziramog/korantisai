-- Proposal only. Do not apply until Batch 02 staging is explicitly approved.
-- Additive staging schema for contact, price, factual evidence, and fetch diagnostics.

alter table if exists public.venue_contact_links
  add column if not exists batch_id text null,
  add column if not exists run_id text null,
  add column if not exists model_used text null,
  add column if not exists source_url text null,
  add column if not exists validation_status text not null default 'imported_needs_validation' check (
    validation_status in ('imported_needs_validation', 'approved_for_staging', 'rejected')
  ),
  add column if not exists publication_status text not null default 'not_approved_for_publication' check (
    publication_status in ('not_approved_for_publication', 'approved_for_publication', 'rejected')
  ),
  add column if not exists raw_pipeline_record jsonb not null default '{}'::jsonb;

create index if not exists venue_contact_links_batch_run_idx
  on public.venue_contact_links (batch_id, run_id);

create index if not exists venue_contact_links_validation_status_idx
  on public.venue_contact_links (validation_status, publication_status);

create table if not exists public.venue_price_signals (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  run_id text not null,
  model_used text not null,
  venue_id uuid null references public.venues(id) on delete set null,
  venue_name text not null,
  source_url text not null,
  price_text text not null,
  currency_hint text null,
  confidence numeric null check (confidence is null or (confidence >= 0 and confidence <= 100)),
  validation_status text not null default 'imported_needs_validation' check (
    validation_status in ('imported_needs_validation', 'approved_for_staging', 'rejected')
  ),
  publication_status text not null default 'not_approved_for_publication' check (
    publication_status in ('not_approved_for_publication', 'approved_for_publication', 'rejected')
  ),
  raw_pipeline_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists venue_price_signals_unique_source_idx
  on public.venue_price_signals (batch_id, venue_name, source_url, price_text);

create index if not exists venue_price_signals_venue_idx
  on public.venue_price_signals (venue_id, venue_name);

create index if not exists venue_price_signals_status_idx
  on public.venue_price_signals (validation_status, publication_status);

create table if not exists public.venue_factual_evidence (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  run_id text not null,
  model_used text not null,
  venue_id uuid null references public.venues(id) on delete set null,
  venue_name text not null,
  source_url text not null,
  source_type text null,
  source_quality text null,
  fact text not null,
  evidence_text text null,
  validation_status text not null default 'imported_needs_validation' check (
    validation_status in ('imported_needs_validation', 'approved_for_staging', 'rejected')
  ),
  publication_status text not null default 'not_approved_for_publication' check (
    publication_status in ('not_approved_for_publication', 'approved_for_publication', 'rejected')
  ),
  raw_pipeline_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists venue_factual_evidence_unique_fact_idx
  on public.venue_factual_evidence (batch_id, venue_name, source_url, md5(fact));

create index if not exists venue_factual_evidence_venue_idx
  on public.venue_factual_evidence (venue_id, venue_name);

create index if not exists venue_factual_evidence_status_idx
  on public.venue_factual_evidence (validation_status, publication_status);

create table if not exists public.venue_fetch_diagnostics (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  run_id text not null,
  model_used text not null,
  venue_id uuid null references public.venues(id) on delete set null,
  venue_name text not null,
  source_url text not null,
  diagnostic_type text not null,
  status text not null,
  message text null,
  http_status integer null,
  content_type text null,
  bytes_received integer null,
  validation_status text not null default 'imported_needs_validation' check (
    validation_status in ('imported_needs_validation', 'approved_for_staging', 'rejected')
  ),
  publication_status text not null default 'not_approved_for_publication' check (
    publication_status in ('not_approved_for_publication', 'approved_for_publication', 'rejected')
  ),
  raw_pipeline_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists venue_fetch_diagnostics_unique_source_idx
  on public.venue_fetch_diagnostics (batch_id, venue_name, source_url, diagnostic_type);

create index if not exists venue_fetch_diagnostics_venue_idx
  on public.venue_fetch_diagnostics (venue_id, venue_name);

create index if not exists venue_fetch_diagnostics_status_idx
  on public.venue_fetch_diagnostics (validation_status, publication_status);
