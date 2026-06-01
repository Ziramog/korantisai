import type { ExperienceEvidenceSignal } from './types';

export const EXPERIENCE_SIGNALS: ExperienceEvidenceSignal[] = [
  'work_signal',
  'laptop_signal',
  'wifi_signal',
  'outlet_signal',
  'study_signal',
  'quiet_signal',
  'reading_signal',
  'long_stay_signal',
  'quick_stop_signal',
  'seating_signal',
  'interior_signal',
  'crowded_signal',
  'loud_signal',
  'tourist_signal',
  'local_signal',
  'heritage_signal',
  'premium_signal',
  'romantic_signal',
  'date_signal',
  'group_signal',
  'solo_signal',
  'design_signal',
  'specialty_signal',
  'coffee_quality_signal',
  'wine_signal',
  'cocktail_signal',
  'dinner_signal',
  'service_signal',
  'price_complaint_signal',
  'reservation_signal',
];

export const POSITIVE_EXPERIENCE_SIGNALS = EXPERIENCE_SIGNALS.filter((signal) => ![
  'crowded_signal',
  'loud_signal',
  'price_complaint_signal',
].includes(signal));

export const NEGATIVE_EXPERIENCE_SIGNALS: ExperienceEvidenceSignal[] = [
  'crowded_signal',
  'loud_signal',
  'price_complaint_signal',
];

export function emptySignalScores(): Record<ExperienceEvidenceSignal, number> {
  return EXPERIENCE_SIGNALS.reduce((scores, signal) => {
    scores[signal] = 0;
    return scores;
  }, {} as Record<ExperienceEvidenceSignal, number>);
}
