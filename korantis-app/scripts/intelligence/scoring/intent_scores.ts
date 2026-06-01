import type { IntelligenceScoringInput, IntentScores } from '../types';
import { clampScore, maxScore, weightedAverage } from './utils';

export function computeIntentScoresV0(input: IntelligenceScoringInput): IntentScores {
  const { category, scores, signals, experience_signals: experience, photo_intelligence: photo } = input;
  const cultural = scores.cultural_relevance_score ?? 0;
  const sourceAuthority = scores.source_authority_score ?? 0;
  const experienceQuality = scores.experience_quality_score ?? 0;

  const work_score = weightedAverage([
    [experience.work_friendly_signal, 0.28],
    [experience.quiet_signal, 0.18],
    [experience.long_stay_signal, 0.20],
    [photo.seating_confidence, 0.18],
    [photo.long_stay_visual_signal, 0.16],
  ]);

  const reading_score = weightedAverage([
    [experience.reading_signal, 0.30],
    [experience.quiet_signal, 0.25],
    [photo.interior_confidence, 0.15],
    [photo.seating_confidence, 0.15],
    [experience.morning_signal + experience.afternoon_signal / 2, 0.15],
  ]);

  const date_score = weightedAverage([
    [experience.intimate_signal, 0.24],
    [experience.romantic_signal, 0.24],
    [signals.design_signal, 0.18],
    [experience.conversation_signal, 0.16],
    [photo.design_visual_signal, 0.18],
  ]);

  const conversation_score = weightedAverage([
    [experience.conversation_signal, 0.35],
    [experience.social_signal, 0.20],
    [experience.quiet_signal, 0.15],
    [photo.seating_confidence, 0.15],
    [experience.casual_signal, 0.15],
  ]);

  const brunch_score = weightedAverage([
    [category === 'cafe' || category === 'restaurant' ? 75 : 20, 0.30],
    [experience.morning_signal, 0.20],
    [experience.social_signal, 0.15],
    [photo.natural_light_score ?? photo.design_visual_signal, 0.15],
    [experience.casual_signal, 0.20],
  ]);

  const dinner_score = weightedAverage([
    [category === 'restaurant' ? 85 : 25, 0.35],
    [experience.night_signal, 0.20],
    [experience.formal_signal + experience.social_signal / 2, 0.15],
    [signals.luxury_signal + signals.design_signal / 2, 0.15],
    [sourceAuthority, 0.15],
  ]);

  const wine_score = weightedAverage([
    [category === 'wine_bar' ? 90 : 20, 0.40],
    [signals.specialty_signal, 0.20],
    [experience.intimate_signal, 0.14],
    [experience.conversation_signal, 0.12],
    [signals.design_signal, 0.14],
  ]);

  const cocktail_score = weightedAverage([
    [category === 'cocktail_bar' ? 90 : 20, 0.40],
    [experience.night_signal, 0.20],
    [experience.social_signal, 0.14],
    [signals.design_signal, 0.14],
    [sourceAuthority, 0.12],
  ]);

  const solo_score = weightedAverage([
    [experience.quiet_signal, 0.25],
    [experience.reading_signal, 0.18],
    [experience.work_friendly_signal, 0.18],
    [photo.seating_confidence, 0.16],
    [signals.tourist_signal > 70 ? 25 : 75, 0.23],
  ]);

  const friends_score = weightedAverage([
    [experience.social_signal, 0.30],
    [experience.lively_signal, 0.20],
    [experience.conversation_signal, 0.20],
    [experience.casual_signal, 0.15],
    [photo.seating_confidence, 0.15],
  ]);

  const creative_session_score = weightedAverage([
    [signals.novelty_signal, 0.20],
    [signals.design_signal, 0.20],
    [experience.creative_signal, 0.25],
    [work_score, 0.20],
    [signals.community_signal, 0.15],
  ]);

  const classic_city_score = weightedAverage([
    [signals.heritage_signal, 0.30],
    [signals.landmark_signal, 0.24],
    [cultural, 0.24],
    [signals.tourist_signal, 0.12],
    [signals.local_signal, 0.10],
  ]);

  const hidden_gem_score = weightedAverage([
    [signals.hidden_signal, 0.24],
    [signals.community_signal, 0.22],
    [signals.independent_signal, 0.20],
    [100 - signals.tourist_signal, 0.18],
    [experienceQuality, 0.16],
  ]);

  const premium_destination_score = weightedAverage([
    [signals.luxury_signal, 0.24],
    [sourceAuthority, 0.24],
    [signals.design_signal, 0.18],
    [scores.rating_quality_score ?? 0, 0.12],
    [dinner_score, 0.22],
  ]);

  const long_stay_score = weightedAverage([
    [experience.long_stay_signal, 0.30],
    [photo.long_stay_visual_signal, 0.25],
    [photo.seating_confidence, 0.20],
    [experience.quiet_signal, 0.15],
    [photo.counter_only_risk > 60 ? 15 : 75, 0.10],
  ]);

  const quick_stop_score = weightedAverage([
    [experience.quick_stop_signal, 0.34],
    [photo.counter_only_risk, 0.20],
    [signals.mainstream_signal, 0.12],
    [100 - long_stay_score, 0.20],
    [category === 'cafe' ? 70 : 45, 0.14],
  ]);

  return {
    work_score: clampScore(work_score),
    reading_score: clampScore(reading_score),
    date_score: clampScore(date_score),
    conversation_score: clampScore(conversation_score),
    brunch_score: clampScore(brunch_score),
    dinner_score: clampScore(dinner_score),
    wine_score: clampScore(wine_score),
    cocktail_score: clampScore(cocktail_score),
    solo_score: clampScore(solo_score),
    friends_score: clampScore(friends_score),
    creative_session_score: clampScore(creative_session_score),
    classic_city_score: clampScore(classic_city_score),
    hidden_gem_score: clampScore(hidden_gem_score),
    premium_destination_score: clampScore(premium_destination_score),
    long_stay_score: clampScore(long_stay_score),
    quick_stop_score: clampScore(maxScore(quick_stop_score, photo.product_only_risk > 70 ? 75 : 0)),
  };
}
