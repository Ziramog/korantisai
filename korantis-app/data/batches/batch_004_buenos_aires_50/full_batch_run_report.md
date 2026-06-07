# Full Batch Run Report

- Batch: batch_004_buenos_aires_50
- Generated: 2026-06-07T21:21:57.796Z
- Input venues: 50
- Mode: plan

## Safety

- Supabase apply: false
- Cloudinary upload: false
- Public publish: false
- Consumer UI changes: false

## Stages

| Stage | Status | Output | Notes |
| --- | --- | --- | --- |
| 01_extract_data | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\stage_01_raw_venues.json | Output already exists; normal run would skip unless --force is used. |
| 02_discover_sources | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\stage_02_source_discovery.json | Output already exists; normal run would skip unless --force is used. |
| 03_discover_images | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\stage_03_final_vision_queue.json | Output already exists; normal run would skip unless --force is used. |
| 04_classify_images | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\stage_04_selected_images.json | Output already exists; normal run would skip unless --force is used. |
| connect_selected_images | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\batch_result_with_images.json | Output already exists; normal run would skip unless --force is used. |
| 05_generate_editorial | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\batch_result_with_editorial.json | Output already exists; normal run would skip unless --force is used. |
| 05_alias_enriched_result | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\batch_result_enriched.json | Output missing; normal run would execute. |
| 06_quality_gate | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\batch_result_quality_gated.json | Output already exists; normal run would skip unless --force is used. |
| 07_generate_approval_manifest | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\approval_manifest.json | Output already exists; normal run would skip unless --force is used. |
| 08_supabase_staging_dry_run | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\supabase_staging_dry_run.json | Output already exists; normal run would skip unless --force is used. |
| 09_publication_review | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\publication_decision_manifest.json | Output already exists; normal run would skip unless --force is used. |
| 11_public_projection_dry_run_if_reviewed | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\public_projection_dry_run.json | Output already exists; normal run would skip unless --force is used. |
| 13_control_panel | planned | F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\pipeline_control_panel.html | Output already exists; normal run would skip unless --force is used. |

## Final Outputs

- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\stage_01_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\stage_02_source_discovery_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\stage_03_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\stage_04_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\connect_selected_images_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\stage_05_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\quality_gate_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\approval_manifest_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\supabase_staging_dry_run_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\publication_review_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\public_projection_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_004_buenos_aires_50\pipeline_control_panel.html

## Next Action

Run without --plan when ready.
