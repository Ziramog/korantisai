import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import type { IntentScores, VenueIntelligence } from './types';
import type { ExperienceEvidenceSignal, VenueExperienceSignalScores } from './experience_evidence/types';

type FinalPilotOutput = {
  outputs: Array<VenueIntelligence & { venue_name: string }>;
};

type ExistingEvidenceOutput = {
  outputs: Array<VenueIntelligence & {
    venue_name: string;
    intent_scores_before: IntentScores;
    intent_scores_after: IntentScores;
    evidence_gaps: string[];
  }>;
};

type PracticalEvidenceFile = {
  importFilePresent: boolean;
  importedRecordCount: number;
  existingSourceSnippetCount: number;
  aggregated: VenueExperienceSignalScores[];
};

type PracticalRecomputeOutput = VenueIntelligence & {
  venue_name: string;
  intent_scores_before: IntentScores;
  intent_scores_after: IntentScores;
  practical_signal_scores: Record<ExperienceEvidenceSignal, number>;
  practical_evidence_gaps: string[];
  practical_change_reasons: string[];
  quiet_signal_before: number;
  quiet_signal_after: number;
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

function hasExplicitWorkEvidence(signals: Record<ExperienceEvidenceSignal, number>): boolean {
  return [
    signals.work_signal,
    signals.laptop_signal,
    signals.wifi_signal,
    signals.outlet_signal,
    signals.study_signal,
  ].some((score) => score >= 45);
}

function practicalWorkCandidate(signals: Record<ExperienceEvidenceSignal, number>): number {
  if (!hasExplicitWorkEvidence(signals)) return 0;
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

function applyPracticalConstraints(score: number, signals: Record<ExperienceEvidenceSignal, number>): number {
  let next = score;
  if (signals.crowded_signal >= 65) next -= 10;
  if (signals.loud_signal >= 65) next -= 12;
  if (signals.quick_stop_signal >= 70 && signals.seating_signal < 45) next -= 8;
  return clampScore(next);
}

function recompute(output: VenueIntelligence & { venue_name: string }, aggregate: VenueExperienceSignalScores): PracticalRecomputeOutput {
  const before = output.intent_scores;
  const after: IntentScores = { ...before };
  const reasons: string[] = [];
  const signals = aggregate.signal_scores;
  const workCandidate = applyPracticalConstraints(practicalWorkCandidate(signals), signals);
  const readingCandidate = applyPracticalConstraints(practicalReadingCandidate(signals), signals);
  const longStayCandidate = applyPracticalConstraints(practicalLongStayCandidate(signals), signals);
  const quietAfter = clampScore(Math.max(output.experience_signals.quiet_signal, signals.quiet_signal));

  if (workCandidate > before.work_score) {
    after.work_score = workCandidate;
    reasons.push(`work_score improved by explicit practical evidence: ${workCandidate - before.work_score}`);
  }
  if (readingCandidate > before.reading_score) {
    after.reading_score = readingCandidate;
    reasons.push(`reading_score improved by explicit reading/quiet/study evidence: ${readingCandidate - before.reading_score}`);
  }
  if (longStayCandidate > before.long_stay_score) {
    after.long_stay_score = longStayCandidate;
    reasons.push(`long_stay_score improved by explicit long-stay/seating evidence: ${longStayCandidate - before.long_stay_score}`);
  }
  if (quietAfter > output.experience_signals.quiet_signal) {
    reasons.push(`quiet signal evidence increased from ${output.experience_signals.quiet_signal} to ${quietAfter}`);
  }

  return {
    ...output,
    intent_scores_before: before,
    intent_scores_after: after,
    intent_scores: after,
    practical_signal_scores: signals,
    practical_evidence_gaps: aggregate.evidence_gaps,
    practical_change_reasons: reasons,
    quiet_signal_before: output.experience_signals.quiet_signal,
    quiet_signal_after: quietAfter,
  };
}

function main() {
  const finalPilot = readJson<FinalPilotOutput>(path.join(process.cwd(), 'data', 'venue_intelligence_final_pilot_output.json'));
  const existingEvidence = readJson<ExistingEvidenceOutput>(path.join(process.cwd(), 'data', 'venue_intelligence_with_experience_evidence_output.json'));
  const practical = readJson<PracticalEvidenceFile>(path.join(process.cwd(), 'data', 'practical_evidence_ingested.json'));
  const practicalByCandidate = new Map(practical.aggregated.map((item) => [item.candidate_id, item]));
  const existingByCandidate = new Map(existingEvidence.outputs.map((item) => [item.candidate_id, item]));

  const outputs = finalPilot.outputs.map((output) => {
    const aggregate = practicalByCandidate.get(output.candidate_id || '');
    if (!aggregate) throw new Error(`Missing practical evidence for ${output.venue_name}`);
    const existing = existingByCandidate.get(output.candidate_id || '');
    const baseline = existing ? { ...output, intent_scores: existing.intent_scores_after } : output;
    return recompute(baseline, aggregate);
  });

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_with_practical_evidence_output.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    importedRecordCount: practical.importedRecordCount,
    existingSourceSnippetCount: practical.existingSourceSnippetCount,
    count: outputs.length,
    outputs,
  }, null, 2));

  const workCafes = outputs.filter((output) => output.category === 'cafe');
  const changed = outputs.filter((output) => output.practical_change_reasons.length > 0);
  const underEvidenced = outputs.filter((output) => output.practical_evidence_gaps.length > 0);
  const explicitWorkBlocked = workCafes.filter((output) => output.practical_evidence_gaps.includes('weak work/practical evidence'));
  const recommendation = practical.importedRecordCount === 0 || explicitWorkBlocked.length > 0
    ? 'B) Expand practical evidence sources first'
    : 'A) Process 50 candidates';

  const report = [
    '# Venue Intelligence With Practical Evidence Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Manual import file present: ${practical.importFilePresent ? 'yes' : 'no'}`,
    `- Imported practical records: ${practical.importedRecordCount}`,
    `- Existing source snippets processed: ${practical.existingSourceSnippetCount}`,
    `- Venues with practical-score changes: ${changed.length}`,
    '',
    '## Work / Reading / Long-Stay / Quiet Changes',
    '',
    ...outputs.map((output) => [
      `### ${output.venue_name}`,
      '',
      `- Work: ${output.intent_scores_before.work_score} -> ${output.intent_scores_after.work_score}`,
      `- Reading: ${output.intent_scores_before.reading_score} -> ${output.intent_scores_after.reading_score}`,
      `- Long stay: ${output.intent_scores_before.long_stay_score} -> ${output.intent_scores_after.long_stay_score}`,
      `- Quiet signal: ${output.quiet_signal_before} -> ${output.quiet_signal_after}`,
      `- Supporting evidence: ${output.practical_change_reasons.join('; ') || 'no explicit practical evidence changed scores'}`,
      '',
    ].join('\n')),
    '## Work Cafe Blockers',
    '',
    ...workCafes.map((output) => `- ${output.venue_name}: work ${output.intent_scores_before.work_score} -> ${output.intent_scores_after.work_score}; gaps ${output.practical_evidence_gaps.join(', ') || 'none'}`),
    '',
    '## Venues Still Under-Evidenced',
    '',
    ...(underEvidenced.length ? underEvidenced.map((output) => `- ${output.venue_name}: ${output.practical_evidence_gaps.join(', ')}`) : ['- None']),
    '',
    '## Scaling Readiness Decision',
    '',
    recommendation,
    '',
    recommendation === 'B) Expand practical evidence sources first'
      ? 'Reason: the pilot still lacks explicit imported practical evidence for laptop, wifi, outlets, quiet, long stay, and crowding. Existing discovery snippets are useful but not enough to prove work-cafe fit.'
      : 'Reason: practical evidence is sufficient across work cafes and no major evidence gaps remain.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_with_practical_evidence_report.md'), report);
  console.log(report);
}

main();
