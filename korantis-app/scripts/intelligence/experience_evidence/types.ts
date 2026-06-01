export type ExperienceEvidenceSource =
  | 'google_review'
  | 'google_metadata'
  | 'vision'
  | 'editorial'
  | 'community'
  | 'travel'
  | 'blog'
  | 'future_review_snapshot';

export type ExperienceEvidenceSignal =
  | 'work_signal'
  | 'laptop_signal'
  | 'wifi_signal'
  | 'outlet_signal'
  | 'study_signal'
  | 'quiet_signal'
  | 'reading_signal'
  | 'long_stay_signal'
  | 'quick_stop_signal'
  | 'seating_signal'
  | 'interior_signal'
  | 'crowded_signal'
  | 'loud_signal'
  | 'tourist_signal'
  | 'local_signal'
  | 'heritage_signal'
  | 'premium_signal'
  | 'romantic_signal'
  | 'date_signal'
  | 'group_signal'
  | 'solo_signal'
  | 'design_signal'
  | 'specialty_signal'
  | 'coffee_quality_signal'
  | 'wine_signal'
  | 'cocktail_signal'
  | 'dinner_signal'
  | 'service_signal'
  | 'price_complaint_signal'
  | 'reservation_signal';

export type EvidenceConstraint =
  | 'crowded'
  | 'loud'
  | 'expensive'
  | 'slow_service'
  | 'poor_service'
  | 'no_seating'
  | 'takeaway_first'
  | 'tourist_heavy'
  | 'weak_photo_evidence'
  | 'weak_text_evidence'
  | 'missing_reviews'
  | 'missing_vision';

export type ExperienceEvidenceItem = {
  id: string;
  candidate_id: string;
  venue_name: string;
  source: string;
  source_type: ExperienceEvidenceSource;
  text: string | null;
  structured_data: Record<string, unknown>;
  url?: string;
  confidence: number;
  collected_at: string;
};

export type EvidenceExtractionResult = {
  evidence_item_id: string;
  signals: Record<ExperienceEvidenceSignal, number>;
  constraints: EvidenceConstraint[];
  confidence: number;
  matched_terms: string[];
};

export type ExperienceEvidenceBundle = {
  candidate_id: string;
  venue_name: string;
  items: ExperienceEvidenceItem[];
  extractions: EvidenceExtractionResult[];
};

export type ExperienceEvidenceSummary = {
  candidate_id: string;
  venue_name: string;
  evidence_item_count: number;
  source_type_breakdown: Record<ExperienceEvidenceSource, number>;
  positive_signals: Partial<Record<ExperienceEvidenceSignal, number>>;
  constraints: EvidenceConstraint[];
  evidence_gaps: string[];
};

export type VenueExperienceSignalScores = {
  candidate_id: string;
  venue_name: string;
  evidence_strength_score: number;
  signal_scores: Record<ExperienceEvidenceSignal, number>;
  constraints: EvidenceConstraint[];
  evidence_gaps: string[];
  confidence: number;
};
