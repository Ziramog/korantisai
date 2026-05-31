# Discovery Phase D.6 Recommendations

Generated: 2026-05-31T17:35:51.745Z

## 1. Is the candidate universe good enough?

Not yet. It is directionally useful, but only 10 of 112 candidates are editorially approved by heuristic audit, and only 7 candidates clear the current discovery review threshold.

## 2. Which districts are strongest?

- Palermo Soho: 38 candidates, avg discovery 43.7
- San Telmo: 12 candidates, avg discovery 41.5
- Recoleta: 10 candidates, avg discovery 36.7
- Palermo Hollywood: 9 candidates, avg discovery 44.9
- Villa Crespo: 9 candidates, avg discovery 38.0

## 3. Which categories are strongest?

- restaurant: 44 candidates
- cafe: 41 candidates
- cocktail_bar: 16 candidates
- wine_bar: 11 candidates

## 4. Which source adapters are valuable?

- Reddit (44 candidates, avg 43.7)
- Time Out (32 candidates, avg 49.3)
- Wanderlog (38 candidates, avg 46.6)
- Bars for Kings (4 candidates, avg 54.8)
- Specialty Coffee Blog (3 candidates, avg 62.3)
- Local Wine Guide (1 candidates, avg 59.0)
- Marriott Bonvoy Traveler (2 candidates, avg 54.5)
- View Buenos Aires (4 candidates, avg 53.0)

## 5. Which source adapters should be improved?

- Local Restaurant Guide (9 candidates, avg 36.8)
- Local Guide (11 candidates, avg 36.5)
- Visit BUE (1 candidates, avg 36.0)
- Rough Guides (2 candidates, avg 35.5)

## 6. Should Google enrichment begin?

No. Google enrichment should wait until a larger manually reviewed set is approved_for_enrichment. The current universe validates the architecture, but not enough candidates have strong independent signal.

## 7. What should be filtered before enrichment?

- Single-source candidates with discovery_score below 36 unless a human explicitly approves them.
- Chain or generic venues such as Pani, La Panera Rosa, and On Tap.
- Tourist-heavy landmark venues unless Korantis wants a heritage-specific collection.
- Candidates with unclear atmosphere potential or generic guide-list inclusion.
- Overrepresented Palermo Soho candidates should be capped during the next collection pass.

## District Coverage Diagnosis

- Overrepresented districts: Palermo Soho (38)
- Underrepresented districts: Retiro (4), Colegiales (4), Palermo Chico (1)
- Missing target districts: Puerto Madero, Las Canitas

## Final Decision

C) Expand Source Coverage First