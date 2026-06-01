import type { EvidenceConstraint, ExperienceEvidenceSignal } from '../experience_evidence/types';

export type WorkIntentInput = {
  signal_scores: Record<ExperienceEvidenceSignal, number>;
  constraints: EvidenceConstraint[];
  baseline?: {
    seating_confidence?: number;
    quiet_signal?: number;
    long_stay_signal?: number;
    quick_stop_score?: number;
    counter_only_risk?: number;
  };
};

export type WorkIntentSplit = {
  work_possible_score: number;
  work_recommended_score: number;
  work_risk_score: number;
  derived_work_score: number;
  work_label: WorkIntentLabel;
};

export type WorkIntentLabel =
  | 'work_not_recommended'
  | 'short_laptop_possible'
  | 'work_friendly_with_caveats'
  | 'recommended_for_work';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function weightedAverage(values: Array<[number, number]>): number {
  const totalWeight = values.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight === 0) return 0;
  return values.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
}

function maxSignal(input: WorkIntentInput, signals: ExperienceEvidenceSignal[]): number {
  return Math.max(...signals.map((signal) => input.signal_scores[signal] || 0), 0);
}

function practicalSignalCount(input: WorkIntentInput): number {
  const baseline = input.baseline || {};
  const signals = input.signal_scores;
  const values = [
    signals.wifi_signal || 0,
    signals.outlet_signal || 0,
    signals.laptop_signal || 0,
    signals.work_signal || 0,
    signals.study_signal || 0,
    Math.max(signals.seating_signal || 0, baseline.seating_confidence || 0),
    Math.max(signals.long_stay_signal || 0, baseline.long_stay_signal || 0),
  ];
  return values.filter((score) => score >= 45).length;
}

export function computeWorkPossibleScore(input: WorkIntentInput): number {
  const signals = input.signal_scores;
  const baseline = input.baseline || {};
  const explicitPractical = maxSignal(input, ['laptop_signal', 'wifi_signal', 'outlet_signal', 'work_signal', 'study_signal']);
  if (explicitPractical < 45) return 0;

  return clampScore(weightedAverage([
    [signals.laptop_signal || 0, 0.20],
    [signals.wifi_signal || 0, 0.16],
    [signals.outlet_signal || 0, 0.14],
    [signals.work_signal || 0, 0.18],
    [signals.study_signal || 0, 0.12],
    [Math.max(signals.seating_signal || 0, baseline.seating_confidence || 0), 0.12],
    [signals.interior_signal || 0, 0.08],
  ]));
}

export function computeWorkRiskScore(input: WorkIntentInput): number {
  const signals = input.signal_scores;
  const constraints = input.constraints;
  const baseline = input.baseline || {};
  const constraintRisk = Math.max(
    constraints.includes('crowded') ? 76 : 0,
    constraints.includes('loud') ? 76 : 0,
    constraints.includes('takeaway_first') ? 72 : 0,
    constraints.includes('no_seating') ? 88 : 0
  );
  const weakSeatingRisk = Math.max(signals.seating_signal || 0, baseline.seating_confidence || 0) < 45 ? 62 : 0;
  const weakQuietRisk = Math.max(signals.quiet_signal || 0, baseline.quiet_signal || 0) < 45 ? 58 : 0;
  const counterRisk = baseline.counter_only_risk || 0;

  return clampScore(Math.max(
    constraintRisk,
    weightedAverage([
      [signals.crowded_signal || 0, 0.24],
      [signals.loud_signal || 0, 0.22],
      [signals.quick_stop_signal || 0, 0.16],
      [counterRisk, 0.14],
      [weakSeatingRisk, 0.14],
      [weakQuietRisk, 0.10],
    ])
  ));
}

export function computeWorkRecommendedScore(input: WorkIntentInput): number {
  const possible = computeWorkPossibleScore(input);
  if (possible < 45) return 0;
  if (possible < 50 && practicalSignalCount(input) < 2) return 0;

  const signals = input.signal_scores;
  const baseline = input.baseline || {};
  const risk = computeWorkRiskScore(input);
  const support = weightedAverage([
    [possible, 0.34],
    [Math.max(signals.quiet_signal || 0, baseline.quiet_signal || 0), 0.22],
    [Math.max(signals.long_stay_signal || 0, baseline.long_stay_signal || 0), 0.18],
    [Math.max(signals.seating_signal || 0, baseline.seating_confidence || 0), 0.18],
    [signals.interior_signal || 0, 0.08],
  ]);
  const riskPenalty = risk >= 75 ? 28 : risk >= 60 ? 18 : risk >= 45 ? 9 : 0;
  const rawRecommended = clampScore(support - riskPenalty);
  const possibleGuardrail = possible + 10;
  const riskCap = risk >= 70 ? 42 : risk >= 60 ? 55 : 100;

  return clampScore(Math.min(rawRecommended, possibleGuardrail, riskCap));
}

export function computeDerivedWorkScore(input: WorkIntentInput): number {
  const possible = computeWorkPossibleScore(input);
  const recommended = computeWorkRecommendedScore(input);
  const risk = computeWorkRiskScore(input);
  if (possible === 0) return 0;

  const derived = weightedAverage([
    [possible, 0.42],
    [recommended, 0.46],
    [100 - risk, 0.12],
  ]);
  const cap = risk >= 80 ? 40 : risk >= 70 ? 48 : risk >= 60 ? 62 : 100;

  return clampScore(Math.min(derived, cap));
}

export function computeWorkIntentLabel(input: WorkIntentInput): WorkIntentLabel {
  const possible = computeWorkPossibleScore(input);
  const recommended = computeWorkRecommendedScore(input);
  const risk = computeWorkRiskScore(input);
  const quickStop = input.baseline?.quick_stop_score || input.signal_scores.quick_stop_signal || 0;

  if (recommended >= 65 && risk < 35) return 'recommended_for_work';
  if (possible >= 45 && recommended >= 45 && risk < 60) return 'work_friendly_with_caveats';
  if ((possible >= 45 && risk >= 60) || (possible >= 45 && quickStop >= 60)) return 'short_laptop_possible';
  if (recommended < 40 || (risk >= 70 && recommended < 50)) return 'work_not_recommended';
  return 'work_not_recommended';
}

export function computeWorkIntentSplit(input: WorkIntentInput): WorkIntentSplit {
  return {
    work_possible_score: computeWorkPossibleScore(input),
    work_recommended_score: computeWorkRecommendedScore(input),
    work_risk_score: computeWorkRiskScore(input),
    derived_work_score: computeDerivedWorkScore(input),
    work_label: computeWorkIntentLabel(input),
  };
}
