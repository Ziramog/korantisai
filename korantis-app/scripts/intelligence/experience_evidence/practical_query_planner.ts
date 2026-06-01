import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import type { ScoredCandidateVenue } from '../../discovery/types';

type PilotCandidateFile = {
  candidates: ScoredCandidateVenue[];
};

type QueryPlanItem = {
  candidate_id: string;
  venue_name: string;
  category: string;
  district: string;
  priority: 'high' | 'medium';
  queries: string[];
  evidence_targets: string[];
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function queriesFor(candidate: ScoredCandidateVenue): string[] {
  const name = candidate.venue_name;
  if (candidate.category === 'cafe') {
    return [
      `${name} wifi Buenos Aires`,
      `${name} laptop Buenos Aires`,
      `${name} trabajar notebook`,
      `${name} enchufes`,
      `${name} tranquilo`,
      `${name} coworking cafe`,
      `${name} estudiar`,
      `${name} seating Buenos Aires`,
      `${name} crowded weekends`,
      `${name} para llevar`,
    ];
  }

  if (candidate.category === 'restaurant') {
    return [
      `${name} reservation`,
      `${name} reserva Buenos Aires`,
      `${name} expensive`,
      `${name} date night`,
      `${name} noise`,
      `${name} local favorite`,
      `${name} tasting menu`,
      `${name} dinner Buenos Aires`,
    ];
  }

  if (candidate.category === 'wine_bar') {
    return [
      `${name} intimate`,
      `${name} loud`,
      `${name} date`,
      `${name} reservation`,
      `${name} wine list`,
      `${name} carta de vinos`,
      `${name} sommelier`,
      `${name} bar de vinos Buenos Aires`,
    ];
  }

  return [
    `${name} intimate`,
    `${name} loud`,
    `${name} date`,
    `${name} reservation`,
    `${name} cocktails`,
    `${name} coctelería`,
    `${name} bartender`,
    `${name} crowded weekends`,
  ];
}

function targetsFor(category: string): string[] {
  if (category === 'cafe') return ['work', 'laptop', 'wifi', 'outlets', 'quiet', 'long_stay', 'seating', 'crowding'];
  if (category === 'restaurant') return ['reservation', 'price', 'date', 'noise', 'local', 'dinner'];
  if (category === 'wine_bar') return ['intimate', 'date', 'reservation', 'wine_list', 'noise'];
  return ['intimate', 'date', 'cocktails', 'reservation', 'noise', 'crowding'];
}

function main() {
  const candidates = readJson<PilotCandidateFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json')).candidates;
  const plans: QueryPlanItem[] = candidates.map((candidate) => ({
    candidate_id: candidate.candidate_id,
    venue_name: candidate.venue_name,
    category: candidate.category,
    district: candidate.district,
    priority: candidate.category === 'cafe' ? 'high' : 'medium',
    queries: queriesFor(candidate),
    evidence_targets: targetsFor(candidate.category),
  }));

  writeFileSync(path.join(process.cwd(), 'data', 'practical_evidence_query_plan.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: plans.length,
    plans,
  }, null, 2));

  const report = [
    '# Practical Evidence Query Plan',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '',
    '- Query planning only.',
    '- No scraping, no API calls, no browser automation.',
    '- Scope remains the 16 pilot venues.',
    '',
    ...plans.map((plan) => [
      `## ${plan.venue_name}`,
      '',
      `- Category: ${plan.category}`,
      `- Priority: ${plan.priority}`,
      `- Evidence targets: ${plan.evidence_targets.join(', ')}`,
      ...plan.queries.map((query) => `- ${query}`),
      '',
    ].join('\n')),
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'practical_evidence_query_plan.md'), report);
  console.log(report);
}

main();
