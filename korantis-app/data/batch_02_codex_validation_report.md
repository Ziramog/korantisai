# Batch 02 Codex Validation Report

Generated: 2026-06-06T23:04:38.430Z
Input dir: `F:/Obsidian/obsidian-vault-main/Hermes/companies/korantis`

Publish ready: **false**
Staging ready: **partial**

## Confirmed Counts

| Metric | Value |
|---|---:|
| m2_venues_requested | 25 |
| m2_venues_processed | 25 |
| m2_raw_image_candidates | 176 |
| m2_final_vision_queue_pre_sanitizer | 75 |
| sanitized_m3_items | 52 |
| m3_total_items | 52 |
| m3_ok_photo | 30 |
| m3_skipped | 22 |
| m3_below_preferred_resolution | 22 |
| m3_unique_venues | 8 |

## Checks

- PASS: Required files parse as JSON - All required Batch 02 JSON files were parsed successfully; required Markdown handoff files were read.
- PASS: M2.7 provenance preserved - M2.7 manifest/source/sanitized/handoff files declare MiniMax-M2.7.
- PASS: M3 provenance preserved - M3 chunks, merged output, merged Markdown, and selected candidates declare MiniMax-M3.
- PASS: Sanitized queue count is 52 - Sanitized queue count: 52.
- PASS: M3 total items is 52 - Merged records: 52.
- PASS: M3 ok_photo count is 30 - ok_photo records: 30.
- PASS: M3 skipped count is 22 - Skipped records: 22.
- PASS: Skipped records have explicit skip_reason - Every skipped M3 record has skip_reason.
- PASS: No duplicate dedupe_hash - No duplicate dedupe_hash.
- PASS: No duplicate resolved_image_url - No duplicate resolved_image_url.
- PASS: No duplicate sha256 - No duplicate sha256.
- PASS: Queue fields preserved into M3 records - venue_name/source_url/resolved_image_url/dedupe_hash are present and stable.
- PASS: Required per-record fields present - Required queue and M3 record fields are present.
- PASS: No API key exposure - Scanned for: sk-cp, X-Api-Key, fdmU, MINIMAX_API_KEY=, SUPABASE_SERVICE_ROLE_KEY=, OPENAI_API_KEY=.
- PASS: No approved_for_publication values - No candidate value is approved_for_publication.
- PASS: Selected candidates remain imported_needs_validation - Selected candidate-like records checked: 6.
- PASS: Publication status is constrained - Only not_approved_for_publication/rejected appear in candidate publication_status.
- PASS: No vision_analyze fallback - M3 outputs do not mention vision_analyze.
- PASS: No web scouting in M3 outputs - M3 outputs remain visual classification outputs.
- PASS: No queue expansion in M3 outputs - Sanitized queue: 52; merged M3 records: 52.
- PASS: Known scene distribution confirmed - Scene distribution: {"logo":1,"product_food":18,"gallery_atmosphere":2,"hero_interior":6,"decorative":1,"hero_exterior":1,"crowd":1}.

## Conclusion

Batch 02 is not ready for publishing. It is partially ready for evidence/image candidate staging as dry-run output only.
