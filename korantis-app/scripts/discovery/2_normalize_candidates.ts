import * as path from 'path';
import type { CandidateVenue, DiscoveryCategory, SourceMention } from './types';
import { canonicalVenueName, DISCOVERY_DATA_DIR, readJsonFile, stableId, writeJsonFile } from './utils';

type RawMentionsFile = {
  mentions: SourceMention[];
};

function chooseCategory(mentions: SourceMention[]) {
  const counts = mentions.reduce<Record<DiscoveryCategory, number>>((acc, mention) => {
    acc[mention.category] = (acc[mention.category] || 0) + 1;
    return acc;
  }, {} as Record<DiscoveryCategory, number>);

  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || mentions[0].category) as DiscoveryCategory;
}

function chooseDistrict(mentions: SourceMention[]) {
  const counts = mentions.reduce<Record<string, number>>((acc, mention) => {
    acc[mention.district] = (acc[mention.district] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || mentions[0].district;
}

function chooseDisplayName(mentions: SourceMention[]) {
  return mentions
    .map((mention) => mention.venue_name)
    .sort((a, b) => a.length - b.length)[0];
}

async function main() {
  const raw = readJsonFile<RawMentionsFile>(path.join(DISCOVERY_DATA_DIR, 'raw_mentions.json'));
  const groups = new Map<string, SourceMention[]>();

  for (const mention of raw.mentions) {
    const key = `${mention.city}|${canonicalVenueName(mention.venue_name)}`;
    const existing = groups.get(key) || [];
    existing.push(mention);
    groups.set(key, existing);
  }

  const candidates: CandidateVenue[] = Array.from(groups.entries()).map(([key, mentions]) => {
    const [city, canonical_name] = key.split('|');
    const aliases = Array.from(new Set(mentions.map((mention) => mention.venue_name))).sort();

    return {
      candidate_id: stableId([city, canonical_name]),
      city,
      district: chooseDistrict(mentions),
      venue_name: chooseDisplayName(mentions),
      canonical_name,
      aliases,
      category: chooseCategory(mentions),
      merged_sources: mentions,
      status: 'discovered' as const,
    };
  }).sort((a, b) => b.merged_sources.length - a.merged_sources.length || a.venue_name.localeCompare(b.venue_name));

  const duplicateMergeStatistics = {
    raw_mentions: raw.mentions.length,
    normalized_candidates: candidates.length,
    merged_mentions: raw.mentions.length - candidates.length,
    candidates_with_aliases: candidates.filter((candidate) => candidate.aliases.length > 1).length,
  };

  writeJsonFile(path.join(DISCOVERY_DATA_DIR, 'normalized_candidates.json'), {
    generatedAt: new Date().toISOString(),
    duplicateMergeStatistics,
    candidates,
  });

  console.log(`Normalized ${raw.mentions.length} mentions into ${candidates.length} candidates.`);
  console.log(duplicateMergeStatistics);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
