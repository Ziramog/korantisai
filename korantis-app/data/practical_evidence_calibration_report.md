# Practical Evidence Calibration Report

Generated: 2026-06-01T02:00:10.421Z

## Scope

- Synthetic calibration fixture only.
- No production evidence writes.
- No database writes.
- No scraping, APIs, LLMs, or UI changes.

## Fixture Summary

- Fixture records: 20
- Target cafes: 5

## Before/After Score Changes

### Cuervo Cafe

- Work: 57 -> 57 (+0)
- Reading: 62 -> 62 (+0)
- Long stay: 53 -> 53 (+0)
- Quick stop: 45 -> 48 (+3)
- Quiet: 58 -> 58 (+0)
- Signals moved: laptop_signal 80, coffee_quality_signal 79, crowded_signal 76, outlet_signal 74, wifi_signal 72, loud_signal 72, specialty_signal 72, seating_signal 70
- Constraints: crowded, loud
- Diagnostics: work evidence present but existing score already met/capped it; negative practical constraints applied or capped scores

### LAB Tostadores de Cafe

- Work: 58 -> 67 (+9)
- Reading: 69 -> 69 (+0)
- Long stay: 54 -> 54 (+0)
- Quick stop: 47 -> 48 (+1)
- Quiet: 58 -> 58 (+0)
- Signals moved: coffee_quality_signal 79, laptop_signal 76, work_signal 74, outlet_signal 74, wifi_signal 72, specialty_signal 72, study_signal 70, seating_signal 68, long_stay_signal 66, quick_stop_signal 62, service_signal 58
- Constraints: none
- Diagnostics: work_score reacted to explicit work evidence

### Lattente

- Work: 60 -> 60 (+0)
- Reading: 68 -> 68 (+0)
- Long stay: 56 -> 56 (+0)
- Quick stop: 41 -> 41 (+0)
- Quiet: 58 -> 76 (+18)
- Signals moved: coffee_quality_signal 78, laptop_signal 76, quiet_signal 76, work_signal 75, seating_signal 74, specialty_signal 72, study_signal 70, reading_signal 68, solo_signal 58
- Constraints: none
- Diagnostics: work evidence present but existing score already met/capped it

### Cafe Crespin

- Work: 45 -> 45 (+0)
- Reading: 54 -> 54 (+0)
- Long stay: 37 -> 37 (+0)
- Quick stop: 40 -> 40 (+0)
- Quiet: 58 -> 58 (+0)
- Signals moved: coffee_quality_signal 78, laptop_signal 76, crowded_signal 72, loud_signal 72, seating_signal 70, local_signal 68, long_stay_signal 66, service_signal 58, work_signal 51
- Constraints: crowded, loud
- Diagnostics: work evidence present but existing score already met/capped it; negative practical constraints applied or capped scores

### Vive Cafe

- Work: 45 -> 45 (+0)
- Reading: 54 -> 54 (+0)
- Long stay: 37 -> 39 (+2)
- Quick stop: 40 -> 54 (+14)
- Quiet: 58 -> 68 (+10)
- Signals moved: coffee_quality_signal 80, outlet_signal 74, study_signal 74, specialty_signal 72, quiet_signal 68, quick_stop_signal 65, seating_signal 50, long_stay_signal 48
- Constraints: takeaway_first
- Diagnostics: work evidence present but existing score already met/capped it; coffee-only evidence did not inflate work_score; negative practical constraints applied or capped scores; quick_stop_score reacted to takeaway/counter evidence

## Formula Diagnostics

- Work formula reacts to explicit work evidence.
- Coffee-quality-only evidence does not inflate work_score materially.
- Negative constraints are detected and can cap practical scores.
- Quick-stop formula is responsive to takeaway/counter evidence.

## Recommended Formula Adjustments

- Keep coffee_quality_signal separate from work_score unless laptop/wifi/outlet/work/study evidence is present.
- Add stronger caps for crowded/loud/no_seating when evaluating work and long-stay intents.
- Consider increasing work_score only when at least two practical signals are present, or one strong community practical signal plus seating/quiet support.
- Treat quick_stop_score as the positive counterpart to takeaway/counter-only evidence rather than as a global rejection.