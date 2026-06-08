# Korantis UI Restore Validation

This document defines how future restoration phases must be visually validated against the pre-restoration baseline.

## Validation Principle

Restoration work should create intentional visual differences. Playwright diffs are expected during restoration, but every difference must map to an approved restoration objective.

Unexpected drift is a failed validation.

## Required Validation Flow

For every restoration phase:

1. Run the current baseline comparison before making changes.
2. Implement only the scoped restoration phase.
3. Run visual tests again.
4. Review Playwright diffs for all captured surfaces.
5. Document expected differences in the phase PR or implementation note.
6. Update screenshots only after the restoration phase is accepted.

## Commands

Compare current UI against the existing baseline:

```bash
cd korantis-app
npm run test:visual
```

Refresh accepted baselines after review:

```bash
cd korantis-app
npm run test:visual:update
```

Open Playwright HTML report after failures:

```bash
cd korantis-app
npx playwright show-report
```

## Phase-Specific Validation

### Phase 1: Card Restoration

Expected diffs:

- Card aspect ratios
- Card text placement
- Bookmark visibility and placement
- Layered card panel position
- Card spacing only where geometry affects flow

Unexpected diffs:

- Search controls changing shape or hierarchy
- Venue detail restructuring
- Admin dashboard visual changes
- Map behavior changes

### Phase 2: Image Restoration

Expected diffs:

- Image brightness, contrast, saturation, and warmth
- Vignettes, grain, and overlays
- Text legibility over images

Unexpected diffs:

- Card geometry changes beyond Phase 1 accepted baselines
- Feed width changes
- Navigation structure changes
- Search behavior changes

### Phase 3: Feed Restoration

Expected diffs:

- Feed width
- Vertical rhythm
- Tight, breathe, and isolated spacing
- Utility-control visual prominence

Unexpected diffs:

- Venue detail layout changes
- Admin dashboard changes
- Profile/auth panel behavior changes
- Image treatment changes not approved in Phase 2

### Phase 4: Detail Restoration

Expected diffs:

- Venue hero height and composition
- Narrative spacing
- Time-shift section structure
- Gallery layout
- Similar atmospheres section

Unexpected diffs:

- Feed card behavior changing
- Search header behavior changing
- Saved/Profile visual changes unless caused by shared accepted primitives

### Phase 5: Motion Restoration

Expected diffs:

- Screenshots may show changed transition end states only if motion affects final layout.
- Playwright should still capture stable post-animation states.
- Reduced-motion behavior must remain usable.

Unexpected diffs:

- Static layout movement unrelated to motion
- Lost content
- Cropped cards, clipped heroes, or hidden controls

### Phase 6: Search Restoration

Expected diffs:

- Sticky or fixed search header behavior
- Search compression state
- Search surface blur and hierarchy
- Relationship between search and feed top rhythm

Unexpected diffs:

- Card ratios changing
- Detail page changing
- Admin dashboard changing
- Saved/Profile content changing

## Review Rules

- Do not update baselines automatically as part of implementation.
- Do not accept screenshot diffs without mapping them to a restoration phase.
- Do not use visual tests as a substitute for design-law review.
- Use `docs/KORANTIS_DESIGN_LAWS.md` and `docs/UI_CANONICAL_SYSTEM.md` when deciding whether a diff is desirable.
- Keep admin/debug changes separate from consumer restoration changes.

## Captured Surface Coverage

The validation suite covers:

- Home
- Search Feed
- Map View
- Venue Detail
- Saved
- Profile
- Admin Dashboard

These are the minimum required visual surfaces for restoration validation. Add new visual captures only when a restoration phase introduces or materially changes a user-visible state not represented here.
