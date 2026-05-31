export type DiscoveryCategory = 'cafe' | 'restaurant' | 'wine_bar' | 'cocktail_bar';

export type DiscoveryStatus =
  | 'discovered'
  | 'pending_editorial_review'
  | 'approved_for_enrichment'
  | 'rejected'
  | 'merged';

export type SourceType = 'editorial' | 'community';

export type District = {
  city: string;
  district: string;
  subdistrict?: string;
  priority: number;
  venue_target: number;
  district_identity_tags: string[];
};

export type SourceMention = {
  venue_name: string;
  city: string;
  district: string;
  category: DiscoveryCategory;
  source: string;
  source_type: SourceType;
  source_url: string;
  context: string;
  rank_position: number | null;
};

export type CandidateVenue = {
  candidate_id: string;
  city: string;
  district: string;
  venue_name: string;
  canonical_name: string;
  aliases: string[];
  category: DiscoveryCategory;
  merged_sources: SourceMention[];
  status: DiscoveryStatus;
};

export type ConsensusScore = {
  source_count: number;
  editorial_mentions: number;
  community_mentions: number;
  district_mentions: number;
  sources: string[];
  consensus_score: number;
};

export type DiscoveryScore = ConsensusScore & {
  editorial_score: number;
  community_score: number;
  frequency_score: number;
  district_relevance_score: number;
  category_confidence_score: number;
  discovery_score: number;
};

export type ScoredCandidateVenue = CandidateVenue & DiscoveryScore & {
  discovery_notes: string;
};
