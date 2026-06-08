# Reviewed Publication Apply Report

- Batch: batch_006_nyc_rooftop
- Generated: 2026-06-08T20:57:54.546Z
- Approved requested: 7
- Cloudinary uploaded/existing: 7
- Public projected: 7
- Activation ready: 7
- Activated: 7
- Post-activation audit passed: 7
- Post-activation audit failed: 0
- Blocked: 0

## Steps

| Step | Status | Summary | Error |
| --- | --- | --- | --- |
| 11_public_projection_dry_run | completed | {"approved_projected":7,"skipped_count":5,"tolerated_pre_cloudinary_blockers":["Manual final approval is required before any public venues write.","Projected public venues must be inserted as curation_status pending_review; activation to active must be a separate later step.","Cloudinary materialization missing for 7 approved venue hero image(s)."]} |  |
| 10_cloudinary_apply | completed | {"uploaded":7,"skipped_existing":0,"errors":0} |  |
| 11_public_projection_apply | completed | {"approved_projected":7,"intended_write_count":14} |  |
| 12_activation_dry_run | completed | {"requested":7,"ready_to_activate":7,"blocked":0} |  |
| 12_activation_apply | completed | {"requested":7,"activated":7,"blocked":0} |  |
| 13_post_activation_audit | completed | {"requested":7,"passed":7,"failed":0} |  |

## Safety

- requires_reviewed_manifest: true
- requires_explicit_run_confirmation_in_control_center: true
- no_external_model_calls: true
- cloudinary_uploads_only_approved_heroes: true
- public_projection_writes_pending_review_before_activation: true
- activation_requires_cloudinary_hero: true
- post_activation_audit_required: true
- no_consumer_ui_changes: true
