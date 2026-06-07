import type { ImageSourceType, MoodTag, PipelineConfig, PipelineStageStatus, VenueType } from './types';

export const allowedMoodTags: MoodTag[] = [
  'quiet',
  'warm',
  'romantic',
  'lively',
  'intimate',
  'cinematic',
  'historic',
  'creative',
  'work_friendly',
  'date_night',
  'late_night',
  'outdoor',
  'hidden_gem',
  'refined',
  'social',
];

export const allowedVenueTypes: VenueType[] = [
  'bar',
  'cocktail_bar',
  'cafe',
  'cafe_bar',
  'bakery_cafe',
  'rooftop_bar',
  'speakeasy',
  'restaurant',
  'coffee_shop',
  'fine_dining',
  'bistro',
  'parrilla',
  'wine_bar',
  'plant_based',
  'unknown',
];

export const allowedImageSourceTypes: ImageSourceType[] = [
  'official_website',
  'official_gallery',
  'press_media',
  'michelin',
  'fifty_best',
  'city_tourism',
  'editorial_review',
  'instagram',
  'google_places',
  'ugc',
  'unknown',
];

export const allowedStageStatuses: PipelineStageStatus[] = [
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
  'ready_for_db_staging',
  'auto_staged',
  'needs_review',
  'blocked',
  'approved',
  'rejected',
  'staged',
  'published',
];

export const blockingErrors = [
  'missing_name',
  'missing_coordinates',
  'missing_address',
  'missing_google_maps_url',
  'missing_neighborhood',
  'missing_type',
  'venue_not_operational',
  'no_hero_image',
  'hero_below_hard_minimum',
  'hero_high_rights_risk',
  'hero_does_not_show_space',
  'hero_not_usable',
  'missing_or_short_tagline',
  'missing_description',
  'fewer_than_two_mood_tags',
  'invalid_mood_tags',
  'evidence_confidence_below_minimum',
];

export const reviewWarnings = [
  'score_below_auto_stage_threshold',
  'too_many_warnings_for_auto_stage',
  'medium_rights_risk',
  'below_preferred_resolution',
  'low_mood_confidence',
  'low_evidence_confidence',
  'few_reviews',
  'tagline_over_80_chars',
  'missing_website',
  'missing_instagram',
  'missing_hours',
  'missing_price_hint',
  'missing_moments',
];

export const defaultPipelineConfig: PipelineConfig = {
  minImageWidth: 800,
  minHeroWidth: 800,
  hardBlockHeroBelow: 600,
  preferredHeroWidth: 1024,
  minMoodConfidence: 0.6,
  minEvidenceConfidence: 0.3,
  autoStageThreshold: 75,
  maxWarningsAutoStage: 2,
  maxImageCandidatesPerVenue: 8,
  maxReviewsToProcess: 30,
  allowedMoodTags,
  allowedVenueTypes,
  allowedImageSourceTypes,
  allowedStageStatuses,
  blockingErrors,
  reviewWarnings,
};

export function mergePipelineConfig(overrides: Partial<PipelineConfig> | undefined): PipelineConfig {
  return {
    ...defaultPipelineConfig,
    ...(overrides || {}),
    allowedMoodTags: overrides?.allowedMoodTags || defaultPipelineConfig.allowedMoodTags,
    allowedVenueTypes: overrides?.allowedVenueTypes || defaultPipelineConfig.allowedVenueTypes,
    allowedImageSourceTypes: overrides?.allowedImageSourceTypes || defaultPipelineConfig.allowedImageSourceTypes,
    allowedStageStatuses: overrides?.allowedStageStatuses || defaultPipelineConfig.allowedStageStatuses,
    blockingErrors: overrides?.blockingErrors || defaultPipelineConfig.blockingErrors,
    reviewWarnings: overrides?.reviewWarnings || defaultPipelineConfig.reviewWarnings,
  };
}
