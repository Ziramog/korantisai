import * as path from 'path';
import type { CandidateVenue, ScoredCandidateVenue } from './types';
import { DISCOVERY_DATA_DIR, readJsonFile, readSourceWeights, scoreCap, writeJsonFile } from './utils';

type NormalizedCandidatesFile = {
  candidates: CandidateVenue[];
};

function consensusFor(candidate: CandidateVenue, sourceWeights: Record<string, number>) {
  const uniqueSources = new Set(candidate.merged_sources.map((mention) => mention.source));
  const editorial_mentions = candidate.merged_sources.filter((mention) => mention.source_type === 'editorial').length;
  const community_mentions = candidate.merged_sources.filter((mention) => mention.source_type === 'community').length;
  const district_mentions = candidate.merged_sources.filter((mention) => mention.district === candidate.district).length;
  const authorityAverage = Array.from(uniqueSources).reduce((sum, source) => sum + (sourceWeights[source] || 50), 0) / Math.max(uniqueSources.size, 1);
  const independentSourceBonus = Math.max(0, uniqueSources.size - 1) * 18;
  const editorialBonus = Math.min(editorial_mentions * 8, 34);
  const communityBonus = Math.min(community_mentions * 8, 24);
  const districtBonus = Math.min(district_mentions * 5, 18);
  const authorityBonus = (authorityAverage - 50) * 0.35;

  return {
    source_count: uniqueSources.size,
    editorial_mentions,
    community_mentions,
    district_mentions,
    sources: Array.from(uniqueSources).sort(),
    consensus_score: scoreCap(10 + independentSourceBonus + editorialBonus + communityBonus + districtBonus + authorityBonus),
  };
}

async function main() {
  const normalized = readJsonFile<NormalizedCandidatesFile>(path.join(DISCOVERY_DATA_DIR, 'normalized_candidates.json'));
  const sourceWeights = readSourceWeights();
  const candidates: ScoredCandidateVenue[] = normalized.candidates.map((candidate) => ({
    ...candidate,
    ...consensusFor(candidate, sourceWeights),
    editorial_score: 0,
    community_score: 0,
    frequency_score: 0,
    district_relevance_score: 0,
    category_confidence_score: 0,
    discovery_score: 0,
    discovery_notes: '',
  }));

  writeJsonFile(path.join(DISCOVERY_DATA_DIR, 'consensus_candidates.json'), {
    generatedAt: new Date().toISOString(),
    candidates,
  });

  console.log(`Scored consensus for ${candidates.length} candidates.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
