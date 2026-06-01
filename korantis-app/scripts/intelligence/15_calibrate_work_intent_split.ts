import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import type { VenueIntelligence } from './types';
import type { ExperienceEvidenceItem, ExperienceEvidenceSignal } from './experience_evidence/types';
import { extractTextSignals } from './experience_evidence/extract_text_signals';
import { aggregateExperienceEvidence } from './experience_evidence/aggregate_signals';
import { computeWorkIntentSplit } from './scoring/work_intent';

const TARGET_CAFES = ['Cuervo Cafe', 'LAB Tostadores de Cafe', 'Lattente', 'Cafe Crespin', 'Vive Cafe'];

type FixtureRecord = {
  venue_name: string;
  candidate_id: string;
  google_place_id: string;
  source: string;
  source_type: 'reddit' | 'blog' | 'editorial' | 'tripadvisor' | 'owner_site' | 'other';
  url: string;
  text: string;
  language: 'en' | 'es' | 'unknown';
  collected_at: string;
  notes: string;
  fixture_only: boolean;
};

type FinalPilotOutput = {
  outputs: Array<VenueIntelligence & { venue_name: string }>;
};

type CalibrationOutput = {
  candidate_id: string;
  venue_name: string;
  current_work_score: number;
  work_possible_score: number;
  work_recommended_score: number;
  work_risk_score: number;
  derived_work_score: number;
  work_label: string;
  supporting_positive_signals: Partial<Record<ExperienceEvidenceSignal, number>>;
  supporting_risk_signals: Partial<Record<ExperienceEvidenceSignal, number>>;
  constraints: string[];
  interpretation: string;
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function validateFixture(records: FixtureRecord[]): void {
  for (const record of records) {
    if (!TARGET_CAFES.includes(record.venue_name)) throw new Error(`Fixture contains out-of-scope venue: ${record.venue_name}`);
    if (record.fixture_only !== true) throw new Error(`Fixture record missing fixture_only=true: ${record.venue_name}`);
    if (record.notes !== 'SYNTHETIC CALIBRATION FIXTURE - DO NOT USE AS REAL VENUE EVIDENCE') {
      throw new Error(`Invalid fixture note for ${record.venue_name}`);
    }
  }
}

function sourceType(record: FixtureRecord): ExperienceEvidenceItem['source_type'] {
  if (record.source_type === 'reddit') return 'community';
  if (record.source_type === 'tripadvisor') return 'travel';
  if (record.source_type === 'blog') return 'blog';
  if (record.source_type === 'editorial' || record.source_type === 'owner_site') return 'editorial';
  return 'future_review_snapshot';
}

function toEvidenceItems(records: FixtureRecord[]): ExperienceEvidenceItem[] {
  return records.map((record, index) => ({
    id: `work_split_fixture_${record.candidate_id}_${index}`,
    candidate_id: record.candidate_id,
    venue_name: record.venue_name,
    source: record.source,
    source_type: sourceType(record),
    text: record.text,
    structured_data: {
      google_place_id: record.google_place_id,
      language: record.language,
      fixture_only: record.fixture_only,
      notes: record.notes,
    },
    url: record.url,
    confidence: 86,
    collected_at: record.collected_at,
  }));
}

function selectSignals(scores: Record<ExperienceEvidenceSignal, number>, signals: ExperienceEvidenceSignal[]): Partial<Record<ExperienceEvidenceSignal, number>> {
  return signals.reduce((result, signal) => {
    if ((scores[signal] || 0) >= 45) result[signal] = scores[signal];
    return result;
  }, {} as Partial<Record<ExperienceEvidenceSignal, number>>);
}

function interpretationFor(output: CalibrationOutput): string {
  if (output.work_label === 'recommended_for_work') {
    return 'Recommended for work: strong practical support and low risk.';
  }
  if (output.work_label === 'work_friendly_with_caveats') {
    return 'Work friendly with caveats: usable for work, but not enough infrastructure evidence for a strong recommendation.';
  }
  if (output.work_label === 'short_laptop_possible') {
    return 'Short laptop possible: work can happen briefly, but risk or quick-stop pressure limits recommendation.';
  }
  if (output.work_label === 'work_not_recommended' && output.work_risk_score >= 70) {
    return 'Work risk dominates; treat as quick stop or non-work venue.';
  }
  if (output.work_possible_score >= 65 && output.work_recommended_score >= 58 && output.work_risk_score < 45) {
    return 'Work recommended: strong practical support and manageable risk.';
  }
  if (output.work_possible_score >= 65 && output.work_risk_score >= 65) {
    return 'Work possible but risky: practical support exists, but crowding/noise/seating constraints cap recommendation.';
  }
  if (output.work_possible_score >= 45 && output.work_recommended_score >= 55 && output.work_risk_score < 45) {
    return 'Work recommended with caveats: practical support exists, but possible score is limited by missing wifi/outlet/long-stay evidence.';
  }
  if (output.work_possible_score >= 55 && output.work_recommended_score < 55) {
    return 'Work possible for short sessions, not recommended as a focused work cafe.';
  }
  if (output.work_risk_score >= 70) {
    return 'Work risk dominates; treat as quick stop or non-work venue.';
  }
  return 'Insufficient explicit work evidence for a strong work classification.';
}

function formulaDiagnostics(outputs: CalibrationOutput[]): string[] {
  const notes: string[] = [];
  const coffeeOnlyInflation = outputs.some((output) => (
    output.supporting_positive_signals.coffee_quality_signal &&
    !output.supporting_positive_signals.work_signal &&
    !output.supporting_positive_signals.laptop_signal &&
    output.work_possible_score > 55
  ));
  const riskCapsRecommended = outputs.some((output) => output.work_risk_score >= 65 && output.work_recommended_score < Math.max(45, output.work_possible_score - 15));
  const hasUsefulPossible = outputs.some((output) => output.work_possible_score > output.work_recommended_score + 10);
  const lattente = outputs.find((output) => output.venue_name === 'Lattente');
  const labelsUseful = new Set(outputs.map((output) => output.work_label)).size >= 3;

  notes.push(coffeeOnlyInflation ? 'Too generous: coffee-only evidence can still inflate work_possible.' : 'Coffee-only evidence remains isolated from work_possible.');
  notes.push(riskCapsRecommended ? 'Negative constraints properly cap work_recommended.' : 'Risk caps may be too weak or fixture coverage is insufficient.');
  notes.push(hasUsefulPossible ? 'work_possible is useful as a separate signal from work_recommended.' : 'work_possible may not be differentiated enough from work_recommended.');
  notes.push(lattente && lattente.work_recommended_score <= lattente.work_possible_score + 10 ? 'Lattente guardrail fixed: recommended no longer exceeds possible by more than 10.' : 'Lattente guardrail failed: recommended still exceeds possible too much.');
  notes.push(labelsUseful ? 'Work labels are useful: calibration produced multiple distinct outcomes.' : 'Work labels may be too coarse: calibration outcomes are not differentiated enough.');
  if (outputs.every((output) => output.work_recommended_score < 70)) notes.push('Recommended score may be too strict for real-world work cafes; review after real evidence import.');
  if (outputs.some((output) => output.work_risk_score > 80 && output.derived_work_score > 55)) notes.push('Derived work score may be too generous under high risk.');
  return notes;
}

function main() {
  const fixture = readJson<FixtureRecord[]>(path.join(process.cwd(), 'data', 'practical_evidence_calibration_fixture.json'));
  validateFixture(fixture);
  const finalPilot = readJson<FinalPilotOutput>(path.join(process.cwd(), 'data', 'venue_intelligence_final_pilot_output.json'));
  const finalByCandidate = new Map(finalPilot.outputs.map((output) => [output.candidate_id, output]));
  const items = toEvidenceItems(fixture);
  const itemsByCandidate = new Map<string, ExperienceEvidenceItem[]>();

  for (const item of items) {
    const current = itemsByCandidate.get(item.candidate_id) || [];
    current.push(item);
    itemsByCandidate.set(item.candidate_id, current);
  }

  const outputs: CalibrationOutput[] = [...itemsByCandidate.entries()].map(([candidateId, candidateItems]) => {
    const finalOutput = finalByCandidate.get(candidateId);
    if (!finalOutput) throw new Error(`Missing final pilot output for ${candidateId}`);
    const bundle = {
      candidate_id: candidateId,
      venue_name: finalOutput.venue_name,
      items: candidateItems,
      extractions: candidateItems.map(extractTextSignals),
    };
    const aggregate = aggregateExperienceEvidence(bundle);
    const split = computeWorkIntentSplit({
      signal_scores: aggregate.signal_scores,
      constraints: aggregate.constraints,
      baseline: {
        seating_confidence: finalOutput.photo_intelligence.seating_confidence,
        quiet_signal: finalOutput.experience_signals.quiet_signal,
        long_stay_signal: finalOutput.experience_signals.long_stay_signal,
        quick_stop_score: finalOutput.intent_scores.quick_stop_score,
        counter_only_risk: finalOutput.photo_intelligence.counter_only_risk,
      },
    });
    const resultWithoutInterpretation = {
      candidate_id: candidateId,
      venue_name: finalOutput.venue_name,
      current_work_score: finalOutput.intent_scores.work_score,
      work_possible_score: split.work_possible_score,
      work_recommended_score: split.work_recommended_score,
      work_risk_score: split.work_risk_score,
      derived_work_score: split.derived_work_score,
      work_label: split.work_label,
      supporting_positive_signals: selectSignals(aggregate.signal_scores, [
        'work_signal',
        'laptop_signal',
        'wifi_signal',
        'outlet_signal',
        'study_signal',
        'quiet_signal',
        'long_stay_signal',
        'seating_signal',
        'interior_signal',
        'coffee_quality_signal',
      ]),
      supporting_risk_signals: selectSignals(aggregate.signal_scores, [
        'crowded_signal',
        'loud_signal',
        'quick_stop_signal',
      ]),
      constraints: aggregate.constraints,
      interpretation: '',
    };
    return {
      ...resultWithoutInterpretation,
      interpretation: interpretationFor(resultWithoutInterpretation),
    };
  });

  const diagnostics = formulaDiagnostics(outputs);

  writeFileSync(path.join(process.cwd(), 'data', 'work_intent_split_calibration_output.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    fixtureRecordCount: fixture.length,
    targetCafeCount: outputs.length,
    outputs,
    formulaDiagnostics: diagnostics,
  }, null, 2));

  const report = [
    '# Work Intent Split Calibration Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '',
    '- Fixture-only calibration over 5 pilot cafes.',
    '- No production writes.',
    '- No UI, publishing, scraping, APIs, or LLMs.',
    '',
    '## Results',
    '',
    ...outputs.map((output) => [
      `### ${output.venue_name}`,
      '',
      `- Current work_score: ${output.current_work_score}`,
      `- work_possible_score: ${output.work_possible_score}`,
      `- work_recommended_score: ${output.work_recommended_score}`,
      `- work_risk_score: ${output.work_risk_score}`,
      `- derived work_score: ${output.derived_work_score}`,
      `- work_label: ${output.work_label}`,
      `- Supporting positive signals: ${Object.entries(output.supporting_positive_signals).map(([signal, score]) => `${signal} ${score}`).join(', ') || 'none'}`,
      `- Supporting risk signals: ${Object.entries(output.supporting_risk_signals).map(([signal, score]) => `${signal} ${score}`).join(', ') || 'none'}`,
      `- Constraints: ${output.constraints.join(', ') || 'none'}`,
      `- Interpretation: ${output.interpretation}`,
      '',
    ].join('\n')),
    '## Formula Diagnostics',
    '',
    ...diagnostics.map((diagnostic) => `- ${diagnostic}`),
    '',
    '## Calibration Assessment',
    '',
    '- The split separates technical possibility from recommendation quality.',
    '- work_risk_score exposes why a cafe can allow work but still be a weak recommendation.',
    '- Existing work_score can remain backward-compatible as derived_work_score during migration.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'work_intent_split_calibration_report.md'), report);
  console.log(report);
}

main();
