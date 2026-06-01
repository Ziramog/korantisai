import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import type { DiscoveryCategory, ScoredCandidateVenue } from '../discovery/types';

type CandidateFile = {
  candidates: ScoredCandidateVenue[];
};

const QUOTAS: Record<DiscoveryCategory, number> = {
  cafe: 5,
  restaurant: 5,
  wine_bar: 3,
  cocktail_bar: 3,
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function sortCandidates(a: ScoredCandidateVenue, b: ScoredCandidateVenue) {
  return b.discovery_score - a.discovery_score || b.consensus_score - a.consensus_score || b.source_count - a.source_count || a.venue_name.localeCompare(b.venue_name);
}

function markdownTable(candidates: ScoredCandidateVenue[]) {
  return [
    '| Venue | District | Category | Discovery | Consensus | Sources | Source List |',
    '|---|---|---|---:|---:|---:|---|',
    ...candidates.map((candidate) => (
      `| ${candidate.venue_name} | ${candidate.district} | ${candidate.category} | ${candidate.discovery_score} | ${candidate.consensus_score} | ${candidate.source_count} | ${candidate.sources.join(', ')} |`
    )),
  ].join('\n');
}

async function main() {
  const file = readJson<CandidateFile>(path.join(process.cwd(), 'data', 'discovery', 'candidate_venues.json'));
  const approved = file.candidates.filter((candidate) => candidate.discovery_score >= 60 && candidate.consensus_score >= 80 && candidate.source_count >= 3);
  const selected = (Object.keys(QUOTAS) as DiscoveryCategory[]).flatMap((category) => (
    approved
      .filter((candidate) => candidate.category === category)
      .sort(sortCandidates)
      .slice(0, QUOTAS[category])
  )).sort(sortCandidates);

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    quotas: QUOTAS,
    count: selected.length,
    candidates: selected,
  }, null, 2));

  const report = [
    '# Venue Intelligence Pilot Candidates',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Selected candidates: ${selected.length}`,
    '',
    markdownTable(selected),
    '',
    '## Guardrails',
    '',
    '- Selection reads discovery artifacts only.',
    '- No candidate was promoted.',
    '- No Google enrichment was run.',
    '- No public venue was published.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
