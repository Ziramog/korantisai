# Reviewed Publication Apply Report

- Batch: batch_009_new_york_cafes_25_williamsburg_dumbo_lower_east_side
- Generated: 2026-06-08T20:58:34.783Z
- Approved requested: 14
- Cloudinary uploaded/existing: 14
- Public projected: 0
- Activation ready: 0
- Activated: 0
- Post-activation audit passed: 0
- Post-activation audit failed: 0
- Blocked: 0

## Steps

| Step | Status | Summary | Error |
| --- | --- | --- | --- |
| 11_public_projection_dry_run | completed | {"approved_projected":14,"skipped_count":11,"tolerated_pre_cloudinary_blockers":["Manual final approval is required before any public venues write.","Projected public venues must be inserted as curation_status pending_review; activation to active must be a separate later step.","Cloudinary materialization missing for 14 approved venue hero image(s)."]} |  |
| 10_cloudinary_apply | completed | {"uploaded":13,"skipped_existing":1,"errors":0} |  |
| 11_public_projection_apply | failed | {} | Stage 11 venues upsert failed: ON CONFLICT DO UPDATE command cannot affect row a second time |

## Safety

- requires_reviewed_manifest: true
- requires_explicit_run_confirmation_in_control_center: true
- no_external_model_calls: true
- cloudinary_uploads_only_approved_heroes: true
- public_projection_writes_pending_review_before_activation: true
- activation_requires_cloudinary_hero: true
- post_activation_audit_required: true
- no_consumer_ui_changes: true
