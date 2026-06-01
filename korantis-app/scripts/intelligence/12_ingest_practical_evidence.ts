import * as path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { ScoredCandidateVenue, SourceMention } from '../discovery/types';
import type {
  ExperienceEvidenceBundle,
  ExperienceEvidenceItem,
  ExperienceEvidenceSource,
  VenueExperienceSignalScores,
} from './experience_evidence/types';
import { extractTextSignals } from './experience_evidence/extract_text_signals';
import { aggregateExperienceEvidence } from './experience_evidence/aggregate_signals';

type PilotCandidateFile = {
  candidates: ScoredCandidateVenue[];
};

type FinalPilotOutput = {
  outputs: Array<{
    candidate_id: string;
    venue_name: string;
    google_place_id: string | null;
  }>;
};

type PracticalImportRecord = {
  venue_name: string;
  candidate_id: string;
  google_place_id: string;
  source: string;
  source_type: 'reddit' | 'blog' | 'editorial' | 'tripadvisor' | 'owner_site' | 'other';
  url: string;
  text: string;
  language: 'en' | 'es' | 'unknown';
  collected_at: string;
  notes: string;
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function stableId(...parts: Array<string | number | null | undefined>): string {
  return parts.map((part) => String(part ?? '').replace(/[^a-zA-Z0-9_-]+/g, '_')).join('__');
}

function importSourceType(sourceType: PracticalImportRecord['source_type']): ExperienceEvidenceSource {
  if (sourceType === 'reddit') return 'community';
  if (sourceType === 'tripadvisor') return 'travel';
  if (sourceType === 'blog') return 'blog';
  if (sourceType === 'editorial' || sourceType === 'owner_site') return 'editorial';
  return 'future_review_snapshot';
}

function mentionSourceType(mention: SourceMention): ExperienceEvidenceSource {
  const source = mention.source.toLowerCase();
  if (source.includes('reddit')) return 'community';
  if (source.includes('tripadvisor') || source.includes('wanderlog')) return 'travel';
  if (source.includes('blog') || source.includes('coffee')) return 'blog';
  return mention.source_type === 'community' ? 'community' : 'editorial';
}

function normalizeImport(raw: unknown): PracticalImportRecord[] {
  if (!raw) return [];
  const records = Array.isArray(raw) ? raw : [raw];
  return records.filter((record): record is PracticalImportRecord => {
    if (!record || typeof record !== 'object') return false;
    const item = record as Partial<PracticalImportRecord>;
    return Boolean(item.venue_name && item.candidate_id && item.source && item.text);
  });
}

function importedItems(records: PracticalImportRecord[], collectedAt: string): ExperienceEvidenceItem[] {
  return records.map((record, index) => ({
    id: stableId(record.candidate_id, 'manual_practical', index),
    candidate_id: record.candidate_id,
    venue_name: record.venue_name,
    source: record.source,
    source_type: importSourceType(record.source_type),
    text: record.text,
    structured_data: {
      google_place_id: record.google_place_id || null,
      language: record.language,
      notes: record.notes,
    },
    url: record.url || undefined,
    confidence: 82,
    collected_at: record.collected_at || collectedAt,
  }));
}

function sourceMentionItems(candidates: ScoredCandidateVenue[], collectedAt: string): ExperienceEvidenceItem[] {
  return candidates.flatMap((candidate) => (
    candidate.merged_sources
      .filter((mention) => mention.context && mention.context.trim().length > 0)
      .map((mention, index) => ({
        id: stableId(candidate.candidate_id, 'existing_source_practical', index),
        candidate_id: candidate.candidate_id,
        venue_name: candidate.venue_name,
        source: mention.source,
        source_type: mentionSourceType(mention),
        text: mention.context,
        structured_data: {
          source_rank_position: mention.rank_position,
          source_category: mention.category,
          district: mention.district,
        },
        url: mention.source_url || undefined,
        confidence: mention.source_type === 'community' ? 76 : 70,
        collected_at: collectedAt,
      }))
  ));
}

function groupBundles(candidates: ScoredCandidateVenue[], items: ExperienceEvidenceItem[]): ExperienceEvidenceBundle[] {
  return candidates.map((candidate) => {
    const venueItems = items.filter((item) => item.candidate_id === candidate.candidate_id);
    return {
      candidate_id: candidate.candidate_id,
      venue_name: candidate.venue_name,
      items: venueItems,
      extractions: venueItems.map(extractTextSignals),
    };
  });
}

function topSignals(aggregate: VenueExperienceSignalScores): string {
  return Object.entries(aggregate.signal_scores)
    .filter(([, score]) => score >= 45)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([signal, score]) => `${signal} ${score}`)
    .join(', ') || 'none';
}

function main() {
  const collectedAt = new Date().toISOString();
  const importPath = path.join(process.cwd(), 'data', 'practical_evidence_import.json');
  const candidates = readJson<PilotCandidateFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json')).candidates;
  const finalPilot = readJson<FinalPilotOutput>(path.join(process.cwd(), 'data', 'venue_intelligence_final_pilot_output.json'));
  const rawImport = existsSync(importPath) ? readJson<unknown>(importPath) : null;
  const validImports = normalizeImport(rawImport);
  const imported = importedItems(validImports, collectedAt);
  const existing = sourceMentionItems(candidates, collectedAt);
  const allItems = [...existing, ...imported];
  const bundles = groupBundles(candidates, allItems);
  const aggregated = bundles.map(aggregateExperienceEvidence);
  const googleByCandidate = new Map(finalPilot.outputs.map((output) => [output.candidate_id, output.google_place_id]));

  const output = {
    generatedAt: collectedAt,
    importFilePresent: existsSync(importPath),
    importedRecordCount: validImports.length,
    existingSourceSnippetCount: existing.length,
    candidateCount: candidates.length,
    items: allItems.map((item) => ({
      ...item,
      google_place_id: googleByCandidate.get(item.candidate_id) || null,
    })),
    bundles,
    aggregated,
  };
  writeFileSync(path.join(process.cwd(), 'data', 'practical_evidence_ingested.json'), JSON.stringify(output, null, 2));

  const report = [
    '# Practical Evidence Ingestion Report',
    '',
    `Generated: ${collectedAt}`,
    '',
    '## Scope',
    '',
    '- Ingests manual/importable practical evidence when available.',
    '- Also extracts existing stored discovery source snippets.',
    '- No scraping, no APIs, no LLMs.',
    '',
    '## Summary',
    '',
    `- Import file present: ${existsSync(importPath) ? 'yes' : 'no'}`,
    `- Imported evidence records: ${validImports.length}`,
    `- Existing source snippets ingested: ${existing.length}`,
    `- Total practical evidence items: ${allItems.length}`,
    '',
    existsSync(importPath) ? '' : 'No `data/practical_evidence_import.json` found. Imported evidence was skipped; existing stored source snippets were still extracted.',
    '',
    '## Venue Signals',
    '',
    ...aggregated.map((aggregate) => `- ${aggregate.venue_name}: items ${bundles.find((bundle) => bundle.candidate_id === aggregate.candidate_id)?.items.length || 0}; signals ${topSignals(aggregate)}; constraints ${aggregate.constraints.join(', ') || 'none'}; gaps ${aggregate.evidence_gaps.join(', ') || 'none'}`),
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'practical_evidence_ingestion_report.md'), report);
  console.log(report);
}

main();
