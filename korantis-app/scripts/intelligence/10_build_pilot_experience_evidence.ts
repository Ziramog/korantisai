import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import type { ScoredCandidateVenue, SourceMention } from '../discovery/types';
import type {
  ExperienceEvidenceBundle,
  ExperienceEvidenceItem,
  ExperienceEvidenceSource,
  ExperienceEvidenceSummary,
  ExperienceEvidenceSignal,
  VenueExperienceSignalScores,
} from './experience_evidence/types';
import { EXPERIENCE_SIGNALS } from './experience_evidence/signals';
import { extractTextSignals } from './experience_evidence/extract_text_signals';
import { aggregateExperienceEvidence } from './experience_evidence/aggregate_signals';

type PilotCandidateFile = {
  candidates: ScoredCandidateVenue[];
};

type GoogleReview = {
  text?: string;
  rating?: number;
  authorAttribution?: Record<string, unknown>;
};

type EnrichmentRecord = {
  candidate_id: string;
  candidate_name: string;
  status: string;
  google_place_id: string | null;
  google_data: {
    rating?: number;
    userRatingCount?: number;
    priceLevel?: string;
    primaryType?: string;
    types?: string[];
    businessStatus?: string;
    reviews?: GoogleReview[];
  } | null;
};

type EnrichmentFile = {
  records: EnrichmentRecord[];
};

type VisionVenue = {
  candidate_id: string;
  venue_name: string;
  vision_status: string;
  photos_evaluated: number;
  aggregation: {
    acceptable_hero_photo: boolean;
    photo_quality_score: number;
    interior_confidence: number;
    seating_confidence: number;
    long_stay_visual_signal: number;
    design_visual_signal: number;
    warnings: string[];
  };
};

type VisionFile = {
  venues: VisionVenue[];
};

type FinalPilotOutput = {
  outputs: Array<{
    candidate_id: string;
    venue_name: string;
    evidence: {
      constraints: string[];
    };
    eligibility: {
      status: string;
      reasons: string[];
      warnings: string[];
    };
  }>;
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function stableId(...parts: Array<string | number | null | undefined>): string {
  return parts.map((part) => String(part ?? '').replace(/[^a-zA-Z0-9_-]+/g, '_')).join('__');
}

function sourceTypeForMention(mention: SourceMention): ExperienceEvidenceSource {
  const source = mention.source.toLowerCase();
  if (source.includes('reddit')) return 'community';
  if (source.includes('tripadvisor') || source.includes('wanderlog')) return 'travel';
  if (source.includes('blog') || source.includes('coffee')) return 'blog';
  if (mention.source_type === 'community') return 'community';
  return 'editorial';
}

function sourceTypeBreakdown(items: ExperienceEvidenceItem[]): Record<ExperienceEvidenceSource, number> {
  const breakdown: Record<ExperienceEvidenceSource, number> = {
    google_review: 0,
    google_metadata: 0,
    vision: 0,
    editorial: 0,
    community: 0,
    travel: 0,
    blog: 0,
    future_review_snapshot: 0,
  };
  for (const item of items) breakdown[item.source_type] += 1;
  return breakdown;
}

function topSignals(signalScores: Partial<Record<ExperienceEvidenceSignal, number>>): Partial<Record<ExperienceEvidenceSignal, number>> {
  return EXPERIENCE_SIGNALS
    .filter((signal) => (signalScores[signal] || 0) >= 45)
    .sort((a, b) => (signalScores[b] || 0) - (signalScores[a] || 0))
    .slice(0, 10)
    .reduce((result, signal) => {
      result[signal] = signalScores[signal];
      return result;
    }, {} as Partial<Record<ExperienceEvidenceSignal, number>>);
}

function visionText(vision: VisionVenue): string {
  const words = [
    vision.aggregation.acceptable_hero_photo ? 'acceptable hero photo' : 'no acceptable hero photo',
    vision.aggregation.interior_confidence >= 45 ? 'interior visible' : '',
    vision.aggregation.seating_confidence >= 45 ? 'seating visible' : '',
    vision.aggregation.design_visual_signal >= 65 ? 'design quality' : '',
    vision.aggregation.long_stay_visual_signal >= 55 ? 'long stay visual support' : '',
    ...vision.aggregation.warnings,
  ].filter(Boolean);
  return words.join('. ');
}

function buildItems(
  candidate: ScoredCandidateVenue,
  enrichment: EnrichmentRecord | undefined,
  vision: VisionVenue | undefined,
  finalOutput: FinalPilotOutput['outputs'][number] | undefined,
  collectedAt: string
): ExperienceEvidenceItem[] {
  const items: ExperienceEvidenceItem[] = [];

  candidate.merged_sources.forEach((mention, index) => {
    items.push({
      id: stableId(candidate.candidate_id, 'source', index),
      candidate_id: candidate.candidate_id,
      venue_name: candidate.venue_name,
      source: mention.source,
      source_type: sourceTypeForMention(mention),
      text: mention.context,
      structured_data: {
        source_rank_position: mention.rank_position,
        discovery_category: mention.category,
        district: mention.district,
      },
      url: mention.source_url,
      confidence: mention.source_type === 'community' ? 76 : 72,
      collected_at: collectedAt,
    });
  });

  if (enrichment?.google_data) {
    items.push({
      id: stableId(candidate.candidate_id, 'google_metadata'),
      candidate_id: candidate.candidate_id,
      venue_name: candidate.venue_name,
      source: 'Google Places metadata',
      source_type: 'google_metadata',
      text: [
        enrichment.google_data.primaryType || '',
        ...(enrichment.google_data.types || []),
        `rating ${enrichment.google_data.rating ?? 'unknown'}`,
        `review count ${enrichment.google_data.userRatingCount ?? 0}`,
      ].join(' '),
      structured_data: {
        google_place_id: enrichment.google_place_id,
        match_status: enrichment.status,
        rating: enrichment.google_data.rating ?? null,
        userRatingCount: enrichment.google_data.userRatingCount ?? null,
        priceLevel: enrichment.google_data.priceLevel ?? null,
        primaryType: enrichment.google_data.primaryType ?? null,
        types: enrichment.google_data.types || [],
        businessStatus: enrichment.google_data.businessStatus ?? null,
      },
      confidence: enrichment.status === 'matched' ? 82 : 45,
      collected_at: collectedAt,
    });

    (enrichment.google_data.reviews || []).forEach((review, index) => {
      if (!review.text) return;
      items.push({
        id: stableId(candidate.candidate_id, 'google_review', index),
        candidate_id: candidate.candidate_id,
        venue_name: candidate.venue_name,
        source: 'Google limited review',
        source_type: 'google_review',
        text: review.text,
        structured_data: { rating: review.rating ?? null },
        confidence: 78,
        collected_at: collectedAt,
      });
    });
  }

  if (vision) {
    items.push({
      id: stableId(candidate.candidate_id, 'vision'),
      candidate_id: candidate.candidate_id,
      venue_name: candidate.venue_name,
      source: 'Photo vision aggregation',
      source_type: 'vision',
      text: visionText(vision),
      structured_data: {
        vision_status: vision.vision_status,
        photos_evaluated: vision.photos_evaluated,
        ...vision.aggregation,
      },
      confidence: vision.vision_status === 'evaluated' ? 88 : 35,
      collected_at: collectedAt,
    });
  }

  if (finalOutput) {
    const constraints = [
      ...finalOutput.evidence.constraints,
      ...finalOutput.eligibility.reasons,
      ...finalOutput.eligibility.warnings,
    ].filter(Boolean);

    if (constraints.length > 0) {
      items.push({
        id: stableId(candidate.candidate_id, 'constraints'),
        candidate_id: candidate.candidate_id,
        venue_name: candidate.venue_name,
        source: 'Eligibility and photo constraints',
        source_type: 'vision',
        text: constraints.join('. '),
        structured_data: {
          eligibility_status: finalOutput.eligibility.status,
          constraints,
        },
        confidence: 65,
        collected_at: collectedAt,
      });
    }
  }

  return items;
}

function summaryFor(bundle: ExperienceEvidenceBundle, aggregate: VenueExperienceSignalScores): ExperienceEvidenceSummary {
  return {
    candidate_id: bundle.candidate_id,
    venue_name: bundle.venue_name,
    evidence_item_count: bundle.items.length,
    source_type_breakdown: sourceTypeBreakdown(bundle.items),
    positive_signals: topSignals(aggregate.signal_scores),
    constraints: aggregate.constraints,
    evidence_gaps: aggregate.evidence_gaps,
  };
}

function main() {
  const collectedAt = new Date().toISOString();
  const candidates = readJson<PilotCandidateFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json')).candidates;
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'venue_intelligence_google_enrichment_final_pilot.json'));
  const finalPilot = readJson<FinalPilotOutput>(path.join(process.cwd(), 'data', 'venue_intelligence_final_pilot_output.json'));
  const primaryVision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'venue_intelligence_photo_vision_results.json'));
  const additionalVision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'venue_intelligence_additional_photo_vision_results.json'));

  const enrichmentByCandidate = new Map(enrichment.records.map((record) => [record.candidate_id, record]));
  const finalByCandidate = new Map(finalPilot.outputs.map((output) => [output.candidate_id, output]));
  const visionByCandidate = new Map<string, VisionVenue>();
  for (const vision of primaryVision.venues) visionByCandidate.set(vision.candidate_id, vision);
  for (const vision of additionalVision.venues) visionByCandidate.set(vision.candidate_id, vision);

  const bundles = candidates.map((candidate) => {
    const items = buildItems(
      candidate,
      enrichmentByCandidate.get(candidate.candidate_id),
      visionByCandidate.get(candidate.candidate_id),
      finalByCandidate.get(candidate.candidate_id),
      collectedAt
    );
    const extractions = items.map(extractTextSignals);
    return {
      candidate_id: candidate.candidate_id,
      venue_name: candidate.venue_name,
      items,
      extractions,
    };
  });
  const aggregated = bundles.map(aggregateExperienceEvidence);
  const summaries = bundles.map((bundle) => {
    const aggregate = aggregated.find((item) => item.candidate_id === bundle.candidate_id);
    if (!aggregate) throw new Error(`Missing aggregate for ${bundle.venue_name}`);
    return summaryFor(bundle, aggregate);
  });

  writeFileSync(path.join(process.cwd(), 'data', 'venue_experience_evidence_pilot.json'), JSON.stringify({
    generatedAt: collectedAt,
    count: bundles.length,
    bundles,
    aggregated,
    summaries,
  }, null, 2));

  const report = [
    '# Venue Experience Evidence Pilot Report',
    '',
    `Generated: ${collectedAt}`,
    '',
    '## Scope',
    '',
    '- Evidence layer for the existing 16 pilot venues only.',
    '- No Google Maps scraping.',
    '- No LLM calls.',
    '- No new external APIs.',
    '',
    '## Evidence Summary',
    '',
    ...summaries.map((summary) => [
      `### ${summary.venue_name}`,
      '',
      `- Evidence items: ${summary.evidence_item_count}`,
      `- Source types: ${Object.entries(summary.source_type_breakdown).filter(([, count]) => count > 0).map(([source, count]) => `${source} ${count}`).join(', ') || 'none'}`,
      `- Positive signals: ${Object.entries(summary.positive_signals).map(([signal, score]) => `${signal} ${score}`).join(', ') || 'none'}`,
      `- Negative constraints: ${summary.constraints.join(', ') || 'none'}`,
      `- Evidence gaps: ${summary.evidence_gaps.join(', ') || 'none'}`,
      '',
    ].join('\n')),
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_experience_evidence_pilot_report.md'), report);
  console.log(report);
}

main();
