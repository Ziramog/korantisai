# Full Batch Run Report

- Batch: batch_006_nyc_rooftop
- Generated: 2026-06-08T03:16:50.476Z
- Input venues: 12
- Mode: run

## Safety

- Supabase apply: false
- Cloudinary upload: false
- Public publish: false
- Consumer UI changes: false

## Stages

| Stage | Status | Output | Notes |
| --- | --- | --- | --- |
| 01_extract_data | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\stage_01_raw_venues.json | Completed. |
| 02_discover_sources | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\stage_02_source_discovery.json | Completed. |
| 03_discover_images | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\stage_03_final_vision_queue.json | Completed. |
| 04_classify_images | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\stage_04_selected_images.json | Completed. |
| connect_selected_images | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\batch_result_with_images.json | Completed. |
| 05_generate_editorial | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\batch_result_with_editorial.json | Completed. |
| 05_alias_enriched_result | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\batch_result_enriched.json | Completed. |
| 06_quality_gate | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\batch_result_quality_gated.json | Completed. |
| 07_generate_approval_manifest | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\approval_manifest.json | Completed. |
| 08_supabase_staging_dry_run | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\supabase_staging_dry_run.json | Completed. |
| 09_publication_review | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\publication_decision_manifest.json | Completed. |
| 11_public_projection_dry_run_if_reviewed | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\public_projection_dry_run.json | Completed. |
| 13_control_panel | completed | F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\pipeline_control_panel.html | Completed. |

## Final Outputs

- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\stage_01_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\stage_02_source_discovery_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\stage_03_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\stage_04_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\connect_selected_images_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\stage_05_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\quality_gate_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\approval_manifest_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\supabase_staging_dry_run_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\publication_review_report.md
- F:\KORANTIS\korantis-app\data\batches\batch_006_nyc_rooftop\pipeline_control_panel.html

## Next Action

Open pipeline_control_panel.html, review publication_review_dashboard.html, export publication_decision_manifest.reviewed.json, then run Cloudinary/hidden public apply commands from the control panel.
