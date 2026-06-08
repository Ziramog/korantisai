# Korantis UI Governance

This document defines the permanent governance layer for the Korantis UI. It classifies protected surfaces, flexible surfaces, review requirements, aesthetic drift, breaking changes, and design risk.

This is an architectural reference only. It does not modify application code.

## Protected UI Surfaces

The following parts of the UI are protected because they carry the original Korantis visual identity:

- Brand palette and contrast philosophy.
- Font pairing and typography hierarchy.
- Venue card variants, ratios, and composition.
- Feed rhythm and spacing categories.
- Image treatment: grading, gradients, vignettes, grain, and warm overlays.
- Motion language: cinematic easing, long durations, reveal patterns, shell transitions, and card-to-venue transitions.
- Venue detail cinematic structure: immersive hero, narrative sections, atmosphere tags, time shifts, tactile gallery, quiet utility, and similar atmospheres.
- Search experience as an atmospheric instrument rather than an ordinary form.
- Bottom navigation as a quiet luxury HUD.
- Circadian ambient and grain atmosphere systems.

## Flexible UI Surfaces

The following parts may change when they preserve the protected identity:

- Venue content text.
- Venue ordering and ranking.
- City and language toggles as product controls, if visually quiet.
- Saved collection counts and labels.
- Map data and markers, if the map remains subordinate to venue atmosphere.
- Admin dashboard surfaces, if visually isolated from the consumer experience.
- Debug HUD, only when hidden or non-consumer by default.
- Copy and localization, while preserving hierarchy, density, and tone.
- Utility metadata, when it remains quiet and secondary.

## Requires Architectural Review Before Modification

The following changes require architectural review before implementation:

- Any change to card ratio, variant, metadata hierarchy, or image treatment.
- Any change to color tokens or foreground/background contrast.
- Any change to font family, font weight, letter spacing, or metadata sizing.
- Any change to feed max width, spacing scale, or tight/breathe/isolated rhythm.
- Any change to search header layout, stickiness, compression, or prompt/input prominence.
- Any change to navigation location, labels, icon/text treatment, or visual weight.
- Any change to venue detail hero height, gallery format, time-shift model, or narrative order.
- Any change to motion duration, easing, transitions, reveal behavior, or page choreography.
- Any change to circadian ambient behavior, grain, vignettes, or atmosphere layers.
- Any change that makes the consumer UI read more like a dashboard, SaaS tool, or generic directory.

## Aesthetic Drift

Aesthetic drift is the cumulative movement away from the original cinematic editorial identity without an explicit architecture decision.

Examples of aesthetic drift:

- The UI starts to read as a generic SaaS product or dark dashboard.
- Venue cards become uniform content boxes.
- Images lose grading, gradients, vignettes, grain, or warm tonal unification.
- Metadata becomes loud, colorful, or chip-like.
- Feed rhythm is compressed into a dense list or grid.
- Motion becomes fast, bouncy, or default-feeling.
- Venue detail prioritizes utility panels over immersive story.
- Controls dominate imagery.
- Admin or debug patterns appear in consumer UI.
- Product functionality expands while atmosphere systems become less visible.

## Breaking Changes

A UI change is breaking when it invalidates one or more canonical design laws or weakens a protected identity surface.

Breaking changes include:

- Removing or renaming canonical card variants.
- Changing Card A, Card D, or Card E ratios or composition.
- Replacing the warm-black/champagne/cream palette.
- Replacing the Cormorant Garamond and DM Sans pairing.
- Removing cinematic image treatment.
- Removing feed rhythm categories.
- Removing or substantially changing the venue detail hero and narrative structure.
- Replacing cinematic motion with generic transitions.
- Changing navigation or search into prominent SaaS-style controls.
- Weakening the grain, vignette, ambient, or circadian atmosphere systems.

## Design Risk Matrix

| Modification Area | LOW | MEDIUM | HIGH | CRITICAL |
|---|---|---|---|---|
| Colors | Minor alpha adjustment on a non-core border | Secondary surface tuning | Changes to `k-black`, `k-gold`, or text tokens | Palette replacement, pure-white default text, or cold dark surfaces |
| Typography | Copy length changes | Local utility size adjustment | Changes to weights, tracking, hierarchy, or metadata scale | Replacing Cormorant Garamond or DM Sans |
| Card Ratios | Content-only edits | Secondary Card B, C, or F geometry tuning | Compact card geometry changes | Card A, D, or E ratio changes |
| Card Composition | Copy or tag text edits | Metadata location changes in secondary cards | Panel, bookmark, tag, or hierarchy changes | Image no longer functions as emotional surface |
| Spacing Rhythm | Local section margin adjustment | Saved/profile spacing changes | Feed rhythm class changes | Uniform grid or dense dashboard feed replacement |
| Motion | Small hover alpha or duration adjustment | Local non-card transition change | Reveal, search, nav, or page transition changes | Removing cinematic shell or card-to-venue motion |
| Venue Detail | Text copy changes | Utility label changes | Gallery, time-shift, or narrative layout changes | Removing immersive hero or story-first structure |
| Search Experience | Placeholder or copy edit | Pill label changes | Static header or control prominence changes | Ordinary SaaS search form replacing atmospheric search |
| Navigation | Icon asset change | Label copy change | Location, style, text visibility, or visual weight change | Removing luxury HUD behavior |
| Atmosphere Systems | Small opacity tuning | Ambient color interpolation changes | Grain, vignette, or glow removal | Removing circadian or ambient identity systems |

## Governance Workflow

1. Classify the proposed change using the Design Risk Matrix.
2. Check the change against `docs/KORANTIS_DESIGN_LAWS.md`.
3. Check the change against `docs/UI_DRIFT_REPORT.md`.
4. For HIGH or CRITICAL risk changes, write an architectural note before implementation.
5. Verify the proposed direction against the original UI reference files.
6. Document accepted deviations as explicit product decisions.

## Review Questions

- Does image still dominate the experience?
- Does the UI still feel cinematic and editorial?
- Are cards still distinct curated artifacts?
- Did visual density increase?
- Did controls become louder than venues?
- Did motion become generic?
- Did any admin or debug pattern enter the consumer surface?
- Did product utility displace atmosphere?

## Protected File Families

The following current implementation areas are protected by this governance document and should not be modified without review:

- `src/app/components/VenueCard.tsx`
- `src/app/components/VenueDetail.tsx`
- `src/app/components/SearchBar.tsx`
- `src/app/components/GlobalNav.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- Venue data fields that control card size, card spacing, venue atmosphere, imagery, and editorial hierarchy.
- Public assets and image-treatment assumptions used by consumer venue surfaces.
