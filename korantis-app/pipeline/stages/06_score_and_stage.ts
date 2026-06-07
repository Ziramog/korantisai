import type { CandidateStatus, MoodTag, PipelineConfig, StagingResult, VenueComplete } from '../types';

export function scoreAndStage(venue: VenueComplete, config: PipelineConfig): StagingResult {
  const errors = collectBlockingErrors(venue, config);
  const warnings = collectReviewWarnings(venue, config);
  const score_breakdown = buildScoreBreakdown(venue, config);
  const staging_score = clampScore(Object.values(score_breakdown).reduce((sum, value) => sum + value, 0));
  const status = assignStatus(errors, warnings, staging_score, config);

  return {
    venue_name: venue.raw.name,
    status,
    staging_score,
    errors,
    warnings,
    review_reason: buildReviewReason(status, errors, warnings, staging_score, config),
    scored_at: new Date().toISOString(),
    score_breakdown,
  };
}

function collectBlockingErrors(venue: VenueComplete, config: PipelineConfig): string[] {
  const errors: string[] = [];
  const hero = venue.images.hero;
  const moodTags = venue.editorial.mood_tags || [];
  const invalidMoodTags = moodTags.filter((tag) => !config.allowedMoodTags.includes(tag));

  if (!venue.raw.name?.trim()) errors.push('missing_name');
  if (!venue.raw.coordinates || !Number.isFinite(venue.raw.coordinates.lat) || !Number.isFinite(venue.raw.coordinates.lng)) errors.push('missing_coordinates');
  if (!venue.raw.address?.trim()) errors.push('missing_address');
  if (!venue.raw.google_maps_url?.trim()) errors.push('missing_google_maps_url');
  if (!venue.raw.neighborhood?.trim()) errors.push('missing_neighborhood');
  if (!venue.raw.type || venue.raw.type === 'unknown') errors.push('missing_type');
  if (venue.raw.operational_status === 'closed' || venue.raw.operational_status === 'temporarily_closed') errors.push('venue_not_operational');
  if (!hero || !venue.images.has_hero_image) errors.push('no_hero_image');
  if (hero && Math.max(hero.width, hero.height) < config.hardBlockHeroBelow) errors.push('hero_below_hard_minimum');
  if (hero?.rights_risk === 'high') errors.push('hero_high_rights_risk');
  if (hero && hero.shows_space === false) errors.push('hero_does_not_show_space');
  if (hero && hero.usable === false) errors.push('hero_not_usable');
  if (!venue.editorial.tagline || venue.editorial.tagline.trim().length < 12) errors.push('missing_or_short_tagline');
  if (!venue.editorial.description || venue.editorial.description.trim().length < 80) errors.push('missing_description');
  if (moodTags.length < 2) errors.push('fewer_than_two_mood_tags');
  if (invalidMoodTags.length > 0) errors.push('invalid_mood_tags');
  if (venue.evidence.confidence < config.minEvidenceConfidence) errors.push('evidence_confidence_below_minimum');

  return errors;
}

function collectReviewWarnings(venue: VenueComplete, config: PipelineConfig): string[] {
  const warnings = new Set<string>([
    ...(venue.evidence.warnings || []),
    ...(venue.images.warnings || []),
    ...(venue.editorial.warnings || []),
  ]);
  const hero = venue.images.hero;

  if (hero?.rights_risk === 'medium') warnings.add('medium_rights_risk');
  if (hero && Math.max(hero.width, hero.height) < config.preferredHeroWidth) warnings.add('below_preferred_resolution');
  if (venue.editorial.mood_confidence < config.minMoodConfidence) warnings.add('low_mood_confidence');
  if (venue.evidence.confidence < Math.max(config.minEvidenceConfidence + 0.2, 0.5)) warnings.add('low_evidence_confidence');
  if (venue.review_count < 10) warnings.add('few_reviews');
  if ((venue.editorial.tagline || '').length > 80) warnings.add('tagline_over_80_chars');
  if (!venue.raw.website_url && !venue.evidence.contact?.website) warnings.add('missing_website');
  if (!venue.raw.instagram_url && !venue.evidence.contact?.instagram) warnings.add('missing_instagram');
  if (!venue.raw.hours) warnings.add('missing_hours');
  if (!venue.raw.price_hint) warnings.add('missing_price_hint');
  if (!venue.editorial.moments || venue.editorial.moments.length === 0) warnings.add('missing_moments');

  return [...warnings].filter((warning) => config.reviewWarnings.includes(warning));
}

function buildScoreBreakdown(venue: VenueComplete, config: PipelineConfig): StagingResult['score_breakdown'] {
  const hero = venue.images.hero;
  const heroMaxDim = hero ? Math.max(hero.width, hero.height) : 0;
  const validMoodTags = venue.editorial.mood_tags.filter((tag): tag is MoodTag => config.allowedMoodTags.includes(tag));
  const hasWebsite = Boolean(venue.raw.website_url || venue.evidence.contact?.website);
  const hasInstagram = Boolean(venue.raw.instagram_url || venue.evidence.contact?.instagram);
  const hasHours = Boolean(venue.raw.hours);
  const hasPrice = Boolean(venue.raw.price_hint);
  const hasMoments = Boolean(venue.editorial.moments?.length);

  return {
    image_quality: hero
      ? scale(heroMaxDim, config.hardBlockHeroBelow, config.preferredHeroWidth, 4, 20) + (hero.shows_space ? 5 : 0) + (hero.usable ? 5 : 0)
      : 0,
    image_rights: hero?.rights_risk === 'low' ? 12 : hero?.rights_risk === 'medium' ? 6 : 0,
    editorial_completeness: (venue.editorial.tagline ? 8 : 0) + (venue.editorial.description ? 10 : 0) + Math.min(validMoodTags.length * 2, 8),
    mood_confidence: Math.round(Math.max(0, Math.min(venue.editorial.mood_confidence, 1)) * 10),
    evidence_confidence: Math.round(Math.max(0, Math.min(venue.evidence.confidence, 1)) * 12),
    review_count: scale(venue.review_count, 0, config.maxReviewsToProcess, 0, 8),
    practical_completeness: (venue.raw.address ? 4 : 0) + (venue.raw.coordinates ? 4 : 0) + (venue.raw.google_maps_url ? 4 : 0) + (venue.raw.neighborhood ? 3 : 0) + (venue.raw.type && venue.raw.type !== 'unknown' ? 3 : 0),
    practical_bonus: (hasWebsite ? 2 : 0) + (hasInstagram ? 2 : 0) + (hasHours ? 2 : 0) + (hasPrice ? 2 : 0) + (hasMoments ? 2 : 0),
  };
}

function assignStatus(errors: string[], warnings: string[], score: number, config: PipelineConfig): CandidateStatus {
  if (errors.length > 0) {
    return 'blocked';
  }

  if (score >= config.autoStageThreshold && warnings.length <= config.maxWarningsAutoStage) {
    return 'auto_staged';
  }

  return 'needs_review';
}

function buildReviewReason(
  status: CandidateStatus,
  errors: string[],
  warnings: string[],
  score: number,
  config: PipelineConfig,
): string {
  if (status === 'blocked') {
    return `Blocked by hard errors: ${errors.join(', ')}`;
  }
  if (status === 'auto_staged') {
    return `Auto-staged with score ${score} and ${warnings.length} warning(s).`;
  }
  const reasons = [
    score < config.autoStageThreshold ? 'score_below_auto_stage_threshold' : '',
    warnings.length > config.maxWarningsAutoStage ? 'too_many_warnings_for_auto_stage' : '',
    ...warnings,
  ].filter(Boolean);
  return `Needs review: ${[...new Set(reasons)].join(', ')}`;
}

function scale(value: number, min: number, max: number, outMin: number, outMax: number): number {
  if (value <= min) return outMin;
  if (value >= max) return outMax;
  const ratio = (value - min) / (max - min);
  return Math.round(outMin + ratio * (outMax - outMin));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
