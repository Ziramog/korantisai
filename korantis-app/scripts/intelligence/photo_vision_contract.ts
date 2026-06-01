export type PhotoVisionResult = {
  photo_reference: string;
  interior_visible: boolean;
  exterior_visible: boolean;
  seating_visible: boolean;
  people_staying_visible: boolean;
  counter_only: boolean;
  product_only: boolean;
  storefront_only: boolean;
  menu_only: boolean;
  natural_light_score: number;
  spatial_depth_score: number;
  design_quality_score: number;
  atmosphere_score: number;
  hero_suitability_score: number;
  card_suitability_score: number;
  warnings: string[];
};

export type VenuePhotoVisionAggregation = {
  acceptable_hero_photo: boolean;
  hero_photo_reference: string | null;
  best_card_photo_reference: string | null;
  photo_quality_score: number;
  interior_confidence: number;
  seating_confidence: number;
  long_stay_visual_signal: number;
  design_visual_signal: number;
  warnings: string[];
};

export const PHOTO_VISION_CONTRACT_VERSION = 'photo_vision_contract_v1' as const;

export const PHOTO_VISION_RESULT_SCHEMA_EXAMPLE: PhotoVisionResult = {
  photo_reference: '',
  interior_visible: false,
  exterior_visible: false,
  seating_visible: false,
  people_staying_visible: false,
  counter_only: false,
  product_only: false,
  storefront_only: false,
  menu_only: false,
  natural_light_score: 0,
  spatial_depth_score: 0,
  design_quality_score: 0,
  atmosphere_score: 0,
  hero_suitability_score: 0,
  card_suitability_score: 0,
  warnings: [],
};

export const VENUE_PHOTO_AGGREGATION_SCHEMA_EXAMPLE: VenuePhotoVisionAggregation = {
  acceptable_hero_photo: false,
  hero_photo_reference: null,
  best_card_photo_reference: null,
  photo_quality_score: 0,
  interior_confidence: 0,
  seating_confidence: 0,
  long_stay_visual_signal: 0,
  design_visual_signal: 0,
  warnings: [],
};
