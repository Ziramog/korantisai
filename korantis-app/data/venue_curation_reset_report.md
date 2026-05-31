# Venue Curation Reset Report

Generated: 2026-05-31T15:44:10.680Z

## Safety Baseline

- Backup directory: data/db_backups/venue_curation_reset_2026-05-31T15-39-08-247Z
- Backed up tables: venues, staging_venues, venue_images, venue_reviews, venue_embeddings, quality_scores, pipeline_jobs.
- No database rows were deleted.
- No live quarantine updates were applied because the curation schema is not applied yet.

## Live Schema Findings

- public.venues currently lacks curation_status, eligibility, evidence, primary_atmosphere, best_for, not_ideal_for, and curation_notes.
- staging_venues currently has pipeline status, but lacks curation_status and evidence/eligibility fields.
- Additive SQL created: supabase/06_venue_curation_reset_schema.sql.
- /api/venues is now curation_status-aware and will only return active rows when the column exists.

## Dry-run Eligibility Results

- Evaluated venues: 50
- Active candidates: 13
- Pending review: 33
- Rejected: 4
- Full machine-readable output: data/venue_curation_evaluation.json.

## Lowest-scoring Examples

| Venue | Category | Score | Proposed status | Reason |
|---|---|---:|---|---|
| John & Joe | Café de Especialidad | cafe | 44 | rejected | Insufficient hospitality or atmosphere evidence |
| Koofi | Café de especialidad | cafe | 44 | rejected | Insufficient hospitality or atmosphere evidence |
| Origen Coffee House | cafe | 47 | rejected | Insufficient hospitality or atmosphere evidence |
| Bari Coffee & Drinks | cafe | 50 | rejected | Insufficient hospitality or atmosphere evidence |
| Toki Moment - Specialty Coffee | cafe | 55 | pending_review | weak atmosphere/seating evidence |
| Tona Café | cafe | 55 | pending_review | weak atmosphere/seating evidence |
| 787 Coffee | cafe | 56 | pending_review | weak atmosphere/seating evidence |
| 787 Coffee | cafe | 56 | pending_review | weak atmosphere/seating evidence |
| Café Boheme - Café de Especialidad | cafe | 56 | pending_review | weak atmosphere/seating evidence |
| CICHAUS | cocktail_bar | 59 | pending_review | weak atmosphere/seating evidence |
| Wine Window Argentina (Palermo Soho) | wine_bar | 59 | pending_review | weak atmosphere/seating evidence |
| TERRASOHO - Specialty Coffee | cafe | 60 | pending_review | weak atmosphere/seating evidence |

## Pipeline Changes Implemented

- Added curation schema SQL with curation_status, eligibility score, evidence object, grounded description, taxonomy fields, and photo scoring placeholders.
- Added scripts/ingestion/9_evaluate_curation.ts for eligibility scoring and evidence extraction.
- Added scripts/ingestion/10_quarantine_generated_venues.ts for dry-run/apply quarantine marking.
- Updated scripts/ingestion/3_extract_atmosphere.ts to generate grounded 45-70 word microcopy instead of long poetic prose.
- Updated /api/venues to hide non-active curation rows once curation_status exists.

## Required Next Step Before Applying Quarantine

Apply supabase/06_venue_curation_reset_schema.sql to the live Supabase database. After that:

1. Run `npx tsx scripts/ingestion/10_quarantine_generated_venues.ts --apply`.
2. Run `npx tsx scripts/ingestion/9_evaluate_curation.ts --apply`.
3. Reprocess rejected/pending venues from source evidence before publishing them as active.
4. Keep the public feed limited to `curation_status = active` via the API.

## Current Blocker

The service-role Supabase client cannot run DDL, and no direct database connection string or Supabase CLI migration path was available in this environment. The reset is prepared but live quarantine cannot be safely applied until the additive schema is applied.
