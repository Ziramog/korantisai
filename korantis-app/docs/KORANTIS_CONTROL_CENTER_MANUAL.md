# Korantis Control Center Manual

This manual explains how to operate the local Korantis pipeline control center.

The control center is a local operator tool. It is not the consumer UI and it is not deployed.

## Start The Control Center

From `F:\KORANTIS\korantis-app`:

```powershell
npx tsx pipeline/control_center_server.ts
```

Open:

```text
http://localhost:4317
```

If port `4317` is already running, refresh the browser.

## What The Control Center Shows

The top-right selector chooses the batch.

Each batch can be in one of these states:

- `plan`: only a seed plan or partial output exists.
- `seed`: Stage 00 selected venues.
- `ready`: venues passed the quality gate and can be reviewed.
- `projected`: venues were written into public tables as `pending_review`.
- `active`: venues are live in public production.

Main counters:

- `Ready`: venues that passed deterministic quality gate.
- `Blocked`: venues that still failed the quality gate.
- `Approved`: venues manually approved in the publication review manifest.
- `Cloudinary`: approved hero images uploaded to Cloudinary.
- `Projected`: venues written to public tables as `pending_review`.
- `Activated`: venues made public with `curation_status = active`.
- `Activation ready`: projected venues ready to activate.
- `Image errors`: Cloudinary upload errors.
- `Audit failed`: active venues from the batch that failed post-activation checks.
- `Rollback eligible`: active venues from the batch that can be moved back to `pending_review`.

## Normal Operating Flow

Use this sequence for a new batch:

1. Create and run a new batch.
2. Wait for the console to finish.
3. Open the publication review dashboard.
4. Approve, reject, or pause venues.
5. Run Cloudinary upload.
6. Apply hidden public projection.
7. Run activation dry-run.
8. Activate public venues.
9. Run post-activation audit.

Activation is the live step. Post-activation audit is the safety verification step after live activation.

## Create A New Batch

Use the `New Batch` panel in the control center.

Fields:

- `Batch id`: unique id, for example `batch_005_buenos_aires_restaurants_50`.
- `City`: choose `Buenos Aires`, `New York`, or `Dubai`.
- `Count`: number of venues to select.
- `Neighborhoods`: six curated areas appear as checkboxes for the selected city. Leave all checked for the default city pass, or uncheck areas for a tighter run.
- `Batch type`: choose one of the supported Korantis operating types.

Supported batch types:

- `Bars`: maps to a Korantis bar mix: cocktail bars, speakeasies, wine bars, neighborhood bars, and a small rooftop/terrace slice.
- `Cafes`: maps to Stage 00 type mix `cafes=<count>`.
- `Restaurants`: maps to Stage 00 type mix `restaurants=<count>`.

Do not use mixed free-form type mixes for normal operation yet. The current production machine is intentionally constrained to these three operating types so selection stays predictable and auditable.

Rooftop is not a primary Korantis venue type. It is treated as a spatial attribute inside bars or restaurants. A rooftop-only batch can still be run from the CLI for experiments, but it is not part of the normal dashboard workflow.

Restaurants should be atmosphere-forward only. Korantis is not a food guide; restaurants with strong food but weak room/mood signal should be rejected or paused during review.

Default city neighborhoods:

- `Buenos Aires`: Palermo, Chacarita, Villa Crespo, Colegiales, Recoleta, San Telmo.
- `New York`: Williamsburg, DUMBO, Lower East Side, NoMad, Chelsea, West Village.
- `Dubai`: DIFC, Downtown Dubai, Jumeirah, Dubai Marina, Palm Jumeirah, Business Bay.

The batch runner will avoid venues already known locally or in Supabase when read access is available.

## Plan Versus Run

`Plan new batch`:

- Does not call Google Places.
- Does not call M3.
- Does not call MiniMax.
- Does not upload Cloudinary.
- Does not write Supabase.
- Only shows what command would run.

`Run new batch`:

- Runs Stage 00 selection.
- Continues the full pipeline.
- Calls Google Places, M3, and MiniMax where required.
- Stops before manual publication decisions.

## Manual Review

After a batch finishes, open `Publication review dashboard`.

Default state is pause. You decide:

- `approve`: venue can move toward public publishing.
- `reject`: venue should not continue.
- `pause`: keep it for later.

The reviewed manifest must be named:

```text
publication_decision_manifest.reviewed.json
```

## Cloudinary

Run `Upload approved heroes to Cloudinary` after the reviewed manifest exists.

This uploads approved hero images only.

Expected good result:

- `uploaded` equals approved count.
- `errors` equals 0.

## Gallery Selection

Run `Build gallery selection` after Stage 04 exists if you want secondary images for venue detail review.

This stage is local and deterministic. It:

- reads existing MiniMax-M3 Stage 04 image results
- selects up to three secondary gallery images per venue
- excludes the selected hero, product-only images, logos, menus, crowds, and face-heavy photos
- prefers atmosphere/interior/exterior context images
- writes only local `stage_15_gallery_selection.json` and report files

It does not upload Cloudinary, write Supabase, publish, or call M3 again.

## Hidden Public Projection

Run `Apply hidden public projection`.

This writes approved venues to public tables with:

```text
curation_status = pending_review
```

That means the data is loaded but not visible on the public site.

## Activation

Run `Activation dry-run` first.

Expected:

```text
ready = approved projected count
blocked = 0
```

Then run `Activate public venues`.

This flips:

```text
pending_review -> active
```

That is the step that makes venues visible on the site.

## Post-Activation Audit

Run `Run post-activation audit` after activation.

This is read-only. It checks:

- public venue row exists
- `curation_status = active`
- coordinates are valid and inside configured city bounds
- tagline, narrative, and tags exist
- Cloudinary hero image exists
- Cloudinary image URL resolves
- `publication_metadata.batch_id` matches the selected batch

Expected:

```text
failed = 0
```

If audit fails, do not consider the batch finished. Review `Post-activation audit report`.

## Rollback

Run `Rollback batch dry-run` before any rollback apply.

Expected dry-run for an active batch:

```text
eligible = activated count
blocked = 0
```

Run `Rollback batch apply` only if you need to hide a published batch again.

Rollback does:

```text
active -> pending_review
```

Rollback does not:

- delete venues
- delete images
- touch Cloudinary
- touch consumer UI
- remove local artifacts

## Current Production Batch

For `batch_004_buenos_aires_50`:

- `50` venues entered the pipeline.
- `44` passed quality gate.
- `30` were approved.
- `30` Cloudinary hero images uploaded.
- `30` public rows projected.
- `30` activated.
- `30` passed post-activation audit.

## Recovery

If a command fails:

1. Read the embedded console.
2. Open the matching report in the artifact list.
3. Fix the blocker.
4. Rerun the same action.

Most stages are idempotent or overwrite local reports. Public apply stages use deterministic ids.

## Safety Rules

The control center only runs whitelisted commands.

Dangerous actions require typing:

```text
RUN
```

Actions that can affect production:

- `Upload approved heroes to Cloudinary`
- `Apply hidden public projection`
- `Activate public venues`

The final live action is always activation.
