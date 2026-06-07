export type PipelineStageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'ready_for_db_staging'
  | 'auto_staged'
  | 'needs_review'
  | 'blocked'
  | 'approved'
  | 'rejected'
  | 'staged'
  | 'published';

export type MoodTag =
  | 'quiet'
  | 'warm'
  | 'romantic'
  | 'lively'
  | 'intimate'
  | 'cinematic'
  | 'historic'
  | 'creative'
  | 'work_friendly'
  | 'date_night'
  | 'late_night'
  | 'outdoor'
  | 'hidden_gem'
  | 'refined'
  | 'social';

export type VenueType =
  | 'bar'
  | 'cocktail_bar'
  | 'cafe'
  | 'cafe_bar'
  | 'bakery_cafe'
  | 'rooftop_bar'
  | 'speakeasy'
  | 'restaurant'
  | 'coffee_shop'
  | 'fine_dining'
  | 'bistro'
  | 'parrilla'
  | 'wine_bar'
  | 'plant_based'
  | 'unknown';

export type ImageSourceType =
  | 'official_website'
  | 'official_gallery'
  | 'press_media'
  | 'michelin'
  | 'fifty_best'
  | 'city_tourism'
  | 'editorial_review'
  | 'instagram'
  | 'google_places'
  | 'ugc'
  | 'unknown';

export type RiskFlag =
  | 'rights_review_needed'
  | 'face_release_needed'
  | 'identity_review_needed'
  | 'below_preferred_resolution'
  | 'preferred_resolution'
  | 'source_trust_only'
  | 'possible_cdn_unverified'
  | 'low_resolution'
  | 'product_only'
  | 'unsupported_format'
  | 'medium_rights_risk'
  | 'high_rights_risk'
  | 'venue_not_operational';

export type CandidateStatus =
  | 'ready_for_db_staging'
  | 'auto_staged'
  | 'needs_review'
  | 'blocked'
  | 'approved'
  | 'rejected'
  | 'staged'
  | 'published';

export interface BatchInput {
  batch_id: string;
  city: string;
  created_at: string;
  notes?: string;
  venues?: VenueInput[];
  prebuilt_venues?: VenueComplete[];
  config_overrides?: Partial<PipelineConfig>;
}

export interface VenueInput {
  name: string;
  neighborhood?: string;
  type?: VenueType;
  google_maps_url?: string;
  notes?: string;
  seed_urls?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
}

export interface PipelineConfig {
  minImageWidth: number;
  minHeroWidth: number;
  hardBlockHeroBelow: number;
  preferredHeroWidth: number;
  minMoodConfidence: number;
  minEvidenceConfidence: number;
  autoStageThreshold: number;
  maxWarningsAutoStage: number;
  maxImageCandidatesPerVenue: number;
  maxReviewsToProcess: number;
  allowedMoodTags: MoodTag[];
  allowedVenueTypes: VenueType[];
  allowedImageSourceTypes: ImageSourceType[];
  allowedStageStatuses: PipelineStageStatus[];
  blockingErrors: string[];
  reviewWarnings: string[];
}

export interface VenueRaw {
  input: VenueInput;
  name: string;
  city: string;
  place_id?: string;
  address?: string;
  neighborhood?: string;
  type?: VenueType;
  coordinates?: {
    lat: number;
    lng: number;
  };
  google_maps_url?: string;
  google_place_types?: string[];
  website_url?: string;
  instagram_url?: string;
  hours?: string;
  price_hint?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  phone?: string;
  business_status?: string;
  operational_status?: 'operational' | 'temporarily_closed' | 'closed' | 'unknown';
  extraction_confidence?: number;
  extraction_error?: string;
  extraction_warnings?: string[];
  raw_google_place?: Record<string, unknown>;
  raw_reviews?: string[];
}

export interface VenueEvidence {
  confidence: number;
  sources: Array<{
    source_url: string;
    source_type: string;
    evidence_text?: string;
    confidence?: number;
  }>;
  contact?: {
    website?: string;
    instagram?: string;
    phone?: string;
    whatsapp?: string;
    reservation_url?: string;
    menu_url?: string;
  };
  factual_notes?: string[];
  warnings?: string[];
}

export interface ImageCandidate {
  id?: string;
  venue_name: string;
  source_url: string;
  resolved_image_url: string;
  original_image_url?: string;
  source_type: ImageSourceType;
  rights_hint?: string;
  rights_risk: 'low' | 'medium' | 'high' | 'unknown';
  width: number;
  height: number;
  content_length?: number;
  content_type?: string;
  sha256?: string;
  dedupe_hash?: string;
  alt_text?: string;
  source_page_context?: string;
  validation_status?: 'accepted_for_m3_preflight' | 'rejected_before_m3' | 'imported_needs_validation';
  prefilter_decision?: 'pass_to_m3' | 'reject_before_m3';
  rejection_reasons?: string[];
  publication_status?: 'not_approved_for_publication';
  classification?: {
    shows_space: boolean;
    is_hero_usable: boolean;
    scene: string;
    atmosphere_signal: string;
    quality: string;
    model_used: string;
    has_identifiable_faces: boolean;
  };
  shows_space?: boolean;
  usable?: boolean;
  role?: 'hero' | 'card' | 'gallery' | 'reference';
  risk_flags?: RiskFlag[];
  notes?: string;
}

export interface ImageClassification {
  hero?: ImageCandidate;
  candidates: ImageCandidate[];
  has_hero_image: boolean;
  spatial_candidate_count: number;
  product_candidate_count: number;
  warnings?: string[];
}

export interface VenueEditorial {
  tagline?: string;
  description?: string;
  description_short?: string;
  mood_tags: MoodTag[];
  mood_confidence: number;
  moments?: string[];
  warnings?: string[];
}

export interface VenueComplete {
  raw: VenueRaw;
  evidence: VenueEvidence;
  images: ImageClassification;
  hero_image?: ImageCandidate;
  editorial: VenueEditorial;
  review_count: number;
  review_count_processed?: number;
  pipeline_notes?: string[];
}

export interface StagingResult {
  venue_name: string;
  status: CandidateStatus;
  staging_score: number;
  errors: string[];
  warnings: string[];
  review_reason: string;
  scored_at: string;
  score_breakdown: {
    image_quality: number;
    image_rights: number;
    editorial_completeness: number;
    mood_confidence: number;
    evidence_confidence: number;
    review_count: number;
    practical_completeness: number;
    practical_bonus: number;
  };
}

export interface ReviewQueueItem {
  batch_id: string;
  venue_name: string;
  status: CandidateStatus;
  staging_score: number;
  review_reason: string;
  errors: string[];
  warnings: string[];
  venue: VenueComplete;
}

export interface BatchResult {
  batch_id: string;
  city: string;
  generated_at: string;
  status: PipelineStageStatus;
  summary: {
    input: number;
    ready_for_db_staging?: number;
    auto_staged: number;
    needs_review: number;
    blocked: number;
    approved: number;
    rejected: number;
    staged: number;
    published: number;
  };
  stage_statuses: Array<{
    stage: string;
    status: PipelineStageStatus;
    notes?: string;
  }>;
  config: PipelineConfig;
  candidates: ReviewQueueItem[];
  mood_distribution: Record<string, number>;
  neighborhood_distribution: Record<string, number>;
  cost_placeholder: {
    estimated_usd: null;
    notes: string;
  };
  runtime_placeholder: {
    started_at: string;
    finished_at: string;
    duration_ms: number;
  };
}
