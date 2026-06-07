# Korantis AI-First Staging Pipeline

## Official Thesis

AI produces in batch. Scripts block garbage. M3 validates real images. Codex normalizes and integrates. Dashboard concentrates review. Human approves by batch. Staging protects. Publication scales.

## Old Handoff Model vs New Orchestrator Model

The old handoff model produced useful artifacts, but ownership was split across prompts, reports, and manual file interpretation. The new orchestrator model gives each batch a deterministic shell:

- One batch input file.
- One typed data contract.
- One scoring and staging stage.
- One review dashboard.
- One batch result artifact.
- No direct publication path.

AI remains useful for high-volume generation, but defensive scripts decide what can move forward.

## Stage List

1. `01_extract_data`: future venue source extraction.
2. `02_collect_evidence`: future contact, hours, reservation, pricing, and factual evidence collection.
3. `03_discover_images`: future spatial image candidate discovery.
4. `04_classify_images`: future M3 image validation with real bytes.
5. `05_generate_editorial`: future editorial copy and mood generation.
6. `06_score_and_stage`: deterministic local scoring and status assignment.
7. `07_stage_to_supabase`: future staging write after explicit approval.
8. `08_promote_staged`: future promotion path after human approval.

## Human Role

Humans approve by batch, not by scattered script output. The dashboard concentrates blocked records, needs-review records, image risks, evidence gaps, and staging score. Approval remains explicit and separate from generation.

## Staging Role

Staging protects production tables and consumer UI. Candidates can be blocked, needs_review, auto_staged, approved, rejected, staged, or published, but this MVP does not write Supabase data or publish anything.

## Batch 03 Success Criteria

- A valid 25-venue input file exists.
- Orchestrator creates `data/batches/<batch_id>/batch_result.json`.
- Orchestrator creates `data/batches/<batch_id>/dashboard.html`.
- Deterministic scoring assigns blocked/needs_review/auto_staged without external calls.
- No consumer UI files are imported or modified.
- No Supabase writes, Cloudinary uploads, M3 calls, or deployments occur.

## What Not To Build Yet

- Google Places API client.
- Review scraper.
- Instagram scraper.
- Automatic Cloudinary upload.
- Production publish script.
- Public app preview mode.
- Automated venue discovery.
- Cron or scheduler.
- Prompt auto-tuning.
