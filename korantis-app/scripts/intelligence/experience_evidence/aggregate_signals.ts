import type {
  EvidenceConstraint,
  ExperienceEvidenceBundle,
  ExperienceEvidenceSignal,
  VenueExperienceSignalScores,
} from './types';
import { emptySignalScores, EXPERIENCE_SIGNALS } from './signals';

const SOURCE_WEIGHTS = {
  google_review: 0.90,
  google_metadata: 0.55,
  vision: 0.95,
  editorial: 0.78,
  community: 0.86,
  travel: 0.58,
  blog: 0.70,
  future_review_snapshot: 0.92,
};

const CONSTRAINT_PENALTIES: Partial<Record<EvidenceConstraint, Partial<Record<ExperienceEvidenceSignal, number>>>> = {
  crowded: { work_signal: 12, quiet_signal: 18, reading_signal: 14, romantic_signal: 8 },
  loud: { work_signal: 14, quiet_signal: 22, reading_signal: 18, romantic_signal: 8 },
  expensive: { local_signal: 6, quick_stop_signal: 8 },
  slow_service: { quick_stop_signal: 10, dinner_signal: 6 },
  poor_service: { dinner_signal: 8, premium_signal: 8 },
  no_seating: { work_signal: 24, long_stay_signal: 26, seating_signal: 30, reading_signal: 16 },
  takeaway_first: { work_signal: 14, long_stay_signal: 18, seating_signal: 16 },
  tourist_heavy: { local_signal: 16 },
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sourceBoost(signal: ExperienceEvidenceSignal, sourceType: keyof typeof SOURCE_WEIGHTS): number {
  if (sourceType === 'editorial' && ['premium_signal', 'heritage_signal', 'design_signal', 'dinner_signal'].includes(signal)) return 1.10;
  if (sourceType === 'blog' && ['specialty_signal', 'coffee_quality_signal', 'wine_signal'].includes(signal)) return 1.08;
  if (sourceType === 'community' && ['local_signal', 'work_signal', 'laptop_signal', 'wifi_signal', 'quiet_signal'].includes(signal)) return 1.14;
  if (sourceType === 'travel' && ['tourist_signal', 'heritage_signal', 'premium_signal'].includes(signal)) return 1.08;
  if (sourceType === 'vision' && ['seating_signal', 'interior_signal', 'design_signal', 'long_stay_signal'].includes(signal)) return 1.16;
  return 1;
}

function evidenceGaps(bundle: ExperienceEvidenceBundle, signalScores: Record<ExperienceEvidenceSignal, number>): string[] {
  const gaps: string[] = [];
  const hasVision = bundle.items.some((item) => item.source_type === 'vision');
  const hasCommunity = bundle.items.some((item) => item.source_type === 'community');
  const hasReview = bundle.items.some((item) => item.source_type === 'google_review' || item.source_type === 'future_review_snapshot');

  if (!hasVision) gaps.push('missing vision evidence');
  if (!hasReview) gaps.push('missing review text evidence');
  if (!hasCommunity) gaps.push('missing community evidence');
  if (signalScores.work_signal < 45 && signalScores.laptop_signal < 45 && signalScores.wifi_signal < 45) gaps.push('weak work/practical evidence');
  if (signalScores.seating_signal < 45) gaps.push('weak seating evidence');
  if (signalScores.quiet_signal < 45) gaps.push('weak quiet evidence');
  return gaps;
}

export function aggregateExperienceEvidence(bundle: ExperienceEvidenceBundle): VenueExperienceSignalScores {
  const weightedSums = emptySignalScores();
  const weights = emptySignalScores();
  const constraints = new Set<EvidenceConstraint>();

  for (const extraction of bundle.extractions) {
    const item = bundle.items.find((candidate) => candidate.id === extraction.evidence_item_id);
    if (!item) continue;
    const sourceWeight = SOURCE_WEIGHTS[item.source_type] ?? 0.6;
    const confidenceWeight = Math.max(0.1, extraction.confidence / 100);

    for (const signal of EXPERIENCE_SIGNALS) {
      const score = extraction.signals[signal] || 0;
      if (score <= 0) continue;
      const weight = sourceWeight * confidenceWeight * sourceBoost(signal, item.source_type);
      weightedSums[signal] += score * weight;
      weights[signal] += weight;
    }

    for (const constraint of extraction.constraints) constraints.add(constraint);
  }

  const signalScores = emptySignalScores();
  for (const signal of EXPERIENCE_SIGNALS) {
    signalScores[signal] = weights[signal] > 0 ? clampScore(weightedSums[signal] / weights[signal]) : 0;
  }

  for (const constraint of constraints) {
    const penalties = CONSTRAINT_PENALTIES[constraint] || {};
    for (const [signal, penalty] of Object.entries(penalties) as Array<[ExperienceEvidenceSignal, number]>) {
      signalScores[signal] = clampScore(signalScores[signal] - penalty);
    }
  }

  const itemStrength = Math.min(55, bundle.items.length * 5);
  const signalStrength = Math.min(35, Object.values(signalScores).filter((score) => score >= 45).length * 3);
  const sourceDiversity = Math.min(10, new Set(bundle.items.map((item) => item.source_type)).size * 2);
  const confidence = clampScore((itemStrength + signalStrength + sourceDiversity) * 0.9);

  return {
    candidate_id: bundle.candidate_id,
    venue_name: bundle.venue_name,
    evidence_strength_score: clampScore(itemStrength + signalStrength + sourceDiversity),
    signal_scores: signalScores,
    constraints: [...constraints],
    evidence_gaps: evidenceGaps(bundle, signalScores),
    confidence,
  };
}
