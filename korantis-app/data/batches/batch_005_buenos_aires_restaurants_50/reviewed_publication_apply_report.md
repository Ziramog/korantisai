# Reviewed Publication Apply Report

- Batch: batch_005_buenos_aires_restaurants_50
- Generated: 2026-06-08T02:21:36.049Z
- Approved requested: 18
- Cloudinary uploaded/existing: 18
- Public projected: 18
- Activation ready: 18
- Activated: 18
- Blocked: 0

## Steps

| Step | Status | Summary | Error |
| --- | --- | --- | --- |
| 11_public_projection_dry_run | completed | {"approved_projected":18,"skipped_count":32,"tolerated_pre_cloudinary_blockers":["Manual final approval is required before any public venues write.","Projected public venues must be inserted as curation_status pending_review; activation to active must be a separate later step.","Cloudinary materialization missing for 18 approved venue hero image(s)."]} |  |
| 10_cloudinary_apply | completed | {"uploaded":18,"skipped_existing":0,"errors":0} |  |
| 11_public_projection_apply | completed | {"approved_projected":18,"intended_write_count":36} |  |
| 12_activation_dry_run | completed | {"requested":18,"ready_to_activate":18,"blocked":0} |  |
| 12_activation_apply | completed | {"requested":18,"activated":18,"blocked":0} |  |

## Safety

- requires_reviewed_manifest: true
- requires_explicit_run_confirmation_in_control_center: true
- no_external_model_calls: true
- cloudinary_uploads_only_approved_heroes: true
- public_projection_writes_pending_review_before_activation: true
- activation_requires_cloudinary_hero: true
- no_consumer_ui_changes: true
