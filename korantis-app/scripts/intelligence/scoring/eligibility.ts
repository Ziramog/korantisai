import type { EligibilityDecision, IntelligenceScoringInput, IntentScores } from '../types';
import { clampScore, weightedAverage } from './utils';

export type EligibilityInput = IntelligenceScoringInput & {
  intent_scores: IntentScores;
};

export function computeEligibilityV0(input: EligibilityInput): EligibilityDecision {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const { scores, signals, photo_intelligence: photo, intent_scores: intents, evidence } = input;
  const photoNotEvaluated = photo.evaluation_status === 'not_evaluated';
  const hasUnresolvedAmbiguity = evidence.constraints.some((constraint) => constraint.includes('ambiguous_match'));
  const hasUnmatchedGoogle = evidence.constraints.some((constraint) => constraint.includes('unmatched'));
  const hasBadMatch = evidence.constraints.some((constraint) => constraint.includes('bad match') || constraint.includes('category mismatch'));

  if (!photo.acceptable_hero_photo && !photoNotEvaluated) reasons.push('no acceptable hero photo');
  if (!photo.acceptable_hero_photo && photoNotEvaluated) warnings.push('photo intelligence not evaluated');
  if (!photoNotEvaluated && (
    (photo.product_only_risk >= 90 && photo.photo_quality_score < 60) ||
    (photo.storefront_only_risk >= 90 && photo.interior_confidence < 25 && photo.photo_quality_score < 60)
  )) reasons.push('product-only or storefront-only visual risk dominates');
  if (!photoNotEvaluated && photo.photo_quality_score < 45) reasons.push('photo quality too weak');
  if (signals.chain_signal >= 70 || signals.mainstream_signal >= 85) reasons.push('generic chain/mainstream signal too high');
  if ((scores.discovery_score ?? 0) < 35 || (scores.consensus_score ?? 0) < 30) reasons.push('discovery confidence too weak');
  if ((scores.discovery_score ?? 0) < 50 && (scores.cultural_relevance_score ?? 0) < 45 && photo.photo_quality_score < 55) reasons.push('weak discovery, cultural, and photo evidence');
  if (evidence.source_evidence.length === 0 && evidence.review_evidence.length === 0) reasons.push('insufficient evidence');
  if (input.category === 'unknown') reasons.push('category mismatch');
  if (hasBadMatch || hasUnmatchedGoogle) reasons.push('unresolved bad Google match');

  if (input.category === 'cafe' && photo.seating_confidence < 45 && (intents.work_score >= 70 || intents.long_stay_score >= 70)) {
    warnings.push('weak seating signal for work or long-stay cafe use cases');
  }

  if (signals.tourist_signal >= 85 && signals.local_signal < 35) warnings.push('tourist-heavy with weak local fit');
  if (!photoNotEvaluated && photo.product_only_risk >= 70) warnings.push('product-only photo share is high');
  if (!photoNotEvaluated && photo.storefront_only_risk >= 70) warnings.push('storefront-only photo share is high');
  if (!photoNotEvaluated && photo.counter_only_risk >= 60) warnings.push('counter-only risk');
  if (!photoNotEvaluated && photo.seating_confidence < 55) warnings.push('seating signal is unclear');
  if ((scores.experience_quality_score ?? 0) < 45) warnings.push('experience quality score is weak');
  if (evidence.constraints.length > 0) warnings.push(...evidence.constraints.map((constraint) => `constraint: ${constraint}`));

  const eligibilityScore = weightedAverage([
    [scores.discovery_score ?? 0, 0.16],
    [scores.cultural_relevance_score ?? 0, 0.12],
    [scores.experience_quality_score ?? 0, 0.22],
    [photo.photo_quality_score, 0.20],
    [Math.max(...Object.values(intents)), 0.16],
    [signals.chain_signal >= 70 ? 20 : 80, 0.14],
  ]);

  const hardReject = reasons.some((reason) => [
    'no acceptable hero photo',
    'product-only or storefront-only visual risk dominates',
    'generic chain/mainstream signal too high',
    'insufficient evidence',
    'category mismatch',
    'unresolved bad Google match',
    'weak discovery, cultural, and photo evidence',
  ].includes(reason));

  if (hardReject || eligibilityScore < 45) {
    return { status: 'rejected', reasons: reasons.length ? reasons : ['eligibility score too low'], warnings };
  }

  const hasConfidenceGate = (scores.discovery_score ?? 0) >= 60 || (scores.cultural_relevance_score ?? 0) >= 70 || (scores.source_authority_score ?? 0) >= 75;
  const hasEvidenceDiversity = evidence.source_evidence.length >= 2 || (evidence.source_evidence.length >= 1 && evidence.review_evidence.length >= 1);
  const activeHardGatesSatisfied =
    !photoNotEvaluated &&
    photo.acceptable_hero_photo &&
    photo.photo_quality_score >= 70 &&
    hasConfidenceGate &&
    hasEvidenceDiversity &&
    !hasUnresolvedAmbiguity &&
    !hasUnmatchedGoogle &&
    input.category !== 'unknown';

  if (!activeHardGatesSatisfied || reasons.length > 0 || eligibilityScore < 72) {
    return {
      status: 'pending_review',
      reasons: reasons.length ? reasons : [`eligibility score ${clampScore(eligibilityScore)} requires calibration or missing validation gates`],
      warnings,
    };
  }

  return { status: 'active', reasons: ['active gates satisfied'], warnings };
}
