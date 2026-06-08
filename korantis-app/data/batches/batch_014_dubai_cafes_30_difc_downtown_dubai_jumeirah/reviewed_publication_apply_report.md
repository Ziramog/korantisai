# Reviewed Publication Apply Report

- Batch: batch_014_dubai_cafes_30_difc_downtown_dubai_jumeirah
- Generated: 2026-06-08T20:25:56.420Z
- Approved requested: 18
- Cloudinary uploaded/existing: 18
- Public projected: 18
- Activation ready: 18
- Activated: 18
- Post-activation audit passed: 18
- Post-activation audit failed: 0
- Blocked: 0

## Steps

| Step | Status | Summary | Error |
| --- | --- | --- | --- |
| 11_public_projection_dry_run | completed | {"approved_projected":18,"skipped_count":12,"tolerated_pre_cloudinary_blockers":["Manual final approval is required before any public venues write.","Projected public venues must be inserted as curation_status pending_review; activation to active must be a separate later step.","Cloudinary materialization missing for 18 approved venue hero image(s)."]} |  |
| 10_cloudinary_apply | completed | {"uploaded":18,"skipped_existing":0,"errors":0} |  |
| 11_public_projection_apply | completed | {"approved_projected":18,"intended_write_count":36} |  |
| 12_activation_dry_run | completed | {"requested":18,"ready_to_activate":18,"blocked":0} |  |
| 12_activation_apply | completed | {"requested":18,"activated":18,"blocked":0} |  |
| 13_post_activation_audit | completed | {"requested":18,"passed":18,"failed":0} |  |

## Safety

- requires_reviewed_manifest: true
- requires_explicit_run_confirmation_in_control_center: true
- no_external_model_calls: true
- cloudinary_uploads_only_approved_heroes: true
- public_projection_writes_pending_review_before_activation: true
- activation_requires_cloudinary_hero: true
- post_activation_audit_required: true
- no_consumer_ui_changes: true
