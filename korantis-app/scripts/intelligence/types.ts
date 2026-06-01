export const VENUE_INTELLIGENCE_VERSION = 'venue_intelligence_v1' as const;

export type IntelligenceVersion = typeof VENUE_INTELLIGENCE_VERSION;

export type VenueCategory = 'cafe' | 'restaurant' | 'wine_bar' | 'cocktail_bar' | 'unknown';

export type EligibilityStatus = 'active' | 'pending_review' | 'rejected';

export type SourceType =
  | 'premium_editorial'
  | 'local_editorial'
  | 'specialist'
  | 'community'
  | 'travel'
  | 'tourism'
  | 'generic';

export type IntelligenceScores = {
  discovery_score: number;
  consensus_score: number;
  cultural_relevance_score: number;
  review_count_log_score: number;
  rating_quality_score: number;
  source_authority_score: number;
  experience_quality_score: number;
  photo_quality_score: number;
  eligibility_score: number;
};

export type VenueSignals = {
  heritage_signal: number;
  landmark_signal: number;
  tourist_signal: number;
  local_signal: number;
  community_signal: number;
  specialty_signal: number;
  design_signal: number;
  novelty_signal: number;
  independent_signal: number;
  mainstream_signal: number;
  luxury_signal: number;
  hidden_signal: number;
  chain_signal: number;
};

export type ExperienceSignals = {
  quiet_signal: number;
  lively_signal: number;
  intimate_signal: number;
  social_signal: number;
  romantic_signal: number;
  work_friendly_signal: number;
  reading_signal: number;
  conversation_signal: number;
  long_stay_signal: number;
  quick_stop_signal: number;
  morning_signal: number;
  afternoon_signal: number;
  golden_hour_signal: number;
  night_signal: number;
  late_night_signal: number;
  creative_signal: number;
  formal_signal: number;
  casual_signal: number;
};

export type IntentScores = {
  work_score: number;
  reading_score: number;
  date_score: number;
  conversation_score: number;
  brunch_score: number;
  dinner_score: number;
  wine_score: number;
  cocktail_score: number;
  solo_score: number;
  friends_score: number;
  creative_session_score: number;
  classic_city_score: number;
  hidden_gem_score: number;
  premium_destination_score: number;
  long_stay_score: number;
  quick_stop_score: number;
};

export type PhotoIntelligence = {
  acceptable_hero_photo: boolean;
  hero_photo_reference: string | null;
  best_card_photo_reference: string | null;
  photo_quality_score: number;
  interior_confidence: number;
  seating_confidence: number;
  natural_light_score: number;
  long_stay_visual_signal: number;
  design_visual_signal: number;
  product_only_risk: number;
  storefront_only_risk: number;
  counter_only_risk: number;
  evaluation_status: 'evaluated' | 'not_evaluated';
  warnings: string[];
};

export type EligibilityDecision = {
  status: EligibilityStatus;
  reasons: string[];
  warnings: string[];
};

export type SourceEvidence = {
  source: string;
  source_type: SourceType;
  source_weight: number;
  signal: string;
  context?: string;
  rank_position?: number | null;
};

export type PhotoEvidence = {
  photo_reference: string;
  signals: string[];
  score: number;
};

export type ReviewEvidence = {
  text: string;
  signals: string[];
  rating?: number | null;
};

export type GoogleEvidence = {
  rating: number | null;
  review_count: number;
  price_level?: string | number | null;
  primary_type?: string | null;
  types: string[];
  business_status?: string | null;
};

export type EvidenceObject = {
  source_evidence: SourceEvidence[];
  photo_evidence: PhotoEvidence[];
  review_evidence: ReviewEvidence[];
  google_evidence: GoogleEvidence;
  constraints: string[];
};

export type DerivedArchetype = {
  name: string;
  confidence: number;
};

export type VenueIntelligence = {
  candidate_id: string | null;
  google_place_id: string | null;
  city: string;
  district: string;
  category: VenueCategory;
  scores: IntelligenceScores;
  signals: VenueSignals;
  experience_signals: ExperienceSignals;
  intent_scores: IntentScores;
  photo_intelligence: PhotoIntelligence;
  eligibility: EligibilityDecision;
  derived_archetypes: DerivedArchetype[];
  evidence: EvidenceObject;
  version: IntelligenceVersion;
};

export type IntelligenceScoringInput = {
  category: VenueCategory;
  scores: Partial<IntelligenceScores>;
  signals: VenueSignals;
  experience_signals: ExperienceSignals;
  photo_intelligence: PhotoIntelligence;
  evidence: EvidenceObject;
};
