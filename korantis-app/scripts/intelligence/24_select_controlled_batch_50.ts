import * as path from 'path';
import { existsSync, writeFileSync } from 'fs';
import type { DiscoveryCategory, ScoredCandidateVenue } from '../discovery/types';
import { type BatchCandidate, readJson } from './controlled_batch_utils';

const QUOTAS: Record<DiscoveryCategory, number> = {
  cafe: 15,
  restaurant: 20,
  wine_bar: 7,
  cocktail_bar: 8,
};

const CATEGORY_ORDER: DiscoveryCategory[] = ['cafe', 'restaurant', 'wine_bar', 'cocktail_bar'];
const PRIORITY_DISTRICTS = [
  'Recoleta',
  'San Telmo',
  'Chacarita',
  'Colegiales',
  'Villa Crespo',
  'Retiro',
  'Microcentro',
  'Belgrano',
  'Las Canitas',
  'Las Cañitas',
  'Puerto Madero',
];

type CandidateFile = {
  candidates: ScoredCandidateVenue[];
};

function processedIds(): Set<string> {
  const files = [
    path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json'),
    path.join(process.cwd(), 'data', 'controlled_batch_30_candidates.json'),
  ];
  const ids = new Set<string>();
  for (const file of files) {
    if (!existsSync(file)) continue;
    const payload = readJson<{ candidates?: ScoredCandidateVenue[] }>(file);
    for (const candidate of payload.candidates || []) ids.add(candidate.candidate_id);
  }
  return ids;
}

function isPalermoSoho(candidate: ScoredCandidateVenue): boolean {
  return candidate.district.toLowerCase() === 'palermo soho';
}

function isPriorityDistrict(candidate: ScoredCandidateVenue): boolean {
  const normalized = candidate.district.toLowerCase();
  return PRIORITY_DISTRICTS.some((district) => normalized === district.toLowerCase());
}

function statusRank(candidate: ScoredCandidateVenue): number {
  if (candidate.status === 'approved_for_enrichment') return 0;
  if (candidate.status === 'pending_editorial_review') return 1;
  return 2;
}

function sortCandidate(a: ScoredCandidateVenue, b: ScoredCandidateVenue): number {
  return statusRank(a) - statusRank(b) ||
    b.discovery_score - a.discovery_score ||
    b.consensus_score - a.consensus_score ||
    b.source_count - a.source_count ||
    a.venue_name.localeCompare(b.venue_name);
}

function reasonSelected(candidate: ScoredCandidateVenue, previouslyProcessed: boolean): string {
  return [
    candidate.status === 'approved_for_enrichment' ? 'approved candidate' : candidate.status === 'pending_editorial_review' ? 'preferred pending editorial-review candidate' : 'needed to satisfy controlled quota',
    isPriorityDistrict(candidate) ? 'supports underrepresented district coverage' : isPalermoSoho(candidate) ? 'Palermo Soho allowed after diversity pass' : 'supports district diversity',
    previouslyProcessed ? 'previously processed comparison fallback' : 'not previously processed',
    `ranked by discovery ${candidate.discovery_score}, consensus ${candidate.consensus_score}, sources ${candidate.source_count}`,
  ].join('; ');
}

function selectCategory(candidates: ScoredCandidateVenue[], category: DiscoveryCategory, quota: number, processed: Set<string>): BatchCandidate[] {
  const pool = candidates
    .filter((candidate) => candidate.category === category)
    .sort(sortCandidate);
  const fresh = pool.filter((candidate) => !processed.has(candidate.candidate_id));
  const fallback = pool.filter((candidate) => processed.has(candidate.candidate_id));
  const selected: ScoredCandidateVenue[] = [];
  const districtCounts = new Map<string, number>();
  let palermoSohoCount = 0;

  const tryAdd = (candidate: ScoredCandidateVenue, maxPerDistrict: number, maxPalermoSoho: number): boolean => {
    if (selected.some((item) => item.candidate_id === candidate.candidate_id)) return false;
    const currentDistrict = districtCounts.get(candidate.district) || 0;
    if (currentDistrict >= maxPerDistrict) return false;
    if (isPalermoSoho(candidate) && palermoSohoCount >= maxPalermoSoho) return false;
    selected.push(candidate);
    districtCounts.set(candidate.district, currentDistrict + 1);
    if (isPalermoSoho(candidate)) palermoSohoCount += 1;
    return true;
  };

  for (const candidate of fresh.filter(isPriorityDistrict)) {
    if (selected.length >= quota) break;
    tryAdd(candidate, 2, category === 'restaurant' ? 5 : 3);
  }

  for (const candidate of fresh) {
    if (selected.length >= quota) break;
    tryAdd(candidate, 2, category === 'restaurant' ? 5 : 3);
  }

  for (const candidate of fresh) {
    if (selected.length >= quota) break;
    tryAdd(candidate, 4, category === 'restaurant' ? 8 : 5);
  }

  for (const candidate of fallback) {
    if (selected.length >= quota) break;
    tryAdd(candidate, 4, category === 'restaurant' ? 8 : 5);
  }

  if (selected.length !== quota) throw new Error(`Unable to select ${quota} ${category} candidates. Selected ${selected.length}.`);

  return selected.map((candidate) => ({
    ...candidate,
    previously_processed: processed.has(candidate.candidate_id),
    reason_selected: reasonSelected(candidate, processed.has(candidate.candidate_id)),
  }));
}

function countBy<T extends string>(items: BatchCandidate[], selector: (item: BatchCandidate) => T): Record<T, number> {
  return items.reduce((acc, item) => {
    const key = selector(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

function markdownTable(candidates: BatchCandidate[]): string {
  return [
    '| Venue | District | Category | Discovery | Consensus | Source Count | Sources | Previously Processed | Reason |',
    '|---|---|---|---:|---:|---:|---|---|---|',
    ...candidates.map((candidate) => `| ${candidate.venue_name} | ${candidate.district} | ${candidate.category} | ${candidate.discovery_score} | ${candidate.consensus_score} | ${candidate.source_count} | ${candidate.sources.join(', ')} | ${candidate.previously_processed ? 'yes' : 'no'} | ${candidate.reason_selected} |`),
  ].join('\n');
}

function main() {
  const candidateFile = readJson<CandidateFile>(path.join(process.cwd(), 'data', 'discovery', 'candidate_venues.json'));
  const processed = processedIds();
  const eligible = candidateFile.candidates.filter((candidate) => candidate.status !== 'rejected' && candidate.status !== 'merged');
  const selected = CATEGORY_ORDER.flatMap((category) => selectCategory(eligible, category, QUOTAS[category], processed))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || sortCandidate(a, b));

  if (selected.length !== 50) throw new Error(`Expected 50 selected candidates, got ${selected.length}`);

  const byCategory = countBy(selected, (candidate) => candidate.category);
  const byDistrict = countBy(selected, (candidate) => candidate.district);
  const previouslyProcessed = selected.filter((candidate) => candidate.previously_processed).length;

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_candidates.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    quotas: QUOTAS,
    count: selected.length,
    categorySummary: byCategory,
    districtSummary: byDistrict,
    previouslyProcessed,
    candidates: selected,
  }, null, 2));

  const report = [
    '# Controlled Batch 50 Candidates',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Total selected: ${selected.length}`,
    `- Category summary: ${Object.entries(byCategory).map(([category, count]) => `${category} ${count}`).join(', ')}`,
    `- Previously processed: ${previouslyProcessed}`,
    `- Palermo Soho selected: ${selected.filter(isPalermoSoho).length}`,
    '',
    '## District Diversity Summary',
    '',
    ...Object.entries(byDistrict).sort(([, a], [, b]) => b - a).map(([district, count]) => `- ${district}: ${count}`),
    '',
    '## Candidates',
    '',
    markdownTable(selected),
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_candidates.md'), report);
  console.log(report);
}

main();
