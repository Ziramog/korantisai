import * as path from 'path';
import type { District, ScoredCandidateVenue } from './types';
import { DISCOVERY_DATA_DIR, readJsonFile, readSourceWeights, scoreCap, writeJsonFile, writeMarkdownFile } from './utils';

type ConsensusCandidatesFile = {
  candidates: ScoredCandidateVenue[];
};

type RawMentionsFile = {
  count: number;
  sourceBreakdown: Record<string, number>;
};

type NormalizedCandidatesFile = {
  duplicateMergeStatistics: {
    raw_mentions: number;
    normalized_candidates: number;
    merged_mentions: number;
    candidates_with_aliases: number;
  };
};

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function scoreCandidate(candidate: ScoredCandidateVenue, districts: District[], sourceWeights: Record<string, number>) {
  const district = districts.find((item) => item.city === candidate.city && item.district === candidate.district);
  const authorityAverage = candidate.sources.reduce((sum, source) => sum + (sourceWeights[source] || 50), 0) / Math.max(candidate.sources.length, 1);
  const editorial_score = scoreCap(Math.min(candidate.editorial_mentions, 4) * 22 + (authorityAverage - 50) * 0.30);
  const community_score = scoreCap(Math.min(candidate.community_mentions, 3) * 30 + (authorityAverage - 50) * 0.15);
  const frequency_score = scoreCap(Math.min(candidate.merged_sources.length, 5) * 20);
  const district_relevance_score = district ? scoreCap(district.priority) : 45;
  const category_confidence_score = scoreCap(
    candidate.merged_sources.filter((mention) => mention.category === candidate.category).length / candidate.merged_sources.length * 100
  );
  const discovery_score = scoreCap(
    editorial_score * 0.35 +
    community_score * 0.20 +
    frequency_score * 0.20 +
    district_relevance_score * 0.15 +
    category_confidence_score * 0.10
  );

  return {
    ...candidate,
    editorial_score,
    community_score,
    frequency_score,
    district_relevance_score,
    category_confidence_score,
    discovery_score,
    status: discovery_score >= 60 ? 'pending_editorial_review' as const : 'discovered' as const,
    discovery_notes: discovery_score >= 60
      ? 'High enough for human editorial review. Not approved for enrichment automatically.'
      : 'Discovered candidate with insufficient independent signal for review priority.',
  };
}

function breakdownBy(candidates: ScoredCandidateVenue[], field: 'district' | 'category') {
  return candidates.reduce<Record<string, number>>((acc, candidate) => {
    acc[candidate[field]] = (acc[candidate[field]] || 0) + 1;
    return acc;
  }, {});
}

function sourceContribution(candidates: ScoredCandidateVenue[]) {
  return candidates.reduce<Record<string, number>>((acc, candidate) => {
    for (const source of candidate.sources) {
      acc[source] = (acc[source] || 0) + 1;
    }
    return acc;
  }, {});
}

function markdownTable(candidates: ScoredCandidateVenue[]) {
  return [
    '| Rank | Venue | District | Category | Sources | Consensus | Discovery | Status |',
    '|---:|---|---|---|---:|---:|---:|---|',
    ...candidates.slice(0, 50).map((candidate, index) => (
      `| ${index + 1} | ${candidate.venue_name} | ${candidate.district} | ${candidate.category} | ${candidate.source_count} | ${candidate.consensus_score} | ${candidate.discovery_score} | ${candidate.status} |`
    )),
  ].join('\n');
}

async function main() {
  const raw = readJsonFile<RawMentionsFile>(path.join(DISCOVERY_DATA_DIR, 'raw_mentions.json'));
  const normalized = readJsonFile<NormalizedCandidatesFile>(path.join(DISCOVERY_DATA_DIR, 'normalized_candidates.json'));
  const consensus = readJsonFile<ConsensusCandidatesFile>(path.join(DISCOVERY_DATA_DIR, 'consensus_candidates.json'));
  const districts = readJsonFile<District[]>(path.join(DISCOVERY_DATA_DIR, 'buenos_aires_districts.json'));
  const sourceWeights = readSourceWeights();

  const candidates = consensus.candidates
    .map((candidate) => scoreCandidate(candidate, districts, sourceWeights))
    .sort((a, b) => b.discovery_score - a.discovery_score || b.consensus_score - a.consensus_score || a.venue_name.localeCompare(b.venue_name));

  writeJsonFile(path.join(DISCOVERY_DATA_DIR, 'candidate_venues.json'), {
    generatedAt: new Date().toISOString(),
    candidates,
  });

  const report = [
    '# Curated Discovery Phase D.0 Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total raw mentions: ${raw.count}`,
    `- Total normalized candidates: ${candidates.length}`,
    `- Candidates pending editorial review: ${candidates.filter((candidate) => candidate.status === 'pending_editorial_review').length}`,
    '- Approved for enrichment: 0',
    `- Average consensus score: ${average(candidates.map((candidate) => candidate.consensus_score)).toFixed(1)}`,
    `- Average discovery score: ${average(candidates.map((candidate) => candidate.discovery_score)).toFixed(1)}`,
    `- Duplicate mentions merged: ${normalized.duplicateMergeStatistics.merged_mentions}`,
    `- Candidates with aliases: ${normalized.duplicateMergeStatistics.candidates_with_aliases}`,
    '',
    '## District Breakdown',
    '',
    ...Object.entries(breakdownBy(candidates, 'district')).sort((a, b) => b[1] - a[1]).map(([district, count]) => `- ${district}: ${count}`),
    '',
    '## Category Breakdown',
    '',
    ...Object.entries(breakdownBy(candidates, 'category')).sort((a, b) => b[1] - a[1]).map(([category, count]) => `- ${category}: ${count}`),
    '',
    '## Source Contribution Breakdown',
    '',
    ...Object.entries(sourceContribution(candidates)).sort((a, b) => b[1] - a[1]).map(([source, count]) => `- ${source}: ${count}`),
    '',
    '## Raw Mention Source Breakdown',
    '',
    ...Object.entries(raw.sourceBreakdown).sort((a, b) => b[1] - a[1]).map(([source, count]) => `- ${source}: ${count}`),
    '',
    '## Top 50 Venues By Discovery Score',
    '',
    markdownTable(candidates),
    '',
    '## Duplicate Merge Statistics',
    '',
    `- Raw mentions: ${normalized.duplicateMergeStatistics.raw_mentions}`,
    `- Normalized candidates: ${normalized.duplicateMergeStatistics.normalized_candidates}`,
    `- Merged mentions: ${normalized.duplicateMergeStatistics.merged_mentions}`,
    `- Candidates with aliases: ${normalized.duplicateMergeStatistics.candidates_with_aliases}`,
    '',
    '## Guardrails',
    '',
    '- No candidates were auto-promoted to staging.',
    '- `pending_editorial_review` means the candidate deserves human review, not enrichment.',
    '- Google Places remains downstream enrichment only.',
    '- Existing ingestion scripts were not modified by the discovery pilot.',
  ].join('\n');

  writeMarkdownFile(path.join(process.cwd(), 'data', 'curated_discovery_phase_d0_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
