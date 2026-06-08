# Full Batch Run Report

- Batch: batch_005_buenos_aires_restaurants_50
- Generated: 2026-06-08T01:25:49.822Z
- Input venues: 50
- Mode: run

## Safety

- Supabase apply: false
- Cloudinary upload: false
- Public publish: false
- Consumer UI changes: false

## Stages

| Stage | Status | Output | Notes |
| --- | --- | --- | --- |
| 01_extract_data | skipped_existing | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\stage_01_raw_venues.json | Skipped because output already exists. Pass --force to rerun. |
| 02_discover_sources | skipped_existing | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\stage_02_source_discovery.json | Skipped because output already exists. Pass --force to rerun. |
| 03_discover_images | skipped_existing | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\stage_03_final_vision_queue.json | Skipped because output already exists. Pass --force to rerun. |
| 04_classify_images | skipped_existing | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\stage_04_selected_images.json | Skipped because output already exists. Pass --force to rerun. |
| connect_selected_images | skipped_existing | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\batch_result_with_images.json | Skipped because output already exists. Pass --force to rerun. |
| 05_generate_editorial | skipped_existing | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\batch_result_with_editorial.json | Skipped because output already exists. Pass --force to rerun. |
| 05_alias_enriched_result | completed | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\batch_result_enriched.json | Completed. |
| 06_quality_gate | completed | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\batch_result_quality_gated.json | Completed. |
| 07_generate_approval_manifest | completed | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\approval_manifest.json | Completed. |
| 08_supabase_staging_dry_run | completed | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\supabase_staging_dry_run.json | Completed. |
| 09_publication_review | completed | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\publication_decision_manifest.json | Completed. |
| 11_public_projection_dry_run_if_reviewed | completed | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\public_projection_dry_run.json | Completed. |
| 13_control_panel | completed | F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\pipeline_control_panel.html | Completed. |

## Final Outputs

- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\stage_01_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\stage_02_source_discovery_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\stage_03_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\stage_04_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\connect_selected_images_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\stage_05_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\quality_gate_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\approval_manifest_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\supabase_staging_dry_run_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\publication_review_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_005_buenos_aires_restaurants_50\pipeline_control_panel.html

## Next Action

Open pipeline_control_panel.html, review publication_review_dashboard.html, export publication_decision_manifest.reviewed.json, then run Cloudinary/hidden public apply commands from the control panel.
