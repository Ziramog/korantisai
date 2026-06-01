export type ReviewSnapshotSource = 'google_maps_snapshot' | 'tripadvisor_snapshot' | 'other';

export type ReviewSnapshotReview = {
  author_name?: string;
  rating?: number;
  relative_time?: string;
  text: string;
  language?: string;
};

export type ReviewSnapshotContract = {
  venue_name: string;
  google_place_id: string;
  source: ReviewSnapshotSource;
  collected_at: string;
  review_count_collected: number;
  reviews: ReviewSnapshotReview[];
  legal_basis_note?: string;
  collection_method?: string;
};

export const REVIEW_SNAPSHOT_CONTRACT_VERSION = 'review_snapshot_contract_v1' as const;
