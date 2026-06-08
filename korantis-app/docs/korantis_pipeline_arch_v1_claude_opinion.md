
Toggle
Reasoning
The user wants me to audit the Korantis pipeline architecture document they've shared. This is a comprehensive engineering/product audit of their venue ingestion and publication pipeline. Let me analyze it thoroughly across all the dimensions they've asked about.

Let me read through the document carefully and provide a rigorous audit.

Key observations from reading the document:

It's a 13-stage pipeline that goes from venue discovery to publication

It uses Google Places as primary data source

MiniMax M3 for vision/image classification

MiniMax M2.7 for editorial text generation

Cloudinary for image hosting

Supabase handles both staging and public databases

There's a local control center running on localhost:4317

They've already successfully processed batch_004 with 30 venues activated

Now I'm ready to structure my audit across all the dimensions they're asking about.

Pipeline Architecture Audit — Korantis v1
Top 10 Risks
#	Risk	Severity	Likelihood	Impact
1	No post-activation integrity audit — a venue without coordinates, without Cloudinary hero, or with broken image URL can be live in production. There's no read-back verification after Stage 12.	CRITICAL	Medium	Consumer sees broken cards, empty maps, missing images
2	Image rights exposure — Google Places photos are attribution_required but no attribution is rendered in the consumer app. At scale (500+ venues, multiple cities), this becomes a legal/ToS liability.	HIGH	High	DMCA, Google API ToS violation, takedown requests
3	Editorial hallucination without guardrails — M2.7 generates atmosphere copy from Google Places metadata + vision fields. If a venue has low evidence (few reviews, generic photos), the model can produce generic or unsupported claims. No semantic validation exists post-generation.	HIGH	High	Consumer visits a "romantic candlelit bar" that is actually fluorescent-lit
4	Single-image dependency — each venue gets exactly 1 hero image. If that image breaks (Cloudinary issue, rights takedown, broken URL), the venue has NO visual representation. No fallback.	HIGH	Medium	Cards without images in production
5	No rollback mechanism — once Stage 12 activates venues, there's no batch rollback. No active → pending_review command. No "deactivate batch_004" option.	HIGH	Medium	Bad batch contaminates production with no fast recovery
6	Duplicate detection is best-effort — relies on place_id match + normalized name+neighborhood. Venues that change names, relocate, or have variant spellings can slip through. No fuzzy geo-proximity check (same coordinates ± 50m).	MEDIUM	Medium	Same venue appears twice with different names/photos
7	No cost controls — M3 vision calls (per image) and M2.7 editorial calls (per venue) have no budget caps. A batch of 100 venues with 8 image candidates each = 800 M3 calls in one run.	MEDIUM	Medium	Surprise API bill, rate-limit cascades
8	Pipeline is not resumable at arbitrary points — if Stage 04 fails at venue 37/50, the documented behavior is unclear. Resume support is mentioned but not specified per-stage. Partial state corruption is possible.	MEDIUM	Medium	Wasted API spend, inconsistent batch state
9	Manual review bottleneck — Stage 09 requires exporting/editing a JSON manifest file manually. At 50 venues this is annoying. At 200 venues across multiple batches it becomes the pipeline's throughput limiter.	MEDIUM	High	Review backlog, operator fatigue → rubber-stamping
10	No venue lifecycle after activation — once active, a venue has no update path. If it closes, changes hours, renovates, or its image becomes stale, there's no re-ingestion, refresh, or deactivation workflow.	MEDIUM	High (over time)	Stale data accumulates in production
Stage-by-Stage Findings
Stage 00: Candidate Selection
What works:

Multi-source duplicate checking (Supabase + local files) is solid.
Hard rejections (chains, irrelevant categories, closed venues) are correct.
Neighborhood balance weighting prevents geographic clustering.
What's wrong:

Scoring formula is Google-biased. review_volume_score * 0.15 + google_presence_score * 0.20 means 35% of the score rewards Google popularity. Korantis explicitly positioned itself as anti-popularity. A venue with 12 reviews but incredible atmosphere (speakeasy, hidden, members-only) gets penalized.

atmosphere_potential_score is term-based. Matching "terraza", "wine", "garden" in business name/types is shallow. A place called "Bar 878" scores lower than "Garden Lounge" even though Bar 878 is exactly Korantis material.

No negative signal processing. The formula only scores positively. It should also penalize:

Chain-adjacent keywords ("sucursal", "branch", "franchise")
High review volume + low rating (tourist trap signal)
Generic category-only (just "restaurant" with no specific subtypes)
No Korantis-fit semantic scoring. The document mentions this as a weakness. The fix isn't complex: take the venue name + types + neighborhood + review snippets, embed them, compare to a "Korantis archetype vector" trained on the 30 already-activated venues. Cosine similarity becomes a 0.20 weight factor.

Recommended formula revision:

candidate_score =
  korantis_fit_semantic   * 0.25 +  // NEW: embedding similarity to activated venues
  visual_strength_score   * 0.20 +  // keep: images are critical
  atmosphere_potential    * 0.15 +  // keep but improve to semantic
  category_fit_score     * 0.15 +  // keep
  neighborhood_balance   * 0.10 +  // keep
  source_diversity_score * 0.10 +  // increase: more sources = better evidence
  review_evidence_score  * 0.05 +  // REDUCE: enough reviews to have data, not popularity contest
  anti_signals           * -0.10   // NEW: penalize chains, tourist traps, generics
City adaptation is absent. NYC has fundamentally different venue density, naming conventions, and category distribution. The type mix and neighborhood weighting need city-specific configs, not just different input parameters.
Stage 01: Google Places Extraction
Solid. Standard API usage. One concern:

No verification that the matched place is actually the intended venue. If you search "Bar 878 Buenos Aires" and Google returns "Bar 878 Truck Stop" in a different city, there's no confidence check on the match quality. Add a match_confidence score based on:
Name similarity (Levenshtein or token overlap)
Geographic proximity to expected neighborhood
Category overlap with expected type
Stage 02: Source Discovery
Underpowered. Currently just grabs website/Instagram/menu/reservation URLs from Google Places data. This is the weakest stage and the biggest opportunity:

What should be added (by priority):

Instagram profile scrape — even without post images, the bio, follower count, and link-in-bio give signals.
Google review text extraction — 10-20 top reviews contain atmosphere keywords that are gold for editorial grounding.
Michelin/50 Best/editorial cross-reference — check if venue name appears in known curated lists. Binary signal: is_editorially_recognized: true/false.
Local press/blog mentions — for BA: Infobae Gastronomía, Planeta Joy, etc. For NYC: Eater, Infatuation, Grub Street.
Stage 03: Image Discovery Preflight
Conservative and correct. The filtering rules (no SVG, no GIF, min 512px, no logos, no menus) are right.

Weaknesses:

Official website scraping is shallow HTML. Many restaurant sites are React SPAs where images load dynamically. Stage 03 will miss hero images on JS-rendered sites. Consider: Puppeteer/Playwright for top-priority venues, or accept this limitation for MVP.

No Instagram image sourcing. Instagram is the #1 source of atmospheric venue photography. Even public profile grid images (without scraping posts) are valuable. This is a rights minefield but also the biggest quality gap vs. manually curated images.

Google Places photos are the fallback for everything. This creates a visual homogeneity problem: all venues end up with Google-quality photos rather than editorial-quality photos.

Stage 04: MiniMax M3 Vision
Well designed. Classification taxonomy is correct for the use case. Priority order (hero_interior > gallery_atmosphere > hero_exterior) is right.

Issues:

No confidence threshold on M3 classification. If M3 says hero_interior with 51% confidence, it's treated the same as 99% confidence. Add classification_confidence and require ≥ 0.7 for hero selection.

No aesthetic quality scoring. M3 classifies WHAT the image shows, not HOW GOOD it is. A blurry, poorly-lit interior photo is still hero_interior. You need a secondary quality dimension:

Composition quality
Lighting quality
Resolution sharpness
Atmospheric appeal
This could be a second M3 prompt or a numeric score in the existing classification.

Face detection is mentioned but action is unclear. "Whether it has identifiable faces" — and then what? If the best image has faces, is it rejected? Deprioritized? This needs explicit rules:

Faces detected → NEVER use as hero (privacy, rights)
Faces in background (blurred/distant) → acceptable with flag
Stage 05: MiniMax M2.7 Editorial
This is where the biggest quality risk lives.

Problems:

Grounding is claimed but not enforced. The prompt says "must not invent awards, exact menu items, prices, or booking policies unless those fields exist in source data." But:

How is this validated post-generation?
What if M2.7 writes "intimate candlelit atmosphere" based on a vision field that said hero_interior + warm lighting? Is that grounded or inferred?
Where's the line between "grounded" and "reasonable atmospheric inference"?
No evidence-to-claim ratio check. If a venue has:

8 Google reviews
1 blurry photo
No website
No editorial mentions
...M2.7 should NOT generate rich atmospheric descriptions. It should generate minimal, factual copy. Add an evidence_richness score that gates editorial depth:

evidence_richness < 0.3 → factual only (name, type, neighborhood, hours)
evidence_richness 0.3-0.6 → basic atmosphere (grounded mood tags, 1-line tagline)
evidence_richness > 0.6 → full editorial (description, moments, best-for, not-for)
Mood tags have no controlled vocabulary. If M2.7 decides a venue is "WHIMSICAL" or "BOHEMIAN" but those aren't in your taxonomy of 8 moods (Calmo, Íntimo, Social, Energético, Refugio, Contemplativo, Productivo, Celebratorio), the tag is useless for filtering. The prompt must include the exact allowed mood vocabulary and map to it.

No A/B comparison of editorial quality. You have 30 activated venues. How good is their editorial? Has anyone compared M2.7 output to what a human editor would write? This baseline is critical before scaling.

Stage 06: Quality Gate
Correct in concept but insufficient in depth.

Current checks (good):

Has coordinates ✓
Has address ✓
Has hero image ✓
Has tagline ✓
Has 2+ mood tags ✓
Missing checks (should add):

Check	Why
Coordinates are within expected city bounds	Prevents geo errors projecting venues to wrong continents
Hero image URL returns 200 + valid image content-type	Prevents broken images reaching production
Tagline is ≥ 20 chars and ≤ 120 chars	Prevents empty or essay-length taglines
Mood tags are from controlled vocabulary	Prevents M2.7 inventing tags outside the taxonomy
Description doesn't contain venue name more than once	Prevents repetitive robot-sounding copy
No placeholder text ("TBD", "lorem", "example")	Prevents test data leaking
Hero image dimensions ≥ 800px on shortest side	Prevents pixelated cards
Neighborhood is in known valid list for city	Prevents typos or invented neighborhoods
Opening hours parse correctly OR are null	Prevents garbled hour strings
Stage 07-08: Approval Manifest + Staging Sync
Fine for current scale. The dry-run default is correct. The separation between staging and public is correct.

One gap: There's no diff view. When Stage 08 apply runs, what exactly changed vs. what was already in staging? Add a staging_diff_report.md that shows new rows, updated rows, and unchanged rows.

Stage 09: Publication Review
The weakest human touchpoint.

Currently: Export JSON → manually edit decisions → save as .reviewed.json → continue pipeline.

At 50 venues this is tedious. At 200 it's unsustainable.

The document acknowledges this. The control center should eventually handle it. But the REAL problem is: what is the reviewer actually evaluating?

They need to see:

The hero image (large, not a URL)
The venue name + neighborhood
The tagline + description
The mood tags
Confidence scores
Any blockers or warnings
A "APPROVE / REJECT / PAUSE" button per venue
This is a mini-internal-app, not a JSON file exercise.

Stage 10-12: Cloudinary → Public Projection → Activation
Correct three-step approach. The progression:

Cloudinary upload → write to public tables as hidden → flip to active
Is safe. The pending_review intermediate state is correct.

Gap: Between Stage 11 (projection) and Stage 12 (activation), there's no documented verification step. What if projection wrote corrupted data? Add:

Stage 11.5: Post-projection integrity check
  - Read back every projected row
  - Verify: coordinates present, hero_image URL resolves, tagline non-empty
  - Report any failures
  - Block Stage 12 if any failure exists
Concrete Recommended Changes
Must Fix Before More Publication
#	Change	Effort	Risk if skipped
1	Add post-activation read-back audit — after Stage 12, query every activated venue and verify: coordinates, hero image URL resolves (HTTP HEAD), tagline exists, mood tags from vocabulary. Report failures.	4h	Broken cards in production
2	Add batch rollback command — deactivate_batch <batch_id> that flips all venues from that batch back to pending_review.	2h	No recovery from bad activation
3	Constrain mood tags to vocabulary — add to Stage 05 prompt AND validate in Stage 06 quality gate that mood tags are from the fixed list. Map or reject non-conforming tags.	3h	Useless tags that don't map to UI pills
4	Remove "not confirmed" display from venue detail — this is a frontend issue but pipeline-side: if price_level or reservation data doesn't exist, set to null, not to "no confirmado". Let frontend handle absence.	1h	"Price not confirmed" in consumer UI
5	Add coordinate bounds check to Stage 06 — Buenos Aires: lat -34.4 to -34.8, lng -58.2 to -58.6. NYC: lat 40.4 to 41.0, lng -73.6 to -74.3. Reject anything outside bounds.	1h	Venue plotted in ocean or wrong city
Should Fix Before NYC Expansion
#	Change	Effort
6	City-specific pipeline configs — neighborhoods list, coordinate bounds, type mix presets, evidence sources, language, currency, timezone. One config file per city.	6h
7	Multi-image support — upload hero + 2-3 gallery images to Cloudinary. Store in venue_images with role (hero, gallery_1, gallery_2). Frontend already expects gallery scroll.	8h
8	Review dashboard in control center — render venue cards with image + copy + tags + approve/reject buttons. Save decisions via local API. Kill the JSON manifest editing.	12h
9	Google review text extraction — grab top 10-20 review snippets per venue. Feed to M2.7 as grounding evidence. This dramatically improves editorial quality.	6h
10	Evidence richness gating — score each venue's evidence depth. Only generate full editorial for venues above threshold. Below threshold: minimal factual copy only.	4h
Nice To Have Later
#	Change
11	Michelin/50 Best/editorial source cross-referencing
12	Instagram profile signal extraction
13	Semantic Korantis-fit scoring via embeddings
14	Puppeteer for JS-rendered website image discovery
15	Batch-level cost budgeting with hard caps
16	Per-stage resumable checkpoints with state serialization
17	Authenticated admin app (beyond local control center)
18	Venue lifecycle: refresh, deactivate, re-ingest workflows
19	A/B editorial quality benchmarking vs. human-written copy
20	Image freshness monitoring (monthly re-check URLs)
Revised Architecture Proposal
Current (13 stages, linear)
00 → 01 → 02 → 03 → 04 → connect → 05 → 05b → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13
Proposed (grouped into 4 phases, clearer responsibilities)
PHASE 1: DISCOVERY (no model spend)
├── Stage 01: Candidate Detection (replaces 00)
│   - Seed generation
│   - Duplicate elimination
│   - Korantis-fit scoring
│   - Hard rejections
│   - Output: candidates.json
│
├── Stage 02: Places Enrichment (replaces 01)
│   - Google Places extraction
│   - Match confidence scoring
│   - Coordinate validation
│   - Output: enriched_venues.json
│
└── Stage 03: Source Discovery (replaces 02)
    - Website/IG/Menu/Reservation URLs
    - Google review text extraction (NEW)
    - Editorial source cross-reference (NEW)
    - Output: venue_sources.json

PHASE 2: MEDIA (model spend: vision only)
├── Stage 04: Image Discovery (replaces 03)
│   - Google Places photos
│   - OG images
│   - Website images
│   - Preflight filtering
│   - Output: image_candidates.json
│
└── Stage 05: Image Classification + Selection (replaces 04 + connect)
    - M3 vision classification
    - Quality scoring
    - Hero selection
    - Gallery selection (NEW: top 3-4)
    - Output: selected_images.json

PHASE 3: EDITORIAL (model spend: text only)
├── Stage 06: Editorial Generation (replaces 05/05b)
│   - Evidence richness check (NEW: gates depth)
│   - M2.7 generation with constrained vocabulary
│   - JSON validation + retry
│   - Output: editorial_results.json
│
└── Stage 07: Quality Gate (replaces 06)
    - All deterministic checks
    - Coordinate bounds
    - Mood vocabulary validation (NEW)
    - Image URL resolution check (NEW)
    - Evidence threshold check (NEW)
    - Output: quality_gated.json + blockers report

PHASE 4: PUBLICATION (no model spend, human-gated)
├── Stage 08: Review Dashboard (replaces 07/09)
│   - Generate review UI
│   - Present cards with image + copy + tags
│   - Collect approve/reject/pause decisions
│   - Output: reviewed_manifest.json
│
├── Stage 09: Cloudinary Upload (replaces 10)
│   - Upload hero + gallery images
│   - Generate transformations
│   - Output: cloudinary_assets.json
│
├── Stage 10: Public Projection (replaces 11)
│   - Write to public tables as pending_review
│   - Post-projection integrity check (NEW)
│   - Output: projection_result.json
│
└── Stage 11: Activation (replaces 12)
    - Flip pending_review → active
    - Post-activation read-back audit (NEW)
    - Output: activation_result.json + audit_report.json
Key differences:

Fewer stages (11 vs 13+connect+13)
Clearer phase boundaries (discovery/media/editorial/publication)
Model spend is isolated to phases 2 and 3
Publication phase is entirely deterministic + human-gated
New integrity checks at projection and activation
Multi-image support built into the architecture
Next Implementation Sprint (5 Tasks, Priority Order)
Task 1: Post-Activation Integrity Audit (Day 1)
// pipeline/stages/post_activation_audit.ts

async function auditActivatedBatch(batchId: string) {
  const activatedVenues = await supabase
    .from('venues')
    .select('*')
    .eq('publication_metadata->>batch_id', batchId)
    .eq('curation_status', 'active');

  const failures = [];

  for (const venue of activatedVenues) {
    // Check coordinates
    if (!venue.coordinates?.lat || !venue.coordinates?.lng) {
      failures.push({ venue: venue.name, issue: 'missing_coordinates' });
    }

    // Check coordinate bounds
    if (!isWithinCityBounds(venue.coordinates, venue.city)) {
      failures.push({ venue: venue.name, issue: 'coordinates_out_of_bounds' });
    }

    // Check hero image resolves
    const imageCheck = await fetch(venue.hero_image, { method: 'HEAD' });
    if (!imageCheck.ok) {
      failures.push({ venue: venue.name, issue: 'hero_image_broken', url: venue.hero_image });
    }

    // Check tagline
    if (!venue.tagline || venue.tagline.length < 20) {
      failures.push({ venue: venue.name, issue: 'tagline_missing_or_short' });
    }

    // Check mood tags from vocabulary
    const validMoods = ['calmo', 'intimo', 'social', 'energetico', 'refugio', 'contemplativo', 'productivo', 'celebratorio', 'warm', 'refined', 'romantic', 'creative', 'historic'];
    const invalidTags = venue.tags?.filter(t => !validMoods.includes(t.toLowerCase()));
    if (invalidTags?.length > 0) {
      failures.push({ venue: venue.name, issue: 'invalid_mood_tags', tags: invalidTags });
    }
  }

  return { total: activatedVenues.length, passed: activatedVenues.length - failures.length, failures };
}
Deliverable: Script that runs after activation and produces pass/fail report. Blocks future activations if current batch has failures.

Task 2: Batch Rollback Command (Day 1-2)
// pipeline/stages/rollback_batch.ts

async function rollbackBatch(batchId: string, mode: 'dry-run' | 'apply') {
  const venues = await supabase
    .from('venues')
    .select('id, name, curation_status')
    .eq('publication_metadata->>batch_id', batchId)
    .eq('curation_status', 'active');

  if (mode === 'dry-run') {
    console.log(`Would deactivate ${venues.length} venues from batch ${batchId}`);
    venues.forEach(v => console.log(`  - ${v.name} (${v.id})`));
    return;
  }

  const { error } = await supabase
    .from('venues')
    .update({ curation_status: 'pending_review' })
    .eq('publication_metadata->>batch_id', batchId)
    .eq('curation_status', 'active');

  if (error) throw error;
  console.log(`Rolled back ${venues.length} venues to pending_review`);
}
Deliverable: npx tsx pipeline/stages/rollback_batch.ts  --dry-run|--apply

Task 3: Constrained Mood Vocabulary (Day 2-3)
Changes:

In Stage 05 prompt — add explicit instruction:

ALLOWED MOOD TAGS (use ONLY from this list, select 2-4 most relevant):
- Intimate
- Warm  
- Social
- Energetic
- Refuge
- Contemplative
- Refined
- Creative
- Romantic
- Historic

Do NOT invent mood tags outside this list.
In Stage 06 quality gate — add validation:

const VALID_MOODS = ['intimate', 'warm', 'social', 'energetic', 'refuge', 'contemplative', 'refined', 'creative', 'romantic', 'historic'];

const invalidTags = venue.editorial.mood_tags
  .filter(tag => !VALID_MOODS.includes(tag.toLowerCase()));

if (invalidTags.length > 0) {
  blockers.push('mood_tags_outside_vocabulary');
}
Mapping layer — for tags that are close but not exact (e.g., "cozy" → "warm", "hidden" → "refuge"), add a tag_mapper.ts that normalizes before quality gate.

Deliverable: M2.7 only produces valid tags. Quality gate rejects non-conforming. Mapper handles edge cases.

Task 4: Evidence Richness Scoring (Day 3-4)
// pipeline/utils/evidence_scorer.ts

function scoreEvidenceRichness(venue: VenueComplete): number {
  let score = 0;
  const max = 10;

  // Google data quality
  if (venue.google.rating >= 4.0) score += 1;
  if (venue.google.user_ratings_total >= 50) score += 1;
  if (venue.google.user_ratings_total >= 200) score += 1;
  if (venue.google.website) score += 0.5;
  if (venue.google.opening_hours) score += 0.5;

  // Image quality
  if (venue.hero_image?.quality === 'high') score += 1;
  if (venue.images_classified >= 3) score += 1;

  // Source diversity
  if (venue.sources?.instagram) score += 0.5;
  if (venue.sources?.menu_url) score += 0.5;
  if (venue.sources?.reservation_url) score += 0.5;

  // Review text evidence (when available)
  if (venue.review_snippets?.length >= 5) score += 1;
  if (venue.review_snippets?.length >= 15) score += 1;

  // Editorial mentions
  if (venue.editorial_mentions?.length > 0) score += 1;

  return Math.min(score / max, 1.0);
}

// In Stage 05 editorial generation:
const richness = scoreEvidenceRichness(venue);

if (richness < 0.3) {
  // Generate minimal: tagline + 2 mood tags only
  prompt = MINIMAL_EDITORIAL_PROMPT;
} else if (richness < 0.6) {
  // Generate standard: tagline + description + mood tags + best-for
  prompt = STANDARD_EDITORIAL_PROMPT;
} else {
  // Generate full: all fields including moments, not-for, atmosphere signals
  prompt = FULL_EDITORIAL_PROMPT;
}
Deliverable: Venues with weak evidence get appropriately modest editorial. Rich-evidence venues get full treatment.

Task 5: Review Dashboard in Control Center (Day 4-7)
Transform the review process from JSON editing to a visual interface:

// In control center: /review/:batchId route

// Render per-venue card:
// ┌──────────────────────────────────────────┐
// │ [HERO IMAGE - actual rendered]           │
// │                                          │
// │ Venue Name            Palermo, BA        │
// │ "Tagline goes here in italic"            │
// │ [Intimate] [Warm] [Romantic]             │
// │                                          │
// │ Evidence: 0.72  │  Confidence: 0.85      │
// │ Hero: 1024x768 from google_places        │
// │                                          │
// │ [✓ APPROVE]  [✗ REJECT]  [⏸ PAUSE]      │
// │                                          │
// │ Warnings: image_below_preferred_resolution│
// └──────────────────────────────────────────┘
Requirements:

Render actual images (not URLs)
Show editorial copy as it would appear to consumer
Show confidence/evidence scores
Show any warnings (non-blocking)
Approve/reject/pause buttons that persist to manifest file
Batch actions: "Approve all passing" / "Reject all with warnings"
Summary: X approved / Y rejected / Z paused
Deliverable: Operator reviews venues visually, not by reading JSON.

Bottom Line Assessment
The pipeline architecture is fundamentally sound. The stage separation, dry-run defaults, human review requirement, and pending_review → active progression are correct design decisions.

What's good:

The philosophy of "don't spend model budget until candidates pass deterministic filters" is right.
The separation between staging and public tables is right.
The quality gate concept is right.
The image classification taxonomy is right.
The Cloudinary materialization approach is right.
What's dangerous:

No post-activation verification means broken data can go live.
No rollback means you can't recover quickly.
Unconstrained editorial generation means mood tags and descriptions can be off-brand.
Single-image dependency means one broken URL = one broken venue card.
Image rights at scale without attribution = legal risk.
What's missing for NYC:

City-specific configs (bounds, neighborhoods, sources, language).
Multi-image per venue (NYC venues have richer visual identity).
Higher evidence bar (NYC competition demands better editorial quality).
Editorial source integration (Eater, Infatuation, NYMag cross-referencing).
The system works at 30 venues. At 300 it will strain. At 3000 it needs the queuing, budgeting, and lifecycle management that's currently absent.

Priority: ship Tasks 1-3 (audit + rollback + vocabulary) before activating the next batch. They're < 2 days of work and eliminate the top 3 operational risks.