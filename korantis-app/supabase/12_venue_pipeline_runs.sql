-- Proposal only. Do not apply until Batch 02 staging is explicitly approved.
-- Additive schema for preserving pipeline run provenance.

create table if not exists public.venue_pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  run_id text not null,
  parent_run_id text null,
  phase text not null check (
    phase in ('m2_7_prep', 'm3_vision', 'codex_validation', 'dry_run_import', 'manual_review')
  ),
  model_used text null,
  model_provenance jsonb not null default '{}'::jsonb,
  input_files jsonb not null default '[]'::jsonb,
  output_files jsonb not null default '[]'::jsonb,
  status text not null default 'imported_needs_validation' check (
    status in ('imported_needs_validation', 'approved_for_staging', 'rejected')
  ),
  publication_status text not null default 'not_approved_for_publication' check (
    publication_status in ('not_approved_for_publication', 'approved_for_publication', 'rejected')
  ),
  items_requested integer null,
  items_processed integer null,
  items_ok_photo integer null,
  items_skipped integer null,
  started_at timestamptz null,
  finished_at timestamptz null,
  notes text null,
  raw_manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venue_pipeline_runs_counts_check check (
    (items_requested is null or items_requested >= 0)
    and (items_processed is null or items_processed >= 0)
    and (items_ok_photo is null or items_ok_photo >= 0)
    and (items_skipped is null or items_skipped >= 0)
  )
);

create unique index if not exists venue_pipeline_runs_run_id_idx
  on public.venue_pipeline_runs (run_id);

create index if not exists venue_pipeline_runs_batch_phase_idx
  on public.venue_pipeline_runs (batch_id, phase);

create index if not exists venue_pipeline_runs_parent_idx
  on public.venue_pipeline_runs (parent_run_id);

create index if not exists venue_pipeline_runs_status_idx
  on public.venue_pipeline_runs (status, publication_status);
