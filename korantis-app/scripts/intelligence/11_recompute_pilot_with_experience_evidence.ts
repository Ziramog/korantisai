import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import type { IntentScores, VenueCategory, VenueIntelligence } from './types';
import type { EvidenceConstraint, ExperienceEvidenceSignal, VenueExperienceSignalScores } from './experience_evidence/types';

type FinalPilotOutput = {
  outputs: Array<VenueIntelligence & { venue_name: string }>;
};

type ExperienceEvidenceFile = {
  aggregated: VenueExperienceSignalScores[];
};

type RecomputedVenue = VenueIntelligence & {
  venue_name: string;
  intent_scores_before: IntentScores;
  intent_scores_after: IntentScores;
  intent_score_deltas: IntentScores;
  evidence_signal_scores: Record<ExperienceEvidenceSignal, number>;
  evidence_constraints: EvidenceConstraint[];
  evidence_gaps: string[];
  evidence_change_reasons: string[];
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function weightedAverage(values: Array<[number, number]>): number {
  const totalWeight = values.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight === 0) return 0;
  return values.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
}

function penalty(constraints: EvidenceConstraint[], intent: keyof IntentScores, category: VenueCategory): number {
  let value = 0;
  if (constraints.includes('crowded')) value += ['work_score', 'reading_score', 'date_score', 'long_stay_score'].includes(intent) ? 8 : 2;
  if (constraints.includes('loud')) value += ['work_score', 'reading_score', 'date_score'].includes(intent) ? 10 : 2;
  if (constraints.includes('no_seating')) value += ['work_score', 'reading_score', 'long_stay_score'].includes(intent) ? 20 : 5;
  if (constraints.includes('takeaway_first')) value += ['work_score', 'long_stay_score'].includes(intent) ? 14 : 4;
  if (constraints.includes('expensive')) value += ['quick_stop_score'].includes(intent) ? 8 : 0;
  if (constraints.includes('tourist_heavy') && intent === 'hidden_gem_score') value += 18;
  if (category !== 'cafe' && ['work_score', 'reading_score', 'long_stay_score'].includes(intent)) value += 4;
  return value;
}

function hasSupport(scores: Record<ExperienceEvidenceSignal, number>, signals: ExperienceEvidenceSignal[]): boolean {
  return signals.some((signal) => scores[signal] >= 45);
}

function supportedScore(scores: Record<ExperienceEvidenceSignal, number>, values: Array<[ExperienceEvidenceSignal, number]>): number {
  return weightedAverage(values.map(([signal, weight]) => [scores[signal] || 0, weight]));
}

function improveOnly(before: number, evidenceCandidate: number, constraints: EvidenceConstraint[], intent: keyof IntentScores, category: VenueCategory): number {
  const constrained = evidenceCandidate - penalty(constraints, intent, category);
  return clampScore(Math.max(before, constrained));
}

function recomputeIntents(output: VenueIntelligence, evidence: VenueExperienceSignalScores): { scores: IntentScores; reasons: string[] } {
  const before = output.intent_scores;
  const signals = evidence.signal_scores;
  const constraints = evidence.constraints;
  const category = output.category;
  const after: IntentScores = { ...before };
  const reasons: string[] = [];

  const candidates: Partial<Record<keyof IntentScores, { score: number; support: ExperienceEvidenceSignal[]; reason: string }>> = {
    work_score: {
      score: supportedScore(signals, [
        ['work_signal', 0.22],
        ['laptop_signal', 0.18],
        ['wifi_signal', 0.12],
        ['outlet_signal', 0.10],
        ['quiet_signal', 0.14],
        ['seating_signal', 0.12],
        ['long_stay_signal', 0.12],
      ]),
      support: ['work_signal', 'laptop_signal', 'wifi_signal', 'outlet_signal', 'quiet_signal', 'seating_signal', 'long_stay_signal'],
      reason: 'work/practical evidence',
    },
    reading_score: {
      score: supportedScore(signals, [
        ['reading_signal', 0.28],
        ['quiet_signal', 0.24],
        ['seating_signal', 0.16],
        ['interior_signal', 0.14],
        ['long_stay_signal', 0.18],
      ]),
      support: ['reading_signal', 'quiet_signal', 'seating_signal', 'interior_signal', 'long_stay_signal'],
      reason: 'reading/quiet evidence',
    },
    long_stay_score: {
      score: supportedScore(signals, [
        ['long_stay_signal', 0.30],
        ['seating_signal', 0.24],
        ['interior_signal', 0.16],
        ['quiet_signal', 0.14],
        ['work_signal', 0.16],
      ]),
      support: ['long_stay_signal', 'seating_signal', 'interior_signal', 'quiet_signal', 'work_signal'],
      reason: 'long-stay evidence',
    },
    date_score: {
      score: supportedScore(signals, [
        ['date_signal', 0.24],
        ['romantic_signal', 0.24],
        ['wine_signal', 0.16],
        ['design_signal', 0.18],
        ['premium_signal', 0.18],
      ]),
      support: ['date_signal', 'romantic_signal', 'wine_signal', 'design_signal', 'premium_signal'],
      reason: 'date/romantic evidence',
    },
    dinner_score: {
      score: supportedScore(signals, [
        ['dinner_signal', 0.34],
        ['premium_signal', 0.20],
        ['service_signal', 0.12],
        ['reservation_signal', 0.12],
        ['design_signal', 0.12],
        ['local_signal', 0.10],
      ]),
      support: ['dinner_signal', 'premium_signal', 'service_signal', 'reservation_signal', 'design_signal', 'local_signal'],
      reason: 'dinner/service evidence',
    },
    wine_score: {
      score: supportedScore(signals, [
        ['wine_signal', 0.42],
        ['romantic_signal', 0.16],
        ['premium_signal', 0.14],
        ['design_signal', 0.14],
        ['local_signal', 0.14],
      ]),
      support: ['wine_signal', 'romantic_signal', 'premium_signal', 'design_signal', 'local_signal'],
      reason: 'wine evidence',
    },
    cocktail_score: {
      score: supportedScore(signals, [
        ['cocktail_signal', 0.44],
        ['premium_signal', 0.16],
        ['design_signal', 0.16],
        ['group_signal', 0.12],
        ['date_signal', 0.12],
      ]),
      support: ['cocktail_signal', 'premium_signal', 'design_signal', 'group_signal', 'date_signal'],
      reason: 'cocktail evidence',
    },
    classic_city_score: {
      score: supportedScore(signals, [
        ['heritage_signal', 0.34],
        ['tourist_signal', 0.18],
        ['local_signal', 0.20],
        ['premium_signal', 0.14],
        ['dinner_signal', 0.14],
      ]),
      support: ['heritage_signal', 'tourist_signal', 'local_signal', 'premium_signal', 'dinner_signal'],
      reason: 'classic/local heritage evidence',
    },
    hidden_gem_score: {
      score: supportedScore(signals, [
        ['local_signal', 0.30],
        ['specialty_signal', 0.24],
        ['coffee_quality_signal', 0.12],
        ['wine_signal', 0.12],
        ['design_signal', 0.12],
        ['solo_signal', 0.10],
      ]),
      support: ['local_signal', 'specialty_signal', 'coffee_quality_signal', 'wine_signal', 'design_signal', 'solo_signal'],
      reason: 'local/specialty evidence',
    },
    premium_destination_score: {
      score: supportedScore(signals, [
        ['premium_signal', 0.34],
        ['design_signal', 0.20],
        ['dinner_signal', 0.18],
        ['reservation_signal', 0.12],
        ['service_signal', 0.08],
        ['heritage_signal', 0.08],
      ]),
      support: ['premium_signal', 'design_signal', 'dinner_signal', 'reservation_signal', 'service_signal', 'heritage_signal'],
      reason: 'premium destination evidence',
    },
  };

  for (const [key, candidate] of Object.entries(candidates) as Array<[keyof IntentScores, NonNullable<typeof candidates[keyof IntentScores]>]>) {
    if (!hasSupport(signals, candidate.support)) continue;
    const beforeScore = before[key] ?? 0;
    const next = improveOnly(beforeScore, candidate.score, constraints, key, category);
    after[key] = next;
    if (next > beforeScore) reasons.push(`${key} improved by ${next - beforeScore} from ${candidate.reason}`);
  }

  if (constraints.includes('crowded') || constraints.includes('loud')) {
    after.work_score = clampScore(after.work_score - penalty(constraints, 'work_score', category));
    after.reading_score = clampScore(after.reading_score - penalty(constraints, 'reading_score', category));
    reasons.push('work/reading reduced by crowd or noise constraints');
  }

  return { scores: after, reasons };
}

function deltas(before: IntentScores, after: IntentScores): IntentScores {
  return Object.keys(before).reduce((result, key) => {
    const typedKey = key as keyof IntentScores;
    result[typedKey] = (after[typedKey] ?? 0) - (before[typedKey] ?? 0);
    return result;
  }, {} as IntentScores);
}

function topChanges(outputs: RecomputedVenue[]): string[] {
  return outputs.flatMap((output) => (
    Object.entries(output.intent_score_deltas)
      .filter(([, delta]) => delta !== 0)
      .map(([intent, delta]) => `- ${output.venue_name}: ${intent} ${delta > 0 ? '+' : ''}${delta}`)
  ));
}

function main() {
  const finalPilot = readJson<FinalPilotOutput>(path.join(process.cwd(), 'data', 'venue_intelligence_final_pilot_output.json'));
  const evidence = readJson<ExperienceEvidenceFile>(path.join(process.cwd(), 'data', 'venue_experience_evidence_pilot.json'));
  const evidenceByCandidate = new Map(evidence.aggregated.map((item) => [item.candidate_id, item]));

  const outputs: RecomputedVenue[] = finalPilot.outputs.map((output) => {
    const aggregate = evidenceByCandidate.get(output.candidate_id || '');
    if (!aggregate) throw new Error(`Missing experience evidence for ${output.venue_name}`);
    const recomputed = recomputeIntents(output, aggregate);
    const delta = deltas(output.intent_scores, recomputed.scores);
    return {
      ...output,
      intent_scores_before: output.intent_scores,
      intent_scores_after: recomputed.scores,
      intent_scores: recomputed.scores,
      intent_score_deltas: delta,
      evidence_signal_scores: aggregate.signal_scores,
      evidence_constraints: aggregate.constraints,
      evidence_gaps: aggregate.evidence_gaps,
      evidence_change_reasons: recomputed.reasons,
    };
  });

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_with_experience_evidence_output.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: outputs.length,
    outputs,
  }, null, 2));

  const underEvidenced = outputs.filter((output) => output.evidence_gaps.length > 0);
  const workCafes = outputs.filter((output) => output.category === 'cafe');
  const changes = topChanges(outputs);
  const readyFor50 = underEvidenced.filter((output) => output.evidence_gaps.includes('weak work/practical evidence')).length <= 6 && changes.length > 0;

  const report = [
    '# Venue Intelligence With Experience Evidence Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Before/After Intent Scores',
    '',
    ...outputs.map((output) => [
      `### ${output.venue_name}`,
      '',
      `- Work: ${output.intent_scores_before.work_score} -> ${output.intent_scores_after.work_score}`,
      `- Reading: ${output.intent_scores_before.reading_score} -> ${output.intent_scores_after.reading_score}`,
      `- Long stay: ${output.intent_scores_before.long_stay_score} -> ${output.intent_scores_after.long_stay_score}`,
      `- Date: ${output.intent_scores_before.date_score} -> ${output.intent_scores_after.date_score}`,
      `- Dinner: ${output.intent_scores_before.dinner_score} -> ${output.intent_scores_after.dinner_score}`,
      `- Wine: ${output.intent_scores_before.wine_score} -> ${output.intent_scores_after.wine_score}`,
      `- Cocktail: ${output.intent_scores_before.cocktail_score} -> ${output.intent_scores_after.cocktail_score}`,
      `- Classic city: ${output.intent_scores_before.classic_city_score} -> ${output.intent_scores_after.classic_city_score}`,
      `- Hidden gem: ${output.intent_scores_before.hidden_gem_score} -> ${output.intent_scores_after.hidden_gem_score}`,
      `- Premium destination: ${output.intent_scores_before.premium_destination_score} -> ${output.intent_scores_after.premium_destination_score}`,
      `- Why changed: ${output.evidence_change_reasons.join('; ') || 'no supported evidence-based changes'}`,
      '',
    ].join('\n')),
    '## Score Changes',
    '',
    ...(changes.length ? changes : ['- No intent scores changed.']),
    '',
    '## Work Cafe Evidence Gaps',
    '',
    ...workCafes.map((output) => `- ${output.venue_name}: work ${output.intent_scores_before.work_score} -> ${output.intent_scores_after.work_score}; gaps: ${output.evidence_gaps.join(', ') || 'none'}`),
    '',
    '## Venues Still Under-Evidenced',
    '',
    ...(underEvidenced.length ? underEvidenced.map((output) => `- ${output.venue_name}: ${output.evidence_gaps.join(', ')}`) : ['- None']),
    '',
    '## Recommended Next Evidence Sources',
    '',
    '- Add legal review snapshot ingestion only where source terms allow it.',
    '- Collect explicit work-practical snippets for cafes: laptop, wifi, outlets, seating, quiet, long stay.',
    '- Add venue-owned or editorial snippets for reservations, price constraints, dinner/date context.',
    '- Keep Google rating and userRatingCount as cultural relevance evidence, not atmosphere evidence.',
    '',
    '## Readiness Recommendation',
    '',
    readyFor50
      ? 'Recommendation: process 50 candidates cautiously, but keep evidence-gap reporting mandatory.'
      : 'Recommendation: improve evidence layer first before processing 50 candidates. The pilot still has meaningful practical-experience gaps, especially for work cafes.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_with_experience_evidence_report.md'), report);
  console.log(report);
}

main();
