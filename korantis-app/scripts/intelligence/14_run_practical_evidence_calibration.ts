import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import type { IntentScores, VenueIntelligence } from './types';
import type { ExperienceEvidenceItem, ExperienceEvidenceSignal, VenueExperienceSignalScores } from './experience_evidence/types';
import { extractTextSignals } from './experience_evidence/extract_text_signals';
import { aggregateExperienceEvidence } from './experience_evidence/aggregate_signals';

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

type CalibrationVenueOutput = {
  candidate_id: string;
  venue_name: string;
  fixture_record_count: number;
  aggregate: VenueExperienceSignalScores;
  before: Pick<IntentScores, 'work_score' | 'reading_score' | 'long_stay_score' | 'quick_stop_score'> & {
    quiet_signal: number;
  };
  after: Pick<IntentScores, 'work_score' | 'reading_score' | 'long_stay_score' | 'quick_stop_score'> & {
    quiet_signal: number;
  };
  deltas: Pick<IntentScores, 'work_score' | 'reading_score' | 'long_stay_score' | 'quick_stop_score'> & {
    quiet_signal: number;
  };
  moved_signals: Partial<Record<ExperienceEvidenceSignal, number>>;
  constraints: string[];
  diagnostics: string[];
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

function validateFixture(records: FixtureRecord[]): void {
  for (const record of records) {
    if (!TARGET_CAFES.includes(record.venue_name)) throw new Error(`Fixture contains out-of-scope venue: ${record.venue_name}`);
    if (record.fixture_only !== true) throw new Error(`Fixture record missing fixture_only=true: ${record.venue_name}`);
    if (record.notes !== 'SYNTHETIC CALIBRATION FIXTURE - DO NOT USE AS REAL VENUE EVIDENCE') {
      throw new Error(`Fixture record has invalid notes: ${record.venue_name}`);
    }
  }
}

function sourceType(sourceType: FixtureRecord['source_type']): ExperienceEvidenceItem['source_type'] {
  if (sourceType === 'reddit') return 'community';
  if (sourceType === 'tripadvisor') return 'travel';
  if (sourceType === 'blog') return 'blog';
  if (sourceType === 'editorial' || sourceType === 'owner_site') return 'editorial';
  return 'future_review_snapshot';
}

function toEvidenceItems(records: FixtureRecord[]): ExperienceEvidenceItem[] {
  return records.map((record, index) => ({
    id: `fixture_${record.candidate_id}_${index}`,
    candidate_id: record.candidate_id,
    venue_name: record.venue_name,
    source: record.source,
    source_type: sourceType(record.source_type),
    text: record.text,
    structured_data: {
      google_place_id: record.google_place_id,
      language: record.language,
      notes: record.notes,
      fixture_only: record.fixture_only,
    },
    url: record.url,
    confidence: 86,
    collected_at: record.collected_at,
  }));
}

function practicalWorkCandidate(signals: Record<ExperienceEvidenceSignal, number>): number {
  const hasWorkEvidence = [
    signals.work_signal,
    signals.laptop_signal,
    signals.wifi_signal,
    signals.outlet_signal,
    signals.study_signal,
  ].some((score) => score >= 45);
  if (!hasWorkEvidence) return 0;
  return weightedAverage([
    [signals.work_signal, 0.24],
    [signals.laptop_signal, 0.18],
    [signals.wifi_signal, 0.14],
    [signals.outlet_signal, 0.12],
    [signals.study_signal, 0.10],
    [signals.quiet_signal, 0.08],
    [signals.seating_signal, 0.08],
    [signals.long_stay_signal, 0.06],
  ]);
}

function practicalReadingCandidate(signals: Record<ExperienceEvidenceSignal, number>): number {
  if (signals.reading_signal < 45 && signals.quiet_signal < 45 && signals.study_signal < 45) return 0;
  return weightedAverage([
    [signals.reading_signal, 0.28],
    [signals.quiet_signal, 0.26],
    [signals.study_signal, 0.18],
    [signals.seating_signal, 0.14],
    [signals.long_stay_signal, 0.14],
  ]);
}

function practicalLongStayCandidate(signals: Record<ExperienceEvidenceSignal, number>): number {
  if (signals.long_stay_signal < 45 && signals.work_signal < 45 && signals.seating_signal < 60) return 0;
  return weightedAverage([
    [signals.long_stay_signal, 0.32],
    [signals.seating_signal, 0.22],
    [signals.quiet_signal, 0.18],
    [signals.work_signal, 0.16],
    [signals.interior_signal, 0.12],
  ]);
}

function applyConstraints(score: number, signals: Record<ExperienceEvidenceSignal, number>, intent: 'work' | 'reading' | 'long_stay'): number {
  let next = score;
  if (signals.crowded_signal >= 65) next -= intent === 'work' ? 10 : 6;
  if (signals.loud_signal >= 65) next -= intent === 'reading' ? 12 : 8;
  if (signals.quick_stop_signal >= 70 && signals.seating_signal < 45) next -= intent === 'long_stay' ? 12 : 6;
  return clampScore(next);
}

function quickStopCandidate(signals: Record<ExperienceEvidenceSignal, number>, before: number): number {
  const candidate = weightedAverage([
    [signals.quick_stop_signal, 0.45],
    [signals.coffee_quality_signal, 0.16],
    [signals.crowded_signal, 0.16],
    [100 - signals.long_stay_signal, 0.23],
  ]);
  return clampScore(Math.max(before, candidate));
}

function movedSignals(aggregate: VenueExperienceSignalScores): Partial<Record<ExperienceEvidenceSignal, number>> {
  return Object.entries(aggregate.signal_scores)
    .filter(([, score]) => score >= 45)
    .sort(([, a], [, b]) => b - a)
    .reduce((result, [signal, score]) => {
      result[signal as ExperienceEvidenceSignal] = score;
      return result;
    }, {} as Partial<Record<ExperienceEvidenceSignal, number>>);
}

function calibrateVenue(output: VenueIntelligence & { venue_name: string }, aggregate: VenueExperienceSignalScores, fixtureRecordCount: number): CalibrationVenueOutput {
  const signals = aggregate.signal_scores;
  const workCandidate = applyConstraints(practicalWorkCandidate(signals), signals, 'work');
  const readingCandidate = applyConstraints(practicalReadingCandidate(signals), signals, 'reading');
  const longStayCandidate = applyConstraints(practicalLongStayCandidate(signals), signals, 'long_stay');
  const before = {
    work_score: output.intent_scores.work_score,
    reading_score: output.intent_scores.reading_score,
    long_stay_score: output.intent_scores.long_stay_score,
    quick_stop_score: output.intent_scores.quick_stop_score,
    quiet_signal: output.experience_signals.quiet_signal,
  };
  const after = {
    work_score: clampScore(Math.max(before.work_score, workCandidate)),
    reading_score: clampScore(Math.max(before.reading_score, readingCandidate)),
    long_stay_score: clampScore(Math.max(before.long_stay_score, longStayCandidate)),
    quick_stop_score: quickStopCandidate(signals, before.quick_stop_score),
    quiet_signal: clampScore(Math.max(before.quiet_signal, signals.quiet_signal)),
  };
  const diagnostics: string[] = [];

  if (signals.work_signal >= 45 || signals.laptop_signal >= 45 || signals.wifi_signal >= 45 || signals.outlet_signal >= 45) {
    diagnostics.push(after.work_score > before.work_score ? 'work_score reacted to explicit work evidence' : 'work evidence present but existing score already met/capped it');
  }
  if (signals.coffee_quality_signal >= 70 && signals.work_signal < 45 && signals.laptop_signal < 45) {
    diagnostics.push(after.work_score <= before.work_score + 5 ? 'coffee-only evidence did not inflate work_score' : 'coffee-only evidence inflated work_score too much');
  }
  if (signals.crowded_signal >= 65 || signals.loud_signal >= 65 || aggregate.constraints.includes('takeaway_first')) {
    diagnostics.push('negative practical constraints applied or capped scores');
  }
  if (signals.quick_stop_signal >= 65) diagnostics.push('quick_stop_score reacted to takeaway/counter evidence');

  return {
    candidate_id: output.candidate_id || '',
    venue_name: output.venue_name,
    fixture_record_count: fixtureRecordCount,
    aggregate,
    before,
    after,
    deltas: {
      work_score: after.work_score - before.work_score,
      reading_score: after.reading_score - before.reading_score,
      long_stay_score: after.long_stay_score - before.long_stay_score,
      quick_stop_score: after.quick_stop_score - before.quick_stop_score,
      quiet_signal: after.quiet_signal - before.quiet_signal,
    },
    moved_signals: movedSignals(aggregate),
    constraints: aggregate.constraints,
    diagnostics,
  };
}

function formulaDiagnostics(outputs: CalibrationVenueOutput[]): string[] {
  const notes: string[] = [];
  const positiveWork = outputs.filter((output) => output.moved_signals.work_signal || output.moved_signals.laptop_signal || output.moved_signals.wifi_signal || output.moved_signals.outlet_signal);
  const workMoved = positiveWork.filter((output) => output.deltas.work_score > 0);
  const coffeeOnly = outputs.filter((output) => output.moved_signals.coffee_quality_signal && !output.moved_signals.work_signal && !output.moved_signals.laptop_signal);
  const coffeeInflated = coffeeOnly.filter((output) => output.deltas.work_score > 5);

  notes.push(workMoved.length > 0 ? 'Work formula reacts to explicit work evidence.' : 'Work formula may be too weak: explicit work evidence did not move scores.');
  notes.push(coffeeInflated.length === 0 ? 'Coffee-quality-only evidence does not inflate work_score materially.' : 'Coffee-quality-only evidence is too aggressive for work_score.');
  notes.push(outputs.some((output) => output.constraints.length > 0) ? 'Negative constraints are detected and can cap practical scores.' : 'Negative constraint detection may need stronger fixture coverage.');
  if (outputs.some((output) => output.deltas.quick_stop_score > 10)) notes.push('Quick-stop formula is responsive to takeaway/counter evidence.');
  if (outputs.some((output) => output.deltas.long_stay_score > 20)) notes.push('Long-stay formula may be aggressive; review before production ingestion.');
  return notes;
}

function main() {
  const fixture = readJson<FixtureRecord[]>(path.join(process.cwd(), 'data', 'practical_evidence_calibration_fixture.json'));
  validateFixture(fixture);
  const finalPilot = readJson<FinalPilotOutput>(path.join(process.cwd(), 'data', 'venue_intelligence_final_pilot_output.json'));
  const finalByCandidate = new Map(finalPilot.outputs.map((output) => [output.candidate_id, output]));
  const items = toEvidenceItems(fixture);
  const byCandidate = new Map<string, ExperienceEvidenceItem[]>();

  for (const item of items) {
    const list = byCandidate.get(item.candidate_id) || [];
    list.push(item);
    byCandidate.set(item.candidate_id, list);
  }

  const outputs = [...byCandidate.entries()].map(([candidateId, candidateItems]) => {
    const finalOutput = finalByCandidate.get(candidateId);
    if (!finalOutput) throw new Error(`Fixture references unknown candidate_id: ${candidateId}`);
    const bundle = {
      candidate_id: candidateId,
      venue_name: finalOutput.venue_name,
      items: candidateItems,
      extractions: candidateItems.map(extractTextSignals),
    };
    const aggregate = aggregateExperienceEvidence(bundle);
    return calibrateVenue(finalOutput, aggregate, candidateItems.length);
  });

  const diagnostics = formulaDiagnostics(outputs);

  writeFileSync(path.join(process.cwd(), 'data', 'practical_evidence_calibration_output.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    fixtureRecordCount: fixture.length,
    targetCafeCount: outputs.length,
    outputs,
    formulaDiagnostics: diagnostics,
  }, null, 2));

  const report = [
    '# Practical Evidence Calibration Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '',
    '- Synthetic calibration fixture only.',
    '- No production evidence writes.',
    '- No database writes.',
    '- No scraping, APIs, LLMs, or UI changes.',
    '',
    '## Fixture Summary',
    '',
    `- Fixture records: ${fixture.length}`,
    `- Target cafes: ${outputs.length}`,
    '',
    '## Before/After Score Changes',
    '',
    ...outputs.map((output) => [
      `### ${output.venue_name}`,
      '',
      `- Work: ${output.before.work_score} -> ${output.after.work_score} (${output.deltas.work_score >= 0 ? '+' : ''}${output.deltas.work_score})`,
      `- Reading: ${output.before.reading_score} -> ${output.after.reading_score} (${output.deltas.reading_score >= 0 ? '+' : ''}${output.deltas.reading_score})`,
      `- Long stay: ${output.before.long_stay_score} -> ${output.after.long_stay_score} (${output.deltas.long_stay_score >= 0 ? '+' : ''}${output.deltas.long_stay_score})`,
      `- Quick stop: ${output.before.quick_stop_score} -> ${output.after.quick_stop_score} (${output.deltas.quick_stop_score >= 0 ? '+' : ''}${output.deltas.quick_stop_score})`,
      `- Quiet: ${output.before.quiet_signal} -> ${output.after.quiet_signal} (${output.deltas.quiet_signal >= 0 ? '+' : ''}${output.deltas.quiet_signal})`,
      `- Signals moved: ${Object.entries(output.moved_signals).map(([signal, score]) => `${signal} ${score}`).join(', ') || 'none'}`,
      `- Constraints: ${output.constraints.join(', ') || 'none'}`,
      `- Diagnostics: ${output.diagnostics.join('; ') || 'none'}`,
      '',
    ].join('\n')),
    '## Formula Diagnostics',
    '',
    ...diagnostics.map((diagnostic) => `- ${diagnostic}`),
    '',
    '## Recommended Formula Adjustments',
    '',
    '- Keep coffee_quality_signal separate from work_score unless laptop/wifi/outlet/work/study evidence is present.',
    '- Add stronger caps for crowded/loud/no_seating when evaluating work and long-stay intents.',
    '- Consider increasing work_score only when at least two practical signals are present, or one strong community practical signal plus seating/quiet support.',
    '- Treat quick_stop_score as the positive counterpart to takeaway/counter-only evidence rather than as a global rejection.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'practical_evidence_calibration_report.md'), report);
  console.log(report);
}

main();
