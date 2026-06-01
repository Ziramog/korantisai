# Work Intent Split Calibration Report

Generated: 2026-06-01T02:23:28.953Z

## Scope

- Fixture-only calibration over 5 pilot cafes.
- No production writes.
- No UI, publishing, scraping, APIs, or LLMs.

## Results

### Cuervo Cafe

- Current work_score: 57
- work_possible_score: 54
- work_recommended_score: 28
- work_risk_score: 76
- derived work_score: 38
- work_label: short_laptop_possible
- Supporting positive signals: laptop_signal 80, wifi_signal 72, outlet_signal 74, seating_signal 70, coffee_quality_signal 79
- Supporting risk signals: crowded_signal 76, loud_signal 72
- Constraints: crowded, loud
- Interpretation: Short laptop possible: work can happen briefly, but risk or quick-stop pressure limits recommendation.

### LAB Tostadores de Cafe

- Current work_score: 58
- work_possible_score: 67
- work_recommended_score: 60
- work_risk_score: 17
- derived work_score: 66
- work_label: work_friendly_with_caveats
- Supporting positive signals: work_signal 74, laptop_signal 76, wifi_signal 72, outlet_signal 74, study_signal 70, long_stay_signal 66, seating_signal 68, coffee_quality_signal 79
- Supporting risk signals: quick_stop_signal 62
- Constraints: none
- Interpretation: Work friendly with caveats: usable for work, but not enough infrastructure evidence for a strong recommendation.

### Lattente

- Current work_score: 60
- work_possible_score: 46
- work_recommended_score: 56
- work_risk_score: 3
- derived work_score: 57
- work_label: work_friendly_with_caveats
- Supporting positive signals: work_signal 75, laptop_signal 76, study_signal 70, quiet_signal 76, seating_signal 74, coffee_quality_signal 78
- Supporting risk signals: none
- Constraints: none
- Interpretation: Work friendly with caveats: usable for work, but not enough infrastructure evidence for a strong recommendation.

### Cafe Crespin

- Current work_score: 45
- work_possible_score: 33
- work_recommended_score: 0
- work_risk_score: 76
- derived work_score: 17
- work_label: work_not_recommended
- Supporting positive signals: work_signal 51, laptop_signal 76, long_stay_signal 66, seating_signal 70, coffee_quality_signal 78
- Supporting risk signals: crowded_signal 72, loud_signal 72
- Constraints: crowded, loud
- Interpretation: Work risk dominates; treat as quick stop or non-work venue.

### Vive Cafe

- Current work_score: 45
- work_possible_score: 25
- work_recommended_score: 0
- work_risk_score: 72
- derived work_score: 14
- work_label: work_not_recommended
- Supporting positive signals: outlet_signal 74, study_signal 74, quiet_signal 68, long_stay_signal 48, seating_signal 50, coffee_quality_signal 80
- Supporting risk signals: quick_stop_signal 65
- Constraints: takeaway_first
- Interpretation: Work risk dominates; treat as quick stop or non-work venue.

## Formula Diagnostics

- Coffee-only evidence remains isolated from work_possible.
- Negative constraints properly cap work_recommended.
- work_possible is useful as a separate signal from work_recommended.
- Lattente guardrail fixed: recommended no longer exceeds possible by more than 10.
- Work labels are useful: calibration produced multiple distinct outcomes.
- Recommended score may be too strict for real-world work cafes; review after real evidence import.

## Calibration Assessment

- The split separates technical possibility from recommendation quality.
- work_risk_score exposes why a cafe can allow work but still be a weak recommendation.
- Existing work_score can remain backward-compatible as derived_work_score during migration.