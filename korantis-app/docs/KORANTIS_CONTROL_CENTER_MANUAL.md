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

Activation is the final live step.

## Create A New Batch

Use the `New Batch` panel in the control center.

Fields:

- `Batch id`: unique id, for example `batch_005_buenos_aires_restaurants_50`.
- `City`: initially `Buenos Aires`.
- `Count`: number of venues to select.
- `Neighborhoods`: comma-separated list. Leave blank to use defaults.
- `Type mix`: comma-separated weights.

Type mix examples:

```text
restaurants=50
```

```text
cafes=15,restaurants=15,bars=10,cocktails=5,wine=5
```

```text
restaurants=20,parrilla=10,bistro=10,wine=5,cocktails=5
```

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

## Current Production Batch

For `batch_004_buenos_aires_50`:

- `50` venues entered the pipeline.
- `44` passed quality gate.
- `30` were approved.
- `30` Cloudinary hero images uploaded.
- `30` public rows projected.
- `30` activated.

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
