# Batch 02 Runner Hardening Report

Generated: 2026-06-06

## Files Inspected

- `F:/Obsidian/obsidian-vault-main/Hermes/companies/korantis/run_m3_vision_chunks_batch02.py`
- `F:/Obsidian/obsidian-vault-main/Hermes/companies/korantis/_runner/merge_run02.py`

The files were inspected as read-only inputs. No runner file was modified.

## Findings

- The M3 runner still hardcodes `_run01` in output filenames and internal `run_id` values.
- The merge script expects `_run02` chunk files and validates that run IDs were renamed to run02.
- The runner already has a preflight mode, chunked execution, PIL magic-byte validation, allowed PIL formats, skip handling, sha256 dedupe, and redacted key logging.
- The runner uses `Accept: image/jpeg,image/png,image/webp;q=0.9;q=0.8`; this should be normalized to `Accept: image/jpeg,image/png,image/webp;q=0.9`.
- The dimension gate exists in the M3 runner, but Batch 02 shows it must move earlier into M2.7 sanitizer/preflight so thumbnails never reach M3.
- The runner catches per-item exceptions so one bad item does not abort the full chunk.
- No fallback vision model or `vision_analyze` path was found in the inspected runner references.

## Required Fixes

- Remove the hardcoded `_run01` suffix.
- Add a configurable run suffix, for example `--run-suffix run02`.
- Keep filename suffix and JSON `run_id` aligned.
- Add a dry-run/preflight mode that validates all outputs without M3 calls.
- Add real dimension gate before M3 in the M2.7 sanitizer.
- Reject SVG, GIF, and AVIF before M3.
- Normalize content negotiation to `Accept: image/jpeg,image/png,image/webp;q=0.9`.
- Validate magic bytes via PIL before queueing and before M3.
- Ensure no API key or key fragment can appear in logs, reports, raw error bodies, or JSON output.
- Enforce safe filenames before writing chunk and merge artifacts.
- Add chunk-level resume metadata.
- Add retry strategy for transient downloads.
- Do not retry invalid format, unsupported format, or below-min-dimension items.
- Preserve no fallback vision model as a hard invariant.

## Recommendation

Move real image validation into the M2.7 preparation phase, then let M3 classify only byte-validated, dimension-qualified image candidates. This is the main pipeline fix before Batch 03.
