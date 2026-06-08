# Korantis UI Baseline Capture

This document records the visual baseline captured before any restoration work begins.

## Purpose

The baseline preserves the current implementation so future restoration phases can be compared against the pre-restoration state.

No consumer UI was modified for this capture system.

## Tooling

- Playwright visual regression tests
- Chromium browser engine
- Snapshot root: `korantis-app/tests/visual/baseline/`
- Test file: `korantis-app/tests/visual/korantis-baseline.spec.ts`
- Config file: `korantis-app/playwright.config.ts`

## Viewports

| Project | Viewport | Device scale factor |
|---|---:|---:|
| desktop | `1440 x 1200` | `1` |
| mobile | `390 x 844` | `1` |

Both projects use:

- Timezone: `America/Buenos_Aires`
- Locale: `en-US`
- Color scheme: `dark`

## Routes And States Captured

| Capture | Route | State | Screenshot name |
|---|---|---|---|
| Home | `/` | Initial search home at top of page | `home.png` |
| Search Feed | `/` | Search query entered and feed scrolled | `search-feed.png` |
| Map View | `/` | Spatial Atlas mode selected | `map-view.png` |
| Venue Detail | `/` | First venue opened from feed | `venue-detail.png` |
| Saved | `/` | Atlas tab selected | `saved.png` |
| Profile | `/` | Taste/Profile tab selected while signed out | `profile.png` |
| Admin Dashboard | `/admin` | Admin grid with mocked venue API data | `admin-dashboard.png` |

Each screenshot is captured for both viewport projects:

- `korantis-app/tests/visual/baseline/desktop/*.png`
- `korantis-app/tests/visual/baseline/mobile/*.png`

## Baseline Commands

Install visual testing dependencies:

```bash
cd korantis-app
npm install
npx playwright install chromium
```

Generate or refresh baseline screenshots:

```bash
cd korantis-app
npm run test:visual:update
```

Validate current UI against the baseline:

```bash
cd korantis-app
npm run test:visual
```

Run a single viewport:

```bash
npx playwright test tests/visual --project=desktop
npx playwright test tests/visual --project=mobile
```

## Environment Notes

The Playwright config starts the Next.js dev server at:

```text
http://127.0.0.1:3000
```

Visual tests provide controlled route mocks for:

- `/api/venues`
- `/api/admin/venues`
- `/api/admin/venues/*`
- Supabase auth endpoints

This keeps the baseline focused on the current UI implementation rather than live Supabase state, credentials, or network availability.

Map View is captured in the current local baseline state with no `NEXT_PUBLIC_MAPBOX_TOKEN`, which renders the existing "Map Engine Offline" UI.

## Screenshot Inventory

After baseline generation, expected files are:

```text
korantis-app/tests/visual/baseline/desktop/home.png
korantis-app/tests/visual/baseline/desktop/search-feed.png
korantis-app/tests/visual/baseline/desktop/map-view.png
korantis-app/tests/visual/baseline/desktop/venue-detail.png
korantis-app/tests/visual/baseline/desktop/saved.png
korantis-app/tests/visual/baseline/desktop/profile.png
korantis-app/tests/visual/baseline/desktop/admin-dashboard.png
korantis-app/tests/visual/baseline/mobile/home.png
korantis-app/tests/visual/baseline/mobile/search-feed.png
korantis-app/tests/visual/baseline/mobile/map-view.png
korantis-app/tests/visual/baseline/mobile/venue-detail.png
korantis-app/tests/visual/baseline/mobile/saved.png
korantis-app/tests/visual/baseline/mobile/profile.png
korantis-app/tests/visual/baseline/mobile/admin-dashboard.png
```
