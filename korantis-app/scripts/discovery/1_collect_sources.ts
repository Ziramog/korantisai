import * as path from 'path';
import type { SourceMention } from './types';
import { collect50BestDiscoveryMentions } from './sources/50best_discovery';
import { collectBlogMentions } from './sources/blogs';
import { collectCultureTripMentions } from './sources/culturetrip';
import { collectInstagramMentions } from './sources/instagram';
import { collectMichelinMentions } from './sources/michelin';
import { collectRedditMentions } from './sources/reddit';
import { collectSecretBuenosAiresMentions } from './sources/secret_buenos_aires';
import { collectTimeOutMentions } from './sources/timeout';
import { collectTripadvisorMentions } from './sources/tripadvisor';
import { collectVisitBuenosAiresMentions } from './sources/visit_buenos_aires';
import { collectWanderlogMentions } from './sources/wanderlog';
import { collectWorldsBestBarsMentions } from './sources/worlds_best_bars';
import { collectYouTubeMentions } from './sources/youtube';
import { DISCOVERY_DATA_DIR, ensureDiscoveryDataDir, writeJsonFile } from './utils';

function validateMention(mention: SourceMention) {
  const required = [
    mention.venue_name,
    mention.city,
    mention.district,
    mention.category,
    mention.source,
    mention.source_type,
    mention.source_url,
  ];

  return required.every((value) => typeof value === 'string' && value.trim().length > 0);
}

async function main() {
  ensureDiscoveryDataDir();

  const mentions = [
    ...collectTimeOutMentions(),
    ...collectWanderlogMentions(),
    ...collectRedditMentions(),
    ...collectBlogMentions(),
    ...collectTripadvisorMentions(),
    ...collectCultureTripMentions(),
    ...collectSecretBuenosAiresMentions(),
    ...collectVisitBuenosAiresMentions(),
    ...collectMichelinMentions(),
    ...collectWorldsBestBarsMentions(),
    ...collect50BestDiscoveryMentions(),
    ...collectInstagramMentions(),
    ...collectYouTubeMentions(),
  ].filter(validateMention);

  const sourceBreakdown = mentions.reduce<Record<string, number>>((acc, mention) => {
    acc[mention.source] = (acc[mention.source] || 0) + 1;
    return acc;
  }, {});

  writeJsonFile(path.join(DISCOVERY_DATA_DIR, 'raw_mentions.json'), {
    generatedAt: new Date().toISOString(),
    count: mentions.length,
    sourceBreakdown,
    mentions,
  });

  console.log(`Collected ${mentions.length} source mentions.`);
  console.log(sourceBreakdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
