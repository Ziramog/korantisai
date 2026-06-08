Korantis Enrichment Pipeline — Architecture Audit & Revised Specification
A. Executive Verdict
APPROVE WITH CHANGES — the bones are right, the flesh needs tightening.

The architecture correctly identifies enrichment as a separate layer, enforces read-only defaults, and sequences gallery before editorial. These are the right instincts. What's missing is precision: the evidence model is too loose to prevent claims leakage, the gallery pipeline lacks a rights state machine, the quality gate has concepts but no numbers, and the apply/rollback mechanism needs stronger guarantees.

5 Principal Strengths
Correct separation of concerns — enrichment never activates, never deletes, never overwrites without backup. This is the right boundary.
Gallery-before-editorial sequencing — images inform copy quality; you can't write "candlelit subterranean bar" without seeing the images first.
Evidence-first philosophy — "a query candidate cannot sustain a claim" is the single most important rule in the document.
Additive-first data strategy — JSONB before schema migration avoids premature optimization.
Run-level isolation — data/enrichment/<run_id>/ gives traceability and safe re-runs.
5 Principal Risks
Evidence model lacks source authority scoring — a random blog and a Michelin page are treated equally. Without weighted authority, claims from weak sources will leak through.
No image rights state machine — images move from "found" to "published" without intermediate legal checkpoints. At scale, this is a lawsuit.
Quality gate has no numeric thresholds — "evidence confidence >= threshold" without a number is not a gate, it's a suggestion.
No conflict resolution protocol — when Google says price_level=3 and the menu says ARS $5000 per plate, who wins? Undefined.
No model cost budget per run — enriching 100 venues with gallery classification + editorial rewrite can burn $50-200 in API calls with no cap.
B. Architecture Gaps
Area	Gap	Severity	Recommendation
Evidence Model	No source authority weighting	CRITICAL	Implement tiered trust levels per source type per city
Evidence Model	No freshness decay	HIGH	Sources older than 6 months get confidence penalty; >12 months = stale
Evidence Model	No conflict resolution	HIGH	Define resolution rules: official > editorial > places > user-generated
Gallery	No rights state machine	CRITICAL	Implement: discovered → classified → rights_checked → approved → uploaded → published
Gallery	No near-duplicate detection	MEDIUM	Perceptual hash comparison before classification
Gallery	No Cloudinary upload budget	MEDIUM	Max 8 images per venue in Cloudinary; gallery candidates stay local until approved
Quality Gate	No numeric thresholds	HIGH	Define exact numbers for each status transition
Claims	No blocklist enforcement in code	HIGH	Regex/keyword gate before any claim reaches review
Editorial	No prompt contract versioning	MEDIUM	Prompt changes = new version; old outputs traceable to prompt version
Apply	No partial apply support	MEDIUM	Should be able to apply gallery-only or facts-only without touching editorial
Apply	Rollback plan is "generated" but mechanism undefined	HIGH	Store previous JSONB state in rollback table before every write
Observability	No cost tracking	MEDIUM	Track token usage per model call per venue per run
City Sources	No source registry	MEDIUM	Typed registry of sources per city with trust level and fetch method
Pipeline	No concurrency model	LOW	Sequential is fine for v1; document that runs are single-threaded
Pipeline	No timeout/retry for external fetches	MEDIUM	Max 10s per fetch, 2 retries, then mark source as fetch_failed
C. Revised Pipeline — E00 through E08
Stage E00 — Enrichment Target Selection
Purpose: Identify which venues need enrichment and what specifically they need.

Inputs:

public.venues (active + pending_review)
venue_images (current hero/gallery state)
Stage 16 audit results
Manual venue ID list
Previous enrichment run metadata
Selection modes:

--active-only
--pending-review
--batch 
--venue-ids 
--missing-gallery (< 3 gallery images)
--missing-editorial (no tagline OR no description_short OR < 2 mood_tags)
--missing-facts (no price_level AND no opening_hours)
--city 
--force (bypass recent-enrichment skip)
--max-targets  (default: 50)
Logic:

interface EnrichmentTarget {
  venue_id: string;
  venue_name: string;
  city: string;
  neighborhood: string;
  current_status: 'active' | 'pending_review';
  needs: EnrichmentNeed[];
  priority_score: number; // 0-1
  last_enriched_at: string | null;
  last_enrichment_run_id: string | null;
}

type EnrichmentNeed = 
  | 'gallery_depth'      // < 3 approved gallery images
  | 'hero_missing'       // no hero image
  | 'hero_weak'          // hero exists but quality_score < 0.6
  | 'editorial_thin'     // no description_long OR no moments OR < 2 mood_tags
  | 'facts_missing'      // no price_level AND no hours AND no links
  | 'evidence_weak'      // evidence_confidence < 0.4
  | 'stale'              // last enrichment > 180 days ago
  | 'source_unchecked';  // never had evidence collection run
Priority scoring:

priority = 
  (is_active ? 0.3 : 0.1) +
  (needs.includes('hero_missing') ? 0.3 : 0) +
  (needs.includes('gallery_depth') ? 0.15 : 0) +
  (needs.includes('editorial_thin') ? 0.15 : 0) +
  (needs.includes('facts_missing') ? 0.05 : 0) +
  (needs.includes('evidence_weak') ? 0.05 : 0)
Outputs:

data/enrichment//
├── enrichment_targets.json
├── enrichment_target_report.md
└── enrichment_run_config.json  // captures CLI args + timestamp + operator
Safety rules:

Maximum 50 targets per run (overridable with --max-targets)
Skip venues enriched within last 14 days unless --force
Never include venues with status = 'removed' or status = 'permanently_closed'
Stage E01 — Evidence Collection
Purpose: Gather source material that can ground claims. No claims generated here — only raw evidence.

Source Registry (per city):

interface SourceDefinition {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  authority_level: AuthorityLevel;
  cities: string[];
  fetch_method: 'stored' | 'http_get' | 'api_call' | 'manual';
  max_age_days: number; // after this, mark stale
  rate_limit?: { calls_per_minute: number };
}

type SourceType = 
  | 'official'           // venue's own website/social
  | 'maps_places'        // Google Places, Apple Maps
  | 'editorial_trusted'  // Michelin, 50 Best, Eater, Infatuation
  | 'local_media'        // Infobae Gastro, Planeta Joy, TimeOut local
  | 'booking_menu'       // Resy, TheFork, official menu page
  | 'social_profile'     // Instagram bio (not posts), Facebook page
  | 'user_generated'     // Google reviews text, aggregated signals
  | 'local_blog'         // smaller blogs, neighborhood guides

type AuthorityLevel = 1 | 2 | 3 | 4 | 5;
// 5 = official venue source (website, Instagram bio)
// 4 = Michelin, 50 Best, major editorial (Eater, NYMag)
// 3 = established local media (Infobae Gastro, TimeOut)
// 2 = local blogs, secondary guides
// 1 = user-generated, social signals, unverified
Evidence object (per venue, per source):

interface EvidenceItem {
  evidence_id: string; // uuid
  venue_id: string;
  source_id: string;
  source_url: string; // must be fetchable or stored reference
  source_type: SourceType;
  authority_level: AuthorityLevel;
  fetched_at: string; // ISO timestamp
  fetch_status: 'success' | 'failed' | 'timeout' | 'blocked';
  
  extracted_facts: ExtractedFact[];
  extracted_claims: ExtractedClaim[];
  raw_snippet?: string; // max 500 chars of relevant text
  
  freshness_status: 'fresh' | 'aging' | 'stale';
  // fresh: < 90 days, aging: 90-180 days, stale: > 180 days
}

interface ExtractedFact {
  field: string; // 'price_level', 'opening_hours', 'cuisine', etc.
  value: any;
  confidence: number; // 0-1
  extraction_method: 'deterministic' | 'model_assisted' | 'manual';
}

interface ExtractedClaim {
  claim_text: string;
  claim_type: ClaimType;
  evidence_span: string; // the source text supporting this
  source_authority: AuthorityLevel;
  status: 'confirmed' | 'weak_hint' | 'blocked' | 'stale' | 'conflict';
}

type ClaimType = 
  | 'award_mention'
  | 'guide_inclusion'
  | 'editorial_mention'
  | 'atmosphere_descriptor'
  | 'speciality_claim'
  | 'price_claim'
  | 'hours_claim'
  | 'reservation_claim';
Fetch rules:

Max 10 seconds per HTTP request
2 retries on timeout/5xx, then mark fetch_failed
Respect robots.txt (do not scrape disallowed paths)
No Instagram post scraping (profile bio only via stored data)
No TripAdvisor scraping
Store raw response hash to detect changes on re-run
Conflict resolution protocol: When two sources disagree on the same fact:

Higher authority wins (authority_level comparison)
If same authority, more recent wins (fetched_at comparison)
If same authority and same recency, mark status: 'conflict' and flag for manual review
Official venue source ALWAYS wins over third-party for: hours, reservation, menu, website
Outputs:

data/enrichment//
├── evidence_collected.json
├── evidence_report.md
├── source_fetch_log.json  // every fetch attempt with status
└── evidence_conflicts.json // any conflicting facts
Stage E02 — Gallery Discovery & Classification
Purpose: Find candidate images, classify them, score them, and check for duplicates — without uploading anything to Cloudinary yet.

Image sources (priority order):

Existing Stage 03/04 candidates (already classified)
Google Places photo references (stored, not newly fetched unless needed)
Official website images (if fetchable and > 512px)
Existing Cloudinary images for this venue (already uploaded)
Forbidden sources:

Instagram posts (not profile avatar)
TripAdvisor
Google Image Search
Pinterest
Any source without clear origin URL
Image Rights State Machine:

discovered
  → classified (M3 vision has assigned role + quality score)
    → rights_reviewed (human confirmed source is acceptable)
      → upload_approved (ready for Cloudinary)
        → uploaded (in Cloudinary with transformation)
          → published (linked in public venue_images)

At any stage can go to:
  → rejected (quality, rights, duplicate, irrelevant)
Classification schema (via M3 or equivalent vision model):

interface GalleryCandidate {
  candidate_id: string;
  venue_id: string;
  source_url: string;
  source_type: 'google_places' | 'official_website' | 'existing_cloudinary' | 'stage_03_candidate';
  
  // Classification
  role: ImageRole;
  role_confidence: number; // 0-1, require >= 0.7
  
  // Quality
  quality_score: number; // 0-1 composite
  composition_score: number; // 0-1
  lighting_score: number; // 0-1
  atmosphere_score: number; // 0-1
  resolution_adequate: boolean; // shortest side >= 800px
  
  // Safety
  has_identifiable_faces: boolean;
  has_text_overlay: boolean;
  has_watermark: boolean;
  is_screenshot: boolean;
  is_collage: boolean;
  
  // Deduplication
  perceptual_hash: string;
  is_near_duplicate_of?: string; // candidate_id of similar image
  
  // Rights
  rights_status: RightsStatus;
  rights_notes?: string;
  
  // Selection
  gallery_rank?: number; // 1 = hero, 2-7 = gallery positions
  selection_reason?: string;
  rejection_reason?: string;
}

type ImageRole = 
  | 'hero_interior'
  | 'hero_exterior'
  | 'gallery_atmosphere'
  | 'gallery_bar_area'
  | 'gallery_seating'
  | 'gallery_terrace_rooftop'
  | 'gallery_detail_texture'
  | 'gallery_exterior_context'
  | 'supporting_food_drink'
  | 'rejected_generic'
  | 'rejected_quality'
  | 'rejected_irrelevant';

type RightsStatus = 
  | 'google_places_attribution_required'
  | 'official_website_assumed_ok'
  | 'existing_cloudinary_ok'
  | 'unknown_requires_review'
  | 'rejected_rights_risk';
Selection rules:

Position	Preferred Role	Fallback	Requirement
Hero (rank 1)	hero_interior	gallery_atmosphere > hero_exterior	quality >= 0.7, no faces, no watermark
Gallery 2	Different scene than hero	Any atmosphere	quality >= 0.6
Gallery 3	gallery_bar_area or gallery_seating	Any interior	quality >= 0.6
Gallery 4	gallery_terrace_rooftop or gallery_exterior_context	Any different scene	quality >= 0.5
Gallery 5-6	gallery_detail_texture or supporting_food_drink	Any non-duplicate	quality >= 0.5
Duplicate detection:

Compute perceptual hash (pHash) for all candidates
If hamming distance < 10 between two images, mark as near-duplicate
Keep the one with higher quality_score
Never include two near-duplicates in the same gallery
Rejection criteria (automatic):

Resolution < 512px on shortest side
has_watermark: true
is_screenshot: true
is_collage: true
has_identifiable_faces: true AND role is hero
role_confidence < 0.5
quality_score < 0.4
SVG, GIF, or animated format
Outputs:

data/enrichment//
├── gallery_candidates.json        // all candidates with classification
├── gallery_selection.json         // selected candidates with ranks
├── gallery_duplicates.json        // duplicate pairs detected
├── gallery_rejections.json        // rejected with reasons
└── gallery_report.md
Cloudinary strategy:

Do NOT upload during E02
Upload happens only in E07/E08 after manual approval
Use Cloudinary folder: korantis/venues//gallery/
Transformations: f_auto,q_auto,w_1200,c_limit for gallery; w_1600 for hero
Max 8 images per venue in Cloudinary (hero + 7 gallery)
Stage E03 — Fact Extraction
Purpose: Extract structured, source-backed facts from evidence. No guessing.

Fact schema:

interface VenueFact {
  field: FactField;
  value: any;
  display_value?: string; // human-readable version
  source_id: string;
  source_url: string;
  source_authority: AuthorityLevel;
  extraction_method: 'deterministic' | 'model_assisted';
  confidence: number; // 0-1
  status: FactStatus;
  conflict_with?: string; // another fact_id if conflicting
  last_verified: string;
  show_to_user: boolean; // false = internal only
  notes?: string;
}

type FactField = 
  | 'price_level'           // 1-4 ($-$$$$)
  | 'price_text'            // "Cocktails from $12-18"
  | 'average_spend_per_person'
  | 'reservation_required'  // boolean
  | 'reservation_url'
  | 'menu_url'
  | 'website'
  | 'instagram_url'
  | 'phone'
  | 'opening_hours'         // structured or text
  | 'cuisine_focus'
  | 'drink_focus'
  | 'guide_mention'         // {guide: "Michelin", year: 2024, url: "..."}
  | 'editorial_mention'     // {publication: "Eater", url: "..."}
  | 'neighborhood_context'
  | 'practical_warning'     // "cash only", "no reservations", "very loud Fri/Sat"
  | 'capacity_hint'
  | 'dress_code_hint'
  | 'accessibility_note';

type FactStatus = 
  | 'confirmed'             // high-authority source, recent, no conflict
  | 'likely'                // medium-authority, recent, no conflict
  | 'weak_hint'            // low-authority or aging source
  | 'unknown'              // no source found
  | 'conflict'             // multiple sources disagree
  | 'stale';               // source > 180 days old
Confidence calculation:

base_confidence = authority_level / 5  // 0.2 to 1.0

// Freshness modifier
if source_age < 90 days: freshness_mod = 1.0
if source_age 90-180 days: freshness_mod = 0.8
if source_age > 180 days: freshness_mod = 0.5

// Method modifier
if extraction_method == 'deterministic': method_mod = 1.0
if extraction_method == 'model_assisted': method_mod = 0.85

confidence = base_confidence * freshness_mod * method_mod
Display rules:

Status	Confidence	Action
confirmed	>= 0.7	show_to_user: true
confirmed	0.5-0.7	show_to_user: true with "approximate" qualifier
likely	>= 0.5	show_to_user: true with softer language
likely	< 0.5	show_to_user: false, internal signal only
weak_hint	any	show_to_user: false
unknown	any	Store as { value: null, status: 'unknown' }
conflict	any	show_to_user: false, flag for manual review
stale	any	show_to_user: false until re-verified
Deterministic extraction (no model needed):

price_level from Google Places API field
website from Google Places or stored sources
phone from Google Places
opening_hours from Google Places (with freshness check)
reservation_url from known booking platform patterns
menu_url from known patterns or explicit link
instagram_url from stored profile data
Model-assisted extraction (for text interpretation):

cuisine_focus from review text + website description
drink_focus from menu/website scanning
practical_warning from review patterns ("cash only" mentioned 5+ times)
neighborhood_context from venue address + known neighborhood descriptors
guide_mention from confirmed editorial URLs
Outputs:

data/enrichment//
├── venue_facts.json
├── facts_conflicts.json
├── facts_report.md
└── facts_unknown_fields.json  // what we couldn't find
Stage E04 — Editorial Enrichment
Purpose: Generate rich atmospheric copy grounded in verified evidence and classified images.

Prerequisites (must exist before running E04):

E01 evidence collected
E02 gallery classified (at minimum hero confirmed)
E03 facts extracted
Evidence confidence for this venue >= 0.3 (otherwise: minimal copy only)
Evidence-gated editorial depth:

Evidence Confidence	Editorial Depth
< 0.3	MINIMAL: tagline + 2 mood tags only
0.3 - 0.6	STANDARD: tagline + short description + mood tags + best_for
> 0.6	FULL: all fields including moments, not_for, planning_notes
Prompt contract (versioned):

interface EditorialPromptContract {
  version: string; // "editorial_v2.1"
  model: string;   // "minimax-m2.7" or configured
  
  system_instructions: string;
  venue_context: {
    name: string;
    type: string;
    city: string;
    neighborhood: string;
    evidence_summary: string;      // compiled from E01
    image_atmosphere: string;      // from E02 classification
    confirmed_facts: object;       // from E03
    existing_copy?: string;        // current editorial if upgrading
  };
  
  output_schema: EditorialOutput;
  
  constraints: EditorialConstraints;
}

interface EditorialConstraints {
  // BLOCKED WORDS (never generate these without URL evidence)
  blocked_without_evidence: [
    'best', 'iconic', 'legendary', 'famous', 'award-winning',
    'Michelin', '50 Best', 'World's Best', 'number one',
    'must-visit', 'unmissable', 'best-kept secret'
  ];
  
  // BLOCKED PATTERNS
  blocked_patterns: [
    'has been serving since [year]' // unless year is sourced
    'known for their [dish]' // unless menu confirms
    'reservations are essential' // unless source confirms
    '[exact price]' // unless menu/source confirms
  ];
  
  // TONE RULES
  tone: {
    voice: 'atmospheric, observational, sensory-first';
    avoid: 'food-review, superlative, tourist-guide, promotional';
    perspective: 'describing the experience of being there, not reviewing it';
    length_bias: 'concise over verbose';
  };
  
  // MOOD TAXONOMY (output must map to these only)
  allowed_mood_tags: [
    'intimate', 'warm', 'social', 'energetic',
    'refuge', 'contemplative', 'refined', 'creative',
    'romantic', 'historic', 'productive', 'celebratory'
  ];
  
  // EVIDENCE RULES
  evidence_rules: {
    every_claim_must_cite_source: true;
    atmosphere_inference_from_images_allowed: true;
    menu_items_only_if_in_facts: true;
    prices_only_if_in_facts: true;
    hours_only_if_in_facts: true;
    guide_mentions_only_if_url_confirmed: true;
  };
}
Output schema:

interface EditorialOutput {
  tagline: string;                    // 20-80 chars, evocative, no venue name repetition
  description_short: string;          // 1-2 sentences, for card/preview
  description_long: string;           // 3-5 sentences, for detail page
  mood_tags: string[];                // 2-4 from allowed taxonomy
  moments: {
    morning?: string;
    afternoon?: string;
    night?: string;
    late_night?: string;
  };
  best_for: string[];                 // 2-5 occasions/contexts
  not_for?: string[];                 // 1-3 anti-recommendations
  planning_notes?: string[];          // practical hints for the visitor
  atmosphere_sentence?: string;       // single poetic mood sentence
  
  // Meta (model must return these)
  source_backed_claims: string[];     // claims explicitly supported by evidence
  inferred_claims: string[];          // reasonable inferences from images/context
  generation_confidence: number;      // model's self-assessed confidence 0-1
  evidence_used: string[];            // source_ids referenced
}
Post-generation validation (deterministic, no model):

function validateEditorial(output: EditorialOutput, constraints: EditorialConstraints): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Tagline length
  if (output.tagline.length < 20) errors.push('tagline_too_short');
  if (output.tagline.length > 80) errors.push('tagline_too_long');
  
  // Mood tags from vocabulary
  const invalidTags = output.mood_tags.filter(t => 
    !constraints.allowed_mood_tags.includes(t.toLowerCase())
  );
  if (invalidTags.length > 0) errors.push(`invalid_mood_tags: ${invalidTags}`);
  
  // Mood tag count
  if (output.mood_tags.length < 2) errors.push('too_few_mood_tags');
  if (output.mood_tags.length > 4) warnings.push('too_many_mood_tags');
  
  // Blocked words check
  const allText = [output.tagline, output.description_short, output.description_long].join(' ');
  for (const word of constraints.blocked_without_evidence) {
    if (allText.toLowerCase().includes(word.toLowerCase())) {
      errors.push(`blocked_word_found: "${word}"`);
    }
  }
  
  // Placeholder detection
  const placeholders = ['TBD', 'lorem', 'example', 'placeholder', '[', ']'];
  for (const p of placeholders) {
    if (allText.includes(p)) errors.push(`placeholder_found: "${p}"`);
  }
  
  // Venue name repetition
  // (check that venue name doesn't appear more than once in description)
  
  // Description length bounds
  if (output.description_short.length < 40) errors.push('description_short_too_brief');
  if (output.description_long && output.description_long.length < 100) warnings.push('description_long_thin');
  
  return { 
    valid: errors.length === 0, 
    errors, 
    warnings,
    can_proceed_with_warnings: errors.length === 0
  };
}
Retry logic:

If validation fails, retry generation once with error feedback appended to prompt
If second attempt fails, mark venue as needs_manual_review with failure reason
Max 2 model calls per venue per run
Outputs:

data/enrichment//
├── editorial_results.json
├── editorial_validations.json
├── editorial_failures.json  // venues that failed after 2 attempts
└── editorial_report.md
Stage E05 — Enrichment Quality Gate
Purpose: Deterministic pass/fail gate before manual review. No human judgment here — pure rules.

Scoring model:

interface EnrichmentQualityScore {
  venue_id: string;
  
  // Component scores (all 0-1)
  evidence_coverage: number;    // what % of sources were successfully fetched
  evidence_authority: number;   // weighted average of source authority levels
  image_depth: number;          // gallery candidates meeting quality bar
  image_hero_quality: number;   // hero image specific quality
  fact_confidence: number;      // average confidence of extracted facts
  editorial_grounding: number;  // % of editorial claims that have evidence backing
  rights_safety: number;        // % of selected images with acceptable rights status
  freshness: number;            // recency of evidence
  conflict_count: number;       // number of unresolved conflicts (lower = better)
  unsupported_claims: number;   // count of claims without evidence (lower = better)
  
  // Composite
  overall_score: number;        // weighted composite
  
  // Status
  status: EnrichmentStatus;
  blockers: string[];           // reasons if blocked
  warnings: string[];           // non-blocking issues
}

type EnrichmentStatus = 
  | 'enrichment_ready'
  | 'needs_manual_review'
  | 'blocked_insufficient_evidence'
  | 'blocked_image_quality'
  | 'blocked_rights_risk'
  | 'blocked_claim_risk'
  | 'blocked_validation_failure';
Score calculation:

function calculateOverallScore(components): number {
  return (
    components.evidence_coverage * 0.15 +
    components.evidence_authority * 0.10 +
    components.image_depth * 0.20 +
    components.image_hero_quality * 0.15 +
    components.fact_confidence * 0.10 +
    components.editorial_grounding * 0.15 +
    components.rights_safety * 0.10 +
    components.freshness * 0.05
  );
  // Note: conflict_count and unsupported_claims are blockers, not score components
}
Component calculation details:

// Evidence coverage
evidence_coverage = sources_successfully_fetched / sources_attempted;
// If 0 sources attempted (shouldn't happen), = 0

// Evidence authority  
evidence_authority = weighted_average(
  confirmed_facts.map(f => f.source_authority / 5)
);
// No facts = 0

// Image depth
const good_candidates = gallery_candidates.filter(c => 
  c.quality_score >= 0.5 && !c.is_near_duplicate_of && c.rights_status !== 'rejected_rights_risk'
);
image_depth = Math.min(1.0, good_candidates.length / 5);
// 5+ good candidates = 1.0

// Image hero quality
const hero = gallery_selection.find(s => s.gallery_rank === 1);
image_hero_quality = hero ? hero.quality_score : 0;

// Fact confidence
fact_confidence = confirmed_facts.length > 0 
  ? average(confirmed_facts.map(f => f.confidence))
  : 0;

// Editorial grounding
const total_claims = editorial.source_backed_claims.length + editorial.inferred_claims.length;
editorial_grounding = total_claims > 0
  ? editorial.source_backed_claims.length / total_claims
  : 0.5; // no claims = neutral

// Rights safety
const selected_images = gallery_selection.filter(s => s.gallery_rank !== null);
const safe_images = selected_images.filter(s => 
  s.rights_status !== 'unknown_requires_review' && 
  s.rights_status !== 'rejected_rights_risk'
);
rights_safety = selected_images.length > 0 
  ? safe_images.length / selected_images.length
  : 0;

// Freshness
const evidence_ages = evidence_items.map(e => daysSince(e.fetched_at));
const avg_age = average(evidence_ages);
freshness = avg_age < 90 ? 1.0 : avg_age < 180 ? 0.7 : avg_age < 365 ? 0.4 : 0.2;
Status determination thresholds:

Status	Condition
enrichment_ready	overall >= 0.6 AND no blockers AND unsupported_claims == 0 AND image_hero_quality >= 0.6
needs_manual_review	overall >= 0.4 AND (has warnings OR 1 soft blocker)
blocked_insufficient_evidence	evidence_coverage < 0.3 OR evidence_authority < 0.3
blocked_image_quality	image_hero_quality < 0.4 OR image_depth < 0.2 (no usable gallery)
blocked_rights_risk	rights_safety < 0.5
blocked_claim_risk	unsupported_claims > 0 OR editorial validation errors > 0
blocked_validation_failure	editorial output failed validation twice
Hard blockers (any one = blocked):

No hero image candidate with quality >= 0.5
Any blocked word found in editorial output
Any claim referencing award/guide without URL evidence
Venue coordinates missing or out of city bounds
rights_status: 'rejected_rights_risk' on hero image
Soft blockers (trigger needs_manual_review):

Only 1-2 gallery candidates (below target of 3+)
Fact conflicts unresolved
Evidence only from authority level 1-2
Editorial confidence < 0.5
Hero image rights = unknown_requires_review
Outputs:

data/enrichment//
├── quality_gate_results.json
├── quality_gate_report.md
├── blocked_venues.json
└── review_queue.json  // venues passing to manual review
Stage E06 — Manual Enrichment Review
Purpose: Human approves, rejects, or partially approves enrichment per venue.

Review dashboard data:

interface EnrichmentReviewItem {
  venue_id: string;
  venue_name: string;
  city: string;
  neighborhood: string;
  quality_gate_status: EnrichmentStatus;
  quality_gate_score: number;
  
  // Current state (what's live now)
  current: {
    hero_image_url: string | null;
    tagline: string | null;
    description: string | null;
    mood_tags: string[];
    gallery_count: number;
  };
  
  // Proposed state (what enrichment wants to set)
  proposed: {
    hero_image: GalleryCandidate;
    gallery_images: GalleryCandidate[];
    editorial: EditorialOutput;
    facts: VenueFact[];
    evidence_summary: string;
  };
  
  // Diff highlights
  diff: {
    hero_changed: boolean;
    gallery_added: number;
    tagline_changed: boolean;
    description_changed: boolean;
    mood_tags_changed: boolean;
    facts_added: string[];
  };
  
  // Risk indicators
  risks: {
    unsupported_claims: string[];
    blocked_claims: string[];
    rights_uncertain_images: string[];
    conflicts: string[];
  };
  
  // Review actions available
  available_actions: ReviewAction[];
}

type ReviewAction = 
  | 'approve_all'
  | 'approve_gallery_only'
  | 'approve_facts_only'
  | 'approve_editorial_only'
  | 'reject_all'
  | 'pause'
  | 'request_rerun';
Review manifest:

interface EnrichmentDecision {
  venue_id: string;
  reviewer: string;
  reviewed_at: string;
  decision: ReviewAction;
  
  // Granular overrides
  gallery_decisions?: {
    [candidate_id: string]: 'approve' | 'reject' | 'replace_hero';
  };
  editorial_overrides?: {
    tagline?: string;        // manual edit
    mood_tags?: string[];    // manual adjustment
  };
  fact_decisions?: {
    [field: string]: 'approve' | 'reject' | 'override';
  };
  
  reviewer_notes?: string;
  
  // Applied state tracking
  apply_status: 'pending' | 'applied' | 'rolled_back' | 'skipped';
}
Outputs:

data/enrichment//
├── enrichment_decisions.json
├── enrichment_decisions.reviewed.json  // after human edits
└── review_session_log.md
Stage E07 — Apply Enrichment (Dry Run)
Purpose: Generate exact DB mutations without executing them. Show what would change.

Operation types:

interface EnrichmentMutation {
  venue_id: string;
  table: string;
  operation: 'update' | 'insert' | 'upsert';
  field_path: string;
  current_value: any;
  new_value: any;
  source: string; // 'enrichment_run_'
  reversible: boolean;
}
Dry run output:

interface DryRunResult {
  run_id: string;
  generated_at: string;
  venue_count: number;
  
  mutations: EnrichmentMutation[];
  
  summary: {
    venues_affected: number;
    fields_updated: number;
    images_to_upload: number;
    new_gallery_images: number;
    editorial_rewrites: number;
    facts_added: number;
  };
  
  cloudinary_uploads_planned: {
    venue_id: string;
    source_url: string;
    target_path: string;
    transformation: string;
  }[];
  
  rollback_data: {
    venue_id: string;
    field_path: string;
    previous_value: any;
  }[];
  
  warnings: string[];
  blockers: string[]; // if any blocker, apply will refuse
}
Safety checks before allowing --apply:

All venues in manifest have decision: 'approve_*'
No unresolved blockers in quality gate
Rollback data is complete (every mutation has current_value stored)
No Cloudinary upload would overwrite existing hero without backup
Total mutations < 500 per run (safety cap)
Cost estimate for Cloudinary uploads < $5 per run (configurable cap)
Outputs:

data/enrichment//
├── dry_run_result.json
├── dry_run_report.md
├── rollback_plan.json
└── cloudinary_upload_plan.json
Stage E08 — Apply Enrichment (Execute)
Purpose: Execute approved mutations.

Invocation:

npx tsx pipeline/enrichment/08_apply.ts --run-id  --apply

# Safety: without --apply, refuses to run
# Additional safety: --apply-gallery-only, --apply-facts-only, --apply-editorial-only
Execution order:

Load dry_run_result.json and enrichment_decisions.reviewed.json
Verify both exist and are consistent
Store rollback data in venue_enrichment_rollback table (or JSONB field)
Execute Cloudinary uploads (images first, so URLs are available for DB writes)
Execute DB mutations in transaction
Verify post-apply (read back every mutated field)
Generate apply report
Rollback mechanism:

-- Before apply, for each venue:
INSERT INTO venue_enrichment_rollback (
  venue_id, run_id, field_path, previous_value, applied_at, rollback_status
) VALUES (...);

-- To rollback:
-- Read rollback entries for run_id
-- Restore previous_value for each field_path
-- Mark rollback_status = 'rolled_back'
Rollback command:

npx tsx pipeline/enrichment/rollback.ts --run-id  --dry-run
npx tsx pipeline/enrichment/rollback.ts --run-id  --apply
Post-apply verification:

Read back every mutated venue
Verify hero image URL resolves (HTTP HEAD)
Verify new gallery image URLs resolve
Verify tagline exists and passes length check
Verify mood tags are from vocabulary
Verify no new venue activation happened (status unchanged)
Report any failures
What apply NEVER does:

Change curation_status (never activates or deactivates)
Delete existing images from Cloudinary
Remove existing editorial copy without storing in rollback
Write to venues not in the approved manifest
Execute if dry_run_result has blockers
Outputs:

data/enrichment//
├── apply_result.json
├── apply_report.md
├── apply_verification.json
├── rollback_entries.json  // what was stored for rollback
└── cloudinary_upload_results.json
D. Recommended Data Model
Tier 1: JSONB Minimum Viable (implement now)
Add to existing venues table:

ALTER TABLE venues ADD COLUMN IF NOT EXISTS enrichment_data jsonb DEFAULT '{}';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS evidence_data jsonb DEFAULT '{}';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS enrichment_version text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS last_enriched_at timestamptz;
Modify existing venue_images table:

ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS gallery_rank integer;
ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS quality_score numeric;
ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS source_origin text; -- 'google_places', 'official_website', etc.
ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS rights_status text DEFAULT 'unknown_requires_review';
ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS selection_data jsonb DEFAULT '{}';
Add rollback table:

CREATE TABLE IF NOT EXISTS venue_enrichment_rollback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id),
  run_id text NOT NULL,
  field_path text NOT NULL,
  previous_value jsonb,
  new_value jsonb,
  applied_at timestamptz DEFAULT now(),
  rollback_status text DEFAULT 'applied' -- 'applied' | 'rolled_back'
);

CREATE INDEX idx_enrichment_rollback_run ON venue_enrichment_rollback(run_id);
CREATE INDEX idx_enrichment_rollback_venue ON venue_enrichment_rollback(venue_id);
Example enrichment_data payload:

{
  "version": "enrichment_v1",
  "run_id": "enrich_2025_06_08_001",
  "generated_at": "2025-06-08T14:30:00Z",
  "editorial": {
    "tagline": "A brass-lit basement where the cocktails arrive unnamed and the silence feels expensive.",
    "description_short": "Below a shuttered flower shop, a subterranean bar of amber light and unhurried conversation.",
    "description_long": "The entrance gives nothing away — a locked florería on a quiet San Telmo corner. Behind it, stairs descend into warm brass and dark wood. The bartenders work without menus, reading the room. Conversation stays low. The city above ceases to exist.",
    "mood_tags": ["intimate", "refuge", "refined"],
    "moments": {
      "afternoon": "Quieter, easier to get a seat at the bar. Good for a slow aperitivo.",
      "night": "Fuller, more energy, but never loud. The cocktails get more ambitious."
    },
    "best_for": ["date night", "impressing someone", "solo at the bar", "escaping the city"],
    "not_for": ["large groups", "laptop work", "quick drink"],
    "planning_notes": ["Reservations recommended Thursday-Saturday", "No sign outside — look for the flower shop"],
    "source_backed_claims": ["Listed in 50 Best Discovery 2023"],
    "evidence_confidence": 0.82
  },
  "facts": {
    "price_level": { "value": 3, "confidence": 0.9, "source": "google_places" },
    "reservation_required": { "value": true, "confidence": 0.85, "source": "official_website" },
    "opening_hours": { "value": "Tue-Sun 19:00-02:00", "confidence": 0.8, "source": "google_places" },
    "guide_mentions": [
      { "guide": "50 Best Discovery", "year": 2023, "url": "https://...", "confidence": 1.0 }
    ]
  },
  "quality": {
    "overall_score": 0.78,
    "evidence_coverage": 0.85,
    "image_depth": 0.80,
    "editorial_grounding": 0.75,
    "status": "enrichment_ready"
  }
}
Tier 2: Intermediate (implement when JSONB becomes painful)
CREATE TABLE venue_enrichment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text UNIQUE NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text, -- 'running', 'completed', 'failed', 'partial'
  config jsonb, -- CLI args, operator, settings
  venue_count integer,
  summary jsonb, -- aggregated results
  cost_usd numeric
);

CREATE TABLE venue_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id),
  source_id text NOT NULL,
  source_url text,
  source_type text,
  authority_level integer,
  fetched_at timestamptz,
  fetch_status text,
  extracted_facts jsonb DEFAULT '[]',
  extracted_claims jsonb DEFAULT '[]',
  raw_snippet text,
  freshness_status text,
  run_id text
);

CREATE INDEX idx_evidence_venue ON venue_evidence(venue_id);
CREATE INDEX idx_evidence_source ON venue_evidence(source_id);
Tier 3: Full Normalized (implement at 500+ venues or when multiple editors need concurrent access)
-- Add to tier 2:
CREATE TABLE venue_editorial_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id),
  version integer NOT NULL,
  editorial_data jsonb NOT NULL,
  prompt_version text,
  evidence_used text[],
  created_at timestamptz DEFAULT now(),
  status text, -- 'draft', 'approved', 'published', 'superseded'
  approved_by text,
  approved_at timestamptz
);

CREATE TABLE venue_source_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id),
  source_name text NOT NULL,
  source_url text NOT NULL,
  mention_type text, -- 'guide_inclusion', 'review', 'editorial_feature'
  year integer,
  verified_at timestamptz,
  verified_by text,
  status text -- 'confirmed', 'expired', 'unverified'
);
Recommendation: Start with Tier 1. Move to Tier 2 when you have > 200 enriched venues or need to audit evidence provenance across runs. Tier 3 is for when you have a team of 3+ editors or need regulatory compliance on editorial claims.

E. Evidence & Claims Policy
Claim Classification
┌─────────────────────────────────────────────────────────────────┐
│ CLAIM TYPE          │ REQUIREMENT                │ IF NOT MET    │
├─────────────────────┼────────────────────────────┼───────────────┤
│ Award/Guide mention │ URL to guide page + year   │ BLOCKED       │
│ "Michelin"          │ Michelin URL + current year│ BLOCKED       │
│ "50 Best"           │ 50 Best URL + year         │ BLOCKED       │
│ "Best [anything]"   │ Source URL with exact claim│ BLOCKED       │
│ "Iconic"            │ 3+ editorial sources       │ BLOCKED       │
│ "Historic" / "since"│ Official source with year  │ weak_hint     │
│ Specific menu item  │ Menu URL or official source│ BLOCKED       │
│ Exact price         │ Menu URL dated < 6 months  │ BLOCKED       │
│ Price range ($-$$$$)│ Google Places OR menu      │ show if conf>0.7│
│ "Reservation needed"│ Official site or Resy/Fork │ weak_hint     │
│ Cuisine type        │ Any authority >= 3 source  │ show if conf>0.5│
│ Atmosphere claim    │ Image evidence + 1 source  │ inferred_claim│
│ "Quiet"/"Loud"      │ Image + review pattern     │ inferred_claim│
│ Opening hours       │ Google Places or official  │ show with caveat│
│ Neighborhood context│ Deterministic from address │ always ok     │
│ "Cash only"         │ 3+ reviews mentioning it   │ weak_hint     │
└─────────────────────┴────────────────────────────┴───────────────┘
Status Definitions
Status	Meaning	Can show to user?
public_copy_allowed	Confirmed by high-authority source, use freely in editorial	YES
claim_allowed	Source-backed, can appear in structured fields	YES (with context)
inferred_claim	Reasonable inference from images + weak sources	YES (atmospheric copy only, not factual)
unverified_hint	Mentioned somewhere but not confirmed	NO (internal signal for editorial tone)
internal_signal_only	Useful for scoring/ranking but never user-facing	NO
claim_blocked	Attempted but evidence insufficient or conflicting	NO, and flag if model generates it
Anti-Hallucination Gate (runs after every editorial generation)
function antiHallucinationCheck(
  editorial: EditorialOutput, 
  evidence: EvidenceItem[], 
  facts: VenueFact[]
): { pass: boolean; violations: string[] } {
  
  const violations: string[] = [];
  const allText = [
    editorial.tagline,
    editorial.description_short,
    editorial.description_long,
    ...(editorial.planning_notes || [])
  ].join(' ');
  
  // 1. Blocked words without evidence
  const BLOCKED_WORDS = [
    'michelin', '50 best', 'world's best', 'best bar', 'best restaurant',
    'best café', 'award-winning', 'award winning', 'iconic', 'legendary',
    'famous for', 'renowned', 'unmissable', 'must-visit', 'number one',
    'most popular', 'top rated'
  ];
  
  for (const word of BLOCKED_WORDS) {
    if (allText.toLowerCase().includes(word)) {
      // Check if evidence supports this claim
      const hasEvidence = evidence.some(e => 
        e.extracted_claims.some(c => 
          c.status === 'confirmed' && 
          c.claim_text.toLowerCase().includes(word)
        )
      );
      if (!hasEvidence) {
        violations.push(`Blocked word "${word}" without evidence`);
      }
    }
  }
  
  // 2. Price mentions without fact backing
  const pricePattern = /\$\d+|\d+\s*(USD|ARS|AED|dollars|pesos)/gi;
  if (pricePattern.test(allText)) {
    const hasPriceFact = facts.some(f => 
      f.field === 'price_text' && f.status === 'confirmed'
    );
    if (!hasPriceFact) {
      violations.push('Specific price mentioned without confirmed fact');
    }
  }
  
  // 3. Menu item mentions without fact backing
  // (heuristic: quoted food/drink items or "known for their [X]")
  const knownForPattern = /known for (their|its) .+/gi;
  if (knownForPattern.test(allText)) {
    violations.push('"Known for" pattern without menu/source evidence');
  }
  
  // 4. Year claims without source
  const yearPattern = /since \d{4}|established \d{4}|opened in \d{4}/gi;
  if (yearPattern.test(allText)) {
    const hasYearEvidence = facts.some(f => 
      f.field === 'established_year' && f.status === 'confirmed'
    );
    if (!hasYearEvidence) {
      violations.push('Year/establishment claim without evidence');
    }
  }
  
  // 5. Reservation claims without source
  if (allText.toLowerCase().includes('reservation') && 
      allText.toLowerCase().includes('essential' || 'required' || 'must')) {
    const hasReservationFact = facts.some(f => 
      f.field === 'reservation_required' && f.confidence >= 0.7
    );
    if (!hasReservationFact) {
      violations.push('Strong reservation claim without confirmed fact');
    }
  }
  
  return { 
    pass: violations.length === 0, 
    violations 
  };
}
F. Gallery Policy
Selection Priority (what to look for, in order)
Interior atmosphere — the experience of being inside (lighting, space, texture)
Bar/counter area — where the action happens
Seating/table scene — where you'd sit
Terrace/rooftop/patio — outdoor experience (if applicable)
Exterior context — what the approach looks like
Detail/texture — a beautiful element (tiles, lamp, menu board)
Food/drink supporting — ONLY if the product IS the identity (specialty coffee process, cocktail being made)
Anti-Patterns (what to reject)
Generic food plating (this isn't a food guide)
Stock-photo-feeling images
Images where food/drink takes up > 60% of frame (unless it IS the venue identity)
Five similar angles of the same corner
Daylight interior when the venue is primarily a night venue
Images that misrepresent the actual vibe
Rights Rules
Source	Default Rights Status	Can publish?
Google Places photos	google_places_attribution_required	YES with attribution logic (ToS compliant for now; revisit at scale)
Official venue website	official_website_assumed_ok	YES (implied permission for editorial use)
Existing Cloudinary (already uploaded)	existing_cloudinary_ok	YES
Unknown/unclear origin	unknown_requires_review	NO until human reviews
Instagram post (if ever allowed)	rejected_rights_risk	NO
User-submitted	requires_explicit_permission	NO until permission documented
Gallery Completeness Scoring
image_depth_score = min(1.0, approved_gallery_count / 5)

Where approved_gallery_count = images with:
  - quality_score >= 0.5
  - rights_status NOT in ['rejected_rights_risk', 'unknown_requires_review']
  - not marked as near_duplicate
  - passes role diversity check (not all same role)
Role Diversity Check
A gallery is "diverse" if it includes images from at least 3 different role categories (excluding rejected_*). If all 5 images are gallery_atmosphere, that's better than 1 image, but it gets a diversity penalty:

diversity_bonus = unique_roles_in_selection / 5
// 5 different roles = 1.0 bonus
// 3 different roles = 0.6 bonus
// 1 role = 0.2 bonus

adjusted_image_depth = image_depth_score * (0.7 + 0.3 * diversity_bonus)
G. Quality Gate Scoring — Complete Thresholds
Score Component	Weight	How Calculated	Threshold for "ready"
evidence_coverage	0.15	sources_fetched / sources_attempted	>= 0.5
evidence_authority	0.10	avg(confirmed_facts.authority / 5)	>= 0.4
image_depth	0.20	min(1, good_candidates / 5) * diversity	>= 0.4
image_hero_quality	0.15	hero.quality_score	>= 0.6
fact_confidence	0.10	avg(confirmed_facts.confidence)	>= 0.5
editorial_grounding	0.15	source_backed / total_claims	>= 0.6
rights_safety	0.10	safe_images / selected_images	>= 0.8
freshness	0.05	age-based decay	>= 0.5
Status determination:

IF unsupported_claims > 0:
  → blocked_claim_risk

IF image_hero_quality < 0.4 OR hero is null:
  → blocked_image_quality

IF rights_safety < 0.5:
  → blocked_rights_risk

IF evidence_coverage < 0.3 AND evidence_authority < 0.3:
  → blocked_insufficient_evidence

IF editorial validation errors > 0:
  → blocked_validation_failure

IF overall_score >= 0.6 AND all component thresholds met:
  → enrichment_ready

IF overall_score >= 0.4 OR only soft blockers:
  → needs_manual_review

ELSE:
  → blocked_insufficient_evidence
H. Manual Review UX
Screen Layout
┌─────────────────────────────────────────────────────────────────────┐
│ ENRICHMENT REVIEW — Run: enrich_2025_06_08_001                       │
│ Venue 3/17: Florería Atlántico          Score: 0.78 [READY]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ┌─── CURRENT (live) ────────┐  ┌─── PROPOSED (enriched) ──────────┐│
│ │                            │  │                                   ││
│ │ [Hero image - current]     │  │ [Hero image - proposed]          ││
│ │                            │  │                                   ││
│ │ Tagline: "..."            │  │ Tagline: "..." [CHANGED]         ││
│ │ Tags: [intimate] [warm]   │  │ Tags: [intimate] [refuge]        ││
│ │                            │  │        [refined]  [NEW]          ││
│ │ Description:               │  │ Description:                      ││
│ │ "Current short desc..."    │  │ "New richer desc..." [CHANGED]   ││
│ │                            │  │                                   ││
│ │ Gallery: 1 image           │  │ Gallery: 5 images [+4 NEW]       ││
│ │                            │  │                                   ││
│ └────────────────────────────┘  └───────────────────────────────────┘│
│                                                                       │
├─── GALLERY CANDIDATES ───────────────────────────────────────────────┤
│                                                                       │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │ IMG1 │ │ IMG2 │ │ IMG3 │ │ IMG4 │ │ IMG5 │ │ IMG6 │            │
│ │HERO  │ │BAR   │ │SEAT  │ │DETAIL│ │EXTER │ │FOOD  │            │
│ │q:0.82│ │q:0.75│ │q:0.71│ │q:0.68│ │q:0.55│ │q:0.49│            │
│ │[✓ ✗] │ │[✓ ✗] │ │[✓ ✗] │ │[✓ ✗] │ │[✓ ✗] │ │[✓ ✗] │            │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                                       │
├─── EVIDENCE & CLAIMS ────────────────────────────────────────────────┤
│                                                                       │
│ ✓ Source-backed claims:                                              │
│   • "50 Best Discovery 2023" [URL] [authority: 4]                   │
│   • "Price level: $$$" [Google Places] [authority: 3]               │
│   • "Open Tue-Sun 19:00-02:00" [Google] [authority: 3]             │
│                                                                       │
│ ⚠ Inferred claims (from images + context):                          │
│   • "Subterranean" (image shows basement/low ceiling)               │
│   • "Low lighting" (image histogram confirms)                        │
│   • "Cocktail-focused" (bar area prominent in images)               │
│                                                                       │
│ ✗ Blocked claims: none                                               │
│                                                                       │
├─── FACTS ────────────────────────────────────────────────────────────┤
│                                                                       │
│ Price: $$$ (conf: 0.9, Google Places) [✓ approve] [✗ reject]       │
│ Hours: Tue-Sun 19:00-02:00 (conf: 0.8) [✓] [✗]                    │
│ Reservation: Required (conf: 0.85, website) [✓] [✗]                │
│ Website: https://... [✓] [✗]                                        │
│ Instagram: @floreria... [✓] [✗]                                      │
│                                                                       │
├─── ACTIONS ──────────────────────────────────────────────────────────┤
│                                                                       │
│ [✓ APPROVE ALL] [✓ Gallery Only] [✓ Facts Only] [✓ Editorial Only] │
│ [✗ REJECT ALL]  [⏸ PAUSE]        [↺ REQUEST RE-RUN]                │
│                                                                       │
│ Notes: [_______________________________________________]             │
│                                                                       │
│ [← Previous venue]                           [Next venue →]          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
Keyboard shortcuts (for speed)
A = Approve all
R = Reject all
G = Approve gallery only
F = Approve facts only
E = Approve editorial only
P = Pause
→ = Next venue
← = Previous venue
1-6 = Toggle individual gallery image approve/reject
I. Implementation Roadmap
Phase 1: Read-Only Audit (Days 1-3)
Files:

pipeline/enrichment/00_select_targets.ts
pipeline/enrichment/01_collect_evidence.ts
pipeline/enrichment/utils/source_registry.ts
pipeline/enrichment/utils/evidence_types.ts
Outputs:

enrichment_targets.json for any city/status filter
evidence_collected.json with source fetch results
evidence_report.md with human-readable summary
Acceptance criteria:

Can select targets from public.venues by city, status, and need
Can fetch and parse Google Places stored data
Can check venue website availability (HTTP HEAD)
Can identify which venues are missing gallery/editorial/facts
Zero DB writes
Run completes in < 5 minutes for 50 venues
What NOT to build: No model calls. No image processing. No editorial generation.

Phase 2: Gallery Depth (Days 4-8)
Files:

pipeline/enrichment/02_discover_gallery.ts
pipeline/enrichment/02b_classify_gallery.ts
pipeline/enrichment/02c_select_gallery.ts
pipeline/enrichment/utils/image_quality.ts
pipeline/enrichment/utils/perceptual_hash.ts
pipeline/enrichment/utils/gallery_types.ts
Outputs:

gallery_candidates.json with all discovered images
gallery_classification_results.json with M3 roles + quality
gallery_selection.json with ranked selections per venue
gallery_report.md
Acceptance criteria:

Can discover 5-10 candidate images per venue from stored sources
M3 classifies each with role + confidence + quality score
Near-duplicate detection works (pHash comparison)
Selection logic picks hero + 3-5 gallery with role diversity
Rights status correctly assigned based on source
No Cloudinary uploads (that's Phase 5)
Run completes in < 2 minutes per venue (with M3 calls)
What NOT to build: No Cloudinary upload. No editorial. No fact extraction beyond what's already stored.

Phase 3: Source-Backed Facts (Days 9-12)
Files:

pipeline/enrichment/03_extract_facts.ts
pipeline/enrichment/utils/fact_types.ts
pipeline/enrichment/utils/confidence_calculator.ts
pipeline/enrichment/utils/conflict_resolver.ts
Outputs:

venue_facts.json with structured facts per venue
facts_conflicts.json with unresolved conflicts
facts_report.md
Acceptance criteria:

Can extract price_level, hours, website, instagram, phone from stored data
Confidence correctly calculated per fact (authority * freshness * method)
Conflict detection works (two sources, same field, different value)
show_to_user correctly set based on confidence threshold
Unknown fields stored as { value: null, status: 'unknown' }
No model calls needed (deterministic extraction)
No guessing
What NOT to build: No model-assisted extraction yet. No editorial mentions verification (requires HTTP fetch to editorial URLs).

Phase 4: Rich Editorial (Days 13-18)
Files:

pipeline/enrichment/04_generate_editorial.ts
pipeline/enrichment/utils/editorial_prompt.ts
pipeline/enrichment/utils/editorial_validator.ts
pipeline/enrichment/utils/anti_hallucination.ts
pipeline/enrichment/utils/mood_tag_mapper.ts
Outputs:

editorial_results.json
editorial_validations.json
editorial_failures.json
editorial_report.md
Acceptance criteria:

Evidence-gated depth (minimal/standard/full based on confidence)
Editorial passes all validation rules
Anti-hallucination gate catches all blocked words
Mood tags map to allowed vocabulary only
Max 2 model calls per venue (1 generation + 1 retry if needed)
Prompt version tracked in output
No claims without evidence
What NOT to build: No apply. No dashboard. Just generation + validation.

Phase 5: Quality Gate + Review + Apply (Days 19-28)
Files:

pipeline/enrichment/05_quality_gate.ts
pipeline/enrichment/06_review_manifest.ts
pipeline/enrichment/07_dry_run.ts
pipeline/enrichment/08_apply.ts
pipeline/enrichment/rollback.ts
pipeline/enrichment/utils/quality_scorer.ts
pipeline/enrichment/utils/mutation_builder.ts
DB migrations:

-- Run once
ALTER TABLE venues ADD COLUMN IF NOT EXISTS enrichment_data jsonb DEFAULT '{}';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS evidence_data jsonb DEFAULT '{}';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS enrichment_version text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS last_enriched_at timestamptz;

ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS gallery_rank integer;
ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS quality_score numeric;
ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS source_origin text;
ALTER TABLE venue_images ADD COLUMN IF NOT EXISTS rights_status text DEFAULT 'unknown_requires_review';

CREATE TABLE IF NOT EXISTS venue_enrichment_rollback (...);
Acceptance criteria:

Quality gate produces numeric scores with correct thresholds
Status determination is deterministic and testable
Review manifest is generated with current vs proposed diff
Dry run shows exact mutations without executing
Apply executes only with --apply flag
Apply stores rollback data before writing
Apply verifies post-write (read-back check)
Rollback command restores previous state
Cloudinary uploads happen only for approved images
No venue activation ever happens
Partial apply works (gallery-only, facts-only, editorial-only)
What NOT to build: Full visual review dashboard (use JSON manifest + report for now). Visual dashboard is a nice-to-have for Phase 6.

J. Claude Implementation Prompts
Prompt 1: E00 Target Selector
Implement the enrichment target selector for the Korantis pipeline.

Context: Korantis is a venue discovery platform. We need to identify which venues 
need enrichment (better images, richer copy, verified facts).

File to create: pipeline/enrichment/00_select_targets.ts

Requirements:
1. Read from Supabase `venues` table (use existing supabase client from pipeline/utils/)
2. Read from `venue_images` table to check gallery depth
3. Accept CLI flags: --active-only, --pending-review, --city , --venue-ids , 
   --missing-gallery, --missing-editorial, --max-targets , --force
4. For each venue, determine which EnrichmentNeeds apply:
   - gallery_depth: fewer than 3 images in venue_images
   - hero_missing: no image with is_hero=true (or equivalent)
   - editorial_thin: no tagline OR no description OR fewer than 2 mood tags
   - facts_missing: no price_level AND no opening_hours
   - evidence_weak: no enrichment_data.quality.evidence_coverage or < 0.4
   - stale: last_enriched_at > 180 days ago or null
5. Calculate priority_score per venue (active venues higher, missing hero highest)
6. Sort by priority descending, limit to --max-targets
7. Skip venues enriched within 14 days unless --force
8. Output to data/enrichment//enrichment_targets.json
9. Generate enrichment_target_report.md with summary
10. run_id format: "enrich_YYYY_MM_DD_HHmm"

Types needed:
- EnrichmentTarget { venue_id, venue_name, city, neighborhood, current_status, needs[], priority_score, last_enriched_at }
- EnrichmentNeed enum

This is READ ONLY. Zero DB writes. Only reads + file output.

Use the project's existing patterns:
- Supabase client from pipeline/utils/supabase.ts
- File output to data/ directory
- TypeScript strict mode
- Console logging for progress
Prompt 2: E01 Evidence Collector
Implement the evidence collector for Korantis enrichment pipeline.

File to create: pipeline/enrichment/01_collect_evidence.ts
Supporting file: pipeline/enrichment/utils/source_registry.ts

Context: Given a list of enrichment targets (from E00), collect source evidence 
that can later ground editorial claims. NO claims generated here — only raw evidence.

Requirements:
1. Load enrichment_targets.json from the current run directory
2. For each venue, check available sources:
   - Google Places data already in the venue record (stored, not API call)
   - Official website (HTTP HEAD check only — is it alive?)
   - Instagram URL (stored in venue record, not scraped)
   - Any URLs in venue.external_links or similar fields
3. For each source checked:
   - Record: source_url, source_type, authority_level, fetch_status, fetched_at
   - Extract deterministic facts (price_level from Google, hours from Google, etc.)
   - Record freshness_status based on data age
4. Source authority levels:
   - 5: official venue source (website, IG bio)
   - 4: Michelin, 50 Best, Eater (if URL found in stored data)
   - 3: Google Places, established local media
   - 2: local blogs
   - 1: user-generated signals
5. HTTP fetches: 10s timeout, 2 retries, then mark fetch_failed
6. Output: evidence_collected.json, source_fetch_log.json, evidence_report.md
7. Calculate per-venue evidence_coverage_score: sources_fetched / sources_attempted

This is READ ONLY for DB. May make HTTP HEAD requests to check URL liveness.
No scraping. No full page downloads. Just liveness checks and stored data extraction.

Do not call any AI models. This is purely deterministic.
Prompt 3: E02 Gallery Candidate Selector
Implement gallery candidate discovery and classification for Korantis enrichment.

Files to create:
- pipeline/enrichment/02_discover_gallery.ts
- pipeline/enrichment/02b_classify_gallery.ts  
- pipeline/enrichment/utils/gallery_types.ts

Context: Each Korantis venue needs a hero image + 3-6 gallery images for a rich 
detail page. Currently most venues have only 1 hero. We need to find more candidates 
and classify them by role and quality.

Stage 02 (discover):
1. Load enrichment targets
2. For each venue, gather image candidates from:
   - Existing venue_images in DB
   - Stage 03/04 outputs if available (check data/batches//stage_04/)
   - Google Places photo references stored in venue data
3. Filter out: SVG, GIF, < 512px, obvious logos/menus
4. Compute perceptual hash for duplicate detection
5. Output: gallery_candidates.json

Stage 02b (classify):
1. Load gallery_candidates.json
2. For each candidate NOT already classified, call M3 vision model with prompt:
   - Classify role: hero_interior, gallery_atmosphere, gallery_bar_area, 
     gallery_seating, gallery_terrace_rooftop, gallery_detail_texture,
     gallery_exterior_context, supporting_food_drink, rejected_generic,
     rejected_quality, rejected_irrelevant
   - Score quality (0-1): composition, lighting, atmosphere
   - Detect: faces, watermarks, text overlays, screenshots
   - Confidence of role assignment (0-1)
3. After classification, run selection logic:
   - Hero: highest quality hero_interior or gallery_atmosphere, quality >= 0.7
   - Gallery positions 2-6: different roles, quality >= 0.5, no near-duplicates
   - Enforce role diversity (at least 3 different roles in final selection)
4. Assign rights_status based on source:
   - google_places → 'google_places_attribution_required'
   - official_website → 'official_website_assumed_ok'
   - already in cloudinary → 'existing_cloudinary_ok'
   - unknown → 'unknown_requires_review'
5. Output: gallery_classification_results.json, gallery_selection.json, gallery_report.md

No Cloudinary uploads. No DB writes. File output only.
Model calls: M3 vision only, track call count in report.
Prompt 4: E05 Quality Gate
Implement the enrichment quality gate for Korantis.

File to create: pipeline/enrichment/05_quality_gate.ts
Supporting: pipeline/enrichment/utils/quality_scorer.ts

Context: After evidence (E01), gallery (E02), facts (E03), and editorial (E04) 
have run, the quality gate determines which venues are ready for review, which 
need manual attention, and which are blocked.

Requirements:
1. Load all outputs from current run: evidence, gallery_selection, facts, editorial
2. For each venue, calculate component scores (all 0-1):
   - evidence_coverage: sources_fetched / sources_attempted
   - evidence_authority: avg(confirmed_facts.authority / 5)
   - image_depth: min(1, good_candidates/5) * diversity_bonus
   - image_hero_quality: hero.quality_score (0 if no hero)
   - fact_confidence: avg(confirmed_facts.confidence)
   - editorial_grounding: source_backed_claims / total_claims
   - rights_safety: safe_images / selected_images
   - freshness: age-based (< 90d = 1.0, 90-180d = 0.7, >180d = 0.4)
3. Calculate overall_score with weights:
   evidence_coverage*0.15 + evidence_authority*0.10 + image_depth*0.20 +
   image_hero_quality*0.15 + fact_confidence*0.10 + editorial_grounding*0.15 +
   rights_safety*0.10 + freshness*0.05
4. Determine status using these rules (check in order):
   - unsupported_claims > 0 → blocked_claim_risk
   - hero quality < 0.4 or missing → blocked_image_quality
   - rights_safety < 0.5 → blocked_rights_risk
   - evidence_coverage < 0.3 AND evidence_authority < 0.3 → blocked_insufficient_evidence
   - editorial validation errors → blocked_validation_failure
   - overall >= 0.6 AND all thresholds met → enrichment_ready
   - overall >= 0.4 → needs_manual_review
   - else → blocked_insufficient_evidence
5. Output: quality_gate_results.json, quality_gate_report.md, 
   blocked_venues.json, review_queue.json

No DB writes. No model calls. Pure deterministic scoring.
Prompt 5: Review Dashboard Dry-Run
Implement the enrichment review manifest generator for Korantis.

File to create: pipeline/enrichment/06_generate_review_manifest.ts

Context: After the quality gate (E05), we need to generate a manifest that a human 
reviewer can inspect to approve/reject enrichment per venue. For v1, this is a 
JSON + markdown report (not a visual dashboard yet).

Requirements:
1. Load quality_gate_results.json (only venues with status 'enrichment_ready' 
   or 'needs_manual_review')
2. For each venue in review queue, build a ReviewItem containing:
   - Current state: read from DB (current hero, tagline, description, mood_tags, gallery count)
   - Proposed state: from enrichment outputs (new editorial, new gallery, new facts)
   - Diff: which fields changed, what was added
   - Evidence summary: source-backed claims, inferred claims, blocked claims
   - Risk indicators: rights-uncertain images, conflicts, missing evidence
   - Quality gate score + component breakdown
   - Available actions: approve_all, approve_gallery_only, approve_facts_only, 
     approve_editorial_only, reject_all, pause, request_rerun
3. Generate two outputs:
   a) enrichment_review_manifest.json — structured data for each venue
   b) enrichment_review_report.md — human-readable with:
      - Summary table (venue name, score, status, key changes)
      - Per-venue detail block showing current vs proposed
      - Flagged issues requiring attention
      - Action template (reviewer fills in decisions)
4. Generate empty decision template:
   enrichment_decisions.json with all venues set to decision: 'pending'
   Reviewer copies to enrichment_decisions.reviewed.json and fills in decisions.

This reads from DB (current state) and from run files (proposed state).
No writes to DB. Output is files only.
K. Final Recommendation
What to do tomorrow morning
Build E00 + E01 for your active Buenos Aires venues.

Rationale:

Zero risk (read-only)
Immediately useful (you'll know exactly which of your 73 active venues need what)
Informs all subsequent work (you can't prioritize gallery/editorial without knowing the gaps)
Takes 3-4 hours maximum
Produces a concrete report you can act on
Concrete steps:

Create pipeline/enrichment/ directory
Implement 00_select_targets.ts — query venues, check images, check editorial fields, score priorities
Run it: npx tsx pipeline/enrichment/00_select_targets.ts --active-only --city "Buenos Aires"
Read the report. You'll see exactly how many venues need gallery, how many need editorial, how many are thin.
Implement 01_collect_evidence.ts — for each target, extract what evidence already exists in stored data
Run it. Now you know which venues have good evidence for richer editorial and which are "beautiful but weakly sourced."
After that report exists, you'll have data-driven clarity on whether to prioritize:

Gallery depth (if most venues have good evidence but only 1 image)
Evidence collection (if most venues are thin on sources)
Editorial rewrite (if evidence is strong but copy is weak)
Do NOT build the visual review dashboard yet. JSON manifest + markdown report is sufficient for a solo founder reviewing 20-50 venues. Build the dashboard when you have 3+ people reviewing or > 100 venues per batch.

Do NOT build apply/rollback yet. First prove that the discovery + classification + scoring pipeline produces outputs you trust. Only then wire up the mutation layer.

Maximum impact, minimum risk:
Tomorrow: E00 + E01 (read-only audit) → 4 hours
Day 2-3: E02 gallery discovery + classification → 8 hours  
Day 4: E05 quality gate (scoring only) → 4 hours
Day 5-6: E03 fact extraction → 6 hours
Day 7-9: E04 editorial generation → 8 hours
Day 10-12: E07/E08 dry-run + apply → 8 hours
Day 13-14: First real enrichment batch applied to 20 venues

Total: ~2 weeks to first enriched venues live.
The first image gallery going live on your venue detail page will be the highest-impact visual improvement you can ship for product quality. Start there.