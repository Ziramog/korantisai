import * as path from 'path';
import { writeFileSync } from 'fs';
import type { DiscoveryCategory, ScoredCandidateVenue } from '../discovery/types';
import { type BatchCandidate, readJson } from './controlled_batch_utils';

type CandidateFile = {
  candidates: ScoredCandidateVenue[];
};

const QUOTAS: Record<DiscoveryCategory, number> = {
  cafe: 10,
  restaurant: 10,
  wine_bar: 5,
  cocktail_bar: 5,
};

function isPalermo(district: string): boolean {
  return district.toLowerCase().includes('palermo');
}

function sortCandidate(a: ScoredCandidateVenue, b: ScoredCandidateVenue): number {
  return b.discovery_score - a.discovery_score ||
    b.consensus_score - a.consensus_score ||
    b.source_count - a.source_count ||
    a.venue_name.localeCompare(b.venue_name);
}

function selectCategory(candidates: ScoredCandidateVenue[], category: DiscoveryCategory, quota: number): BatchCandidate[] {
  const categoryCandidates = candidates
    .filter((candidate) => candidate.category === category)
    .sort(sortCandidate);
  const nonPalermoTarget = category === 'cafe' || category === 'restaurant' ? 3 : category === 'wine_bar' || category === 'cocktail_bar' ? 2 : 0;
  const selected: ScoredCandidateVenue[] = [];
  const nonPalermo = categoryCandidates.filter((candidate) => !isPalermo(candidate.district)).slice(0, nonPalermoTarget);
  selected.push(...nonPalermo);

  for (const candidate of categoryCandidates) {
    if (selected.length >= quota) break;
    if (selected.some((item) => item.candidate_id === candidate.candidate_id)) continue;
    selected.push(candidate);
  }

  return selected.slice(0, quota).map((candidate) => ({
    ...candidate,
    previously_processed: false,
    reason_selected: [
      candidate.status === 'pending_editorial_review' ? 'preferred high-confidence editorial-review candidate' : 'highest available discovery candidate',
      !isPalermo(candidate.district) ? 'supports district diversity' : 'selected by score after diversity pass',
      `ranked by discovery ${candidate.discovery_score}, consensus ${candidate.consensus_score}, sources ${candidate.source_count}`,
    ].join('; '),
  }));
}

function markdownTable(candidates: BatchCandidate[]): string {
  return [
    '| Venue | District | Category | Discovery | Consensus | Sources | Previously Processed | Reason |',
    '|---|---|---|---:|---:|---:|---|---|',
    ...candidates.map((candidate) => `| ${candidate.venue_name} | ${candidate.district} | ${candidate.category} | ${candidate.discovery_score} | ${candidate.consensus_score} | ${candidate.source_count} | ${candidate.previously_processed ? 'yes' : 'no'} | ${candidate.reason_selected} |`),
  ].join('\n');
}

function main() {
  const candidateFile = readJson<CandidateFile>(path.join(process.cwd(), 'data', 'discovery', 'candidate_venues.json'));
  const pilot = readJson<{ candidates: ScoredCandidateVenue[] }>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json'));
  const pilotIds = new Set(pilot.candidates.map((candidate) => candidate.candidate_id));
  const eligible = candidateFile.candidates
    .filter((candidate) => !pilotIds.has(candidate.candidate_id))
    .filter((candidate) => candidate.status === 'pending_editorial_review' || candidate.discovery_score >= 60);
  const selected = (Object.keys(QUOTAS) as DiscoveryCategory[])
    .flatMap((category) => selectCategory(eligible, category, QUOTAS[category]))
    .sort((a, b) => {
      const categoryOrder = ['cafe', 'restaurant', 'wine_bar', 'cocktail_bar'];
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || sortCandidate(a, b);
    });

  if (selected.length !== 30) throw new Error(`Expected 30 selected candidates, got ${selected.length}`);

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_candidates.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    quotas: QUOTAS,
    count: selected.length,
    candidates: selected,
  }, null, 2));

  const byCategory = selected.reduce((acc, candidate) => {
    acc[candidate.category] = (acc[candidate.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const report = [
    '# Controlled Batch 30 Candidates',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Total selected: ${selected.length}`,
    `- Category counts: ${Object.entries(byCategory).map(([category, count]) => `${category} ${count}`).join(', ')}`,
    `- Non-Palermo selected: ${selected.filter((candidate) => !isPalermo(candidate.district)).length}`,
    '',
    markdownTable(selected),
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_candidates.md'), report);
  console.log(report);
}

main();
