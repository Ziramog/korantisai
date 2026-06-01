import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import type { SourceEvidence, SourceType } from '../types';
import { clampScore } from './utils';

export type SourceAuthorityInput = {
  sources: Array<Pick<SourceEvidence, 'source' | 'source_weight'> | string>;
  sourceWeights?: Record<string, number>;
};

function loadConfiguredWeights() {
  const file = path.join(process.cwd(), 'data', 'discovery', 'source_weights.json');
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, number>;
}

export function classifySourceType(sourceName: string): SourceType {
  const source = sourceName.toLowerCase();
  if (source.includes('michelin') || source.includes('50 best') || source.includes("world's best")) return 'premium_editorial';
  if (source.includes('specialty') || source.includes('coffee')) return 'specialist';
  if (source.includes('reddit')) return 'community';
  if (source.includes('tripadvisor') || source.includes('wanderlog')) return 'travel';
  if (source.includes('visit buenos') || source.includes('visit bue') || source.includes('turismo')) return 'tourism';
  if (source.includes('time out') || source.includes('culture trip') || source.includes('secret buenos') || source.includes('local')) return 'local_editorial';
  return 'generic';
}

export function sourceAuthorityScore(input: SourceAuthorityInput): number {
  const configuredWeights = input.sourceWeights || loadConfiguredWeights();
  if (input.sources.length === 0) return 0;

  const scores = input.sources.map((source) => {
    const sourceName = typeof source === 'string' ? source : source.source;
    const explicitWeight = typeof source === 'string' ? undefined : source.source_weight;
    if (typeof explicitWeight === 'number') return explicitWeight;
    if (typeof configuredWeights[sourceName] === 'number') return configuredWeights[sourceName];

    const sourceType = classifySourceType(sourceName);
    if (sourceType === 'premium_editorial') return 92;
    if (sourceType === 'specialist') return 84;
    if (sourceType === 'local_editorial') return 78;
    if (sourceType === 'community') return 70;
    if (sourceType === 'travel') return 62;
    if (sourceType === 'tourism') return 58;
    return 48;
  });

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const diversityBonus = Math.min(Math.max(input.sources.length - 1, 0) * 4, 16);
  return clampScore(average + diversityBonus);
}
