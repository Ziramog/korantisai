# Batch 02 Safe Filename Check

Generated: 2026-06-06T23:04:38.381Z
Input dir: `F:/Obsidian/obsidian-vault-main/Hermes/companies/korantis`

Windows-safe filenames: **true**
Unsafe names: none
run01 names: none
run02 names: korantis_ba_batch_02_m3_vision_chunk_01_run02_report.md, korantis_ba_batch_02_m3_vision_chunk_01_run02_results.json, korantis_ba_batch_02_m3_vision_chunk_02_run02_report.md, korantis_ba_batch_02_m3_vision_chunk_02_run02_results.json, korantis_ba_batch_02_m3_vision_chunk_03_run02_report.md, korantis_ba_batch_02_m3_vision_chunk_03_run02_results.json

## Recommendations

- Keep run suffix configurable instead of hardcoded.
- Use ASCII lowercase, digits, underscore, hyphen, and dot for generated filenames.
- Reject Windows-reserved characters before writing chunk or merge outputs.
- Keep run_id inside JSON aligned with the filename suffix.
