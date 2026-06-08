# Full Batch Run Report

- Batch: batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side
- Generated: 2026-06-08T13:49:28.687Z
- Input venues: 25
- Mode: run

## Safety

- Supabase apply: false
- Cloudinary upload: false
- Public publish: false
- Consumer UI changes: false

## Stages

| Stage | Status | Output | Notes |
| --- | --- | --- | --- |
| 01_extract_data | skipped_existing | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\stage_01_raw_venues.json | Skipped because output already exists. Pass --force to rerun. |
| 02_discover_sources | skipped_existing | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\stage_02_source_discovery.json | Skipped because output already exists. Pass --force to rerun. |
| 03_discover_images | skipped_existing | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\stage_03_final_vision_queue.json | Skipped because output already exists. Pass --force to rerun. |
| 04_classify_images | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\stage_04_selected_images.json | Completed. |
| connect_selected_images | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\batch_result_with_images.json | Completed. |
| 05_generate_editorial | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\batch_result_with_editorial.json | Completed. |
| 05_alias_enriched_result | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\batch_result_enriched.json | Completed. |
| 06_quality_gate | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\batch_result_quality_gated.json | Completed. |
| 07_generate_approval_manifest | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\approval_manifest.json | Completed. |
| 08_supabase_staging_dry_run | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\supabase_staging_dry_run.json | Completed. |
| 09_publication_review | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\publication_decision_manifest.json | Completed. |
| 11_public_projection_dry_run_if_reviewed | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\public_projection_dry_run.json | Completed. |
| 13_control_panel | completed | F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\pipeline_control_panel.html | Completed. |

## Final Outputs

- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\stage_01_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\stage_02_source_discovery_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\stage_03_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\stage_04_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\connect_selected_images_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\stage_05_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\quality_gate_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\approval_manifest_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\supabase_staging_dry_run_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\publication_review_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side\pipeline_control_panel.html

## Next Action

Open pipeline_control_panel.html, review publication_review_dashboard.html, export publication_decision_manifest.reviewed.json, then run Cloudinary/hidden public apply commands from the control panel.
