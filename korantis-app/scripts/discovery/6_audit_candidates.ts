import * as path from 'path';
import type { DiscoveryCategory, ScoredCandidateVenue } from './types';
import { DISCOVERY_DATA_DIR, readJsonFile, scoreCap, writeJsonFile, writeMarkdownFile } from './utils';

type CandidateVenuesFile = {
  candidates: ScoredCandidateVenue[];
};

type NormalizedCandidatesFile = {
  duplicateMergeStatistics: {
    raw_mentions: number;
    normalized_candidates: number;
    merged_mentions: number;
    candidates_with_aliases: number;
  };
};

type AuditStatus = 'APPROVED' | 'QUESTIONABLE' | 'REJECTED';

type EditorialSignals = {
  heritage_signal: number;
  novelty_signal: number;
  local_signal: number;
  tourist_signal: number;
  design_signal: number;
  community_signal: number;
  specialty_signal: number;
};

type EditorialEvaluation = {
  status: AuditStatus;
  reasons: string[];
};

const CATEGORY_LABELS: Record<DiscoveryCategory, string> = {
  cafe: 'Cafes',
  restaurant: 'Restaurants',
  wine_bar: 'Wine Bars',
  cocktail_bar: 'Cocktail Bars',
};

const CHAIN_OR_GENERIC_NAMES = [
  'pani',
  'panera rosa',
  'on tap',
];

const TOURIST_HEAVY_NAMES = [
  'tortoni',
  'guerrin',
  'confiteria violetas',
  'london city',
  'biela',
];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function normalizedText(candidate: ScoredCandidateVenue) {
  return [
    candidate.venue_name,
    candidate.canonical_name,
    candidate.aliases.join(' '),
    candidate.category,
    candidate.district,
    candidate.sources.join(' '),
    candidate.merged_sources.map((source) => source.context).join(' '),
  ].join(' ').toLowerCase();
}

function deriveSignals(candidate: ScoredCandidateVenue): EditorialSignals {
  const text = normalizedText(candidate);
  const communityMentions = candidate.merged_sources.filter((mention) => mention.source_type === 'community').length;
  const localMentions = candidate.merged_sources.filter((mention) => (
    mention.source.toLowerCase().includes('local') ||
    mention.context.toLowerCase().includes('local') ||
    mention.source_type === 'community'
  )).length;

  const heritage_signal = scoreCap(
    (includesAny(text, ['historic', 'classic', 'heritage', 'traditional', 'confiteria', 'tortoni', 'federal', 'galgos', 'biela', 'violetas']) ? 65 : 0) +
    (candidate.district === 'San Telmo' || candidate.district === 'Microcentro' ? 15 : 0)
  );

  const novelty_signal = scoreCap(
    (includesAny(text, ['creative', 'modern', 'emerging', 'natural wine', 'speakeasy', 'high-concept', 'new', 'independent']) ? 60 : 0) +
    (candidate.district === 'Chacarita' || candidate.district === 'Villa Crespo' ? 20 : 0)
  );

  const local_signal = scoreCap(localMentions * 24 + (includesAny(text, ['neighborhood', 'local', 'community']) ? 20 : 0));
  const tourist_signal = scoreCap(
    (includesAny(text, ['tourist', 'travel', 'wanderlog', 'must-visit', 'landmark', 'classic pizzeria']) ? 45 : 0) +
    (TOURIST_HEAVY_NAMES.includes(candidate.canonical_name) ? 45 : 0)
  );
  const design_signal = scoreCap(
    (includesAny(text, ['design', 'decor', 'visual', 'polished', 'hotel', 'speakeasy', 'modern', 'waterfront', 'garden']) ? 65 : 0) +
    (candidate.district === 'Palermo Chico' ? 20 : 0)
  );
  const community_signal = scoreCap(communityMentions * 34);
  const specialty_signal = scoreCap(
    (candidate.category === 'cafe' && includesAny(text, ['specialty', 'coffee', 'tostadores', 'espresso']) ? 75 : 0) ||
    (candidate.category === 'wine_bar' && includesAny(text, ['wine', 'natural wine', 'tasting', 'cava', 'malbec']) ? 75 : 0) ||
    (candidate.category === 'cocktail_bar' && includesAny(text, ['cocktail', 'speakeasy', 'vermouth', 'bar de copas']) ? 75 : 0) ||
    (candidate.category === 'restaurant' && includesAny(text, ['creative', 'tasting', 'grill', 'asado', 'restaurant guide']) ? 55 : 0)
  );

  return {
    heritage_signal,
    novelty_signal,
    local_signal,
    tourist_signal,
    design_signal,
    community_signal,
    specialty_signal,
  };
}

function evaluateCandidate(candidate: ScoredCandidateVenue, signals: EditorialSignals): EditorialEvaluation {
  const reasons: string[] = [];
  const isChainOrGeneric = CHAIN_OR_GENERIC_NAMES.includes(candidate.canonical_name);
  const isTouristHeavy = TOURIST_HEAVY_NAMES.includes(candidate.canonical_name) || signals.tourist_signal >= 80;
  const strongIndependentSignal = candidate.source_count >= 3 && candidate.consensus_score >= 80;
  const mediumSignal = candidate.source_count >= 2 && candidate.consensus_score >= 50;
  const korantisFit = Math.max(
    signals.specialty_signal,
    signals.design_signal,
    signals.heritage_signal,
    signals.novelty_signal,
    signals.local_signal
  );

  if (isChainOrGeneric) {
    return {
      status: 'REJECTED',
      reasons: ['chain or generic venue pattern', 'not distinctive enough for Korantis discovery'],
    };
  }

  if (candidate.source_count <= 1 && candidate.discovery_score < 36 && korantisFit < 60) {
    return {
      status: 'REJECTED',
      reasons: ['low signal', 'single-source mention', 'unclear atmosphere potential'],
    };
  }

  if (strongIndependentSignal && !isTouristHeavy && korantisFit >= 60) {
    reasons.push('repeated independent recommendations');
    reasons.push('strong consensus score');
    if (signals.specialty_signal >= 60) reasons.push('strong specialty/category signal');
    if (signals.local_signal >= 50) reasons.push('local or community signal present');
    if (signals.design_signal >= 60) reasons.push('design/atmosphere potential present');
    if (signals.heritage_signal >= 60) reasons.push('heritage signal present');
    if (signals.novelty_signal >= 60) reasons.push('novelty or independent venue signal present');
    return { status: 'APPROVED', reasons };
  }

  if (mediumSignal && korantisFit >= 55 && !isTouristHeavy) {
    return {
      status: 'QUESTIONABLE',
      reasons: ['promising candidate', 'needs human review before enrichment', 'source diversity not yet strong enough for approval'],
    };
  }

  if (isTouristHeavy) {
    return {
      status: 'QUESTIONABLE',
      reasons: ['tourist-heavy or landmark venue', 'may be culturally relevant but needs editorial review', 'risk of generic guide-list inclusion'],
    };
  }

  return {
    status: 'QUESTIONABLE',
    reasons: ['weak source diversity', 'unclear atmosphere potential', 'needs editorial review before enrichment'],
  };
}

function csvEscape(value: unknown) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function categoryRanking(candidates: ScoredCandidateVenue[], category: DiscoveryCategory, limit = 50) {
  return candidates
    .filter((candidate) => candidate.category === category)
    .sort((a, b) => b.discovery_score - a.discovery_score || b.consensus_score - a.consensus_score || a.venue_name.localeCompare(b.venue_name))
    .slice(0, limit);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function strongestCategories(candidates: ScoredCandidateVenue[]) {
  return Object.entries(candidates.reduce<Record<string, number>>((acc, candidate) => {
    acc[candidate.category] = (acc[candidate.category] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
}

function sourceContribution(candidates: ScoredCandidateVenue[]) {
  const contribution = new Map<string, {
    raw_mentions: number;
    normalized_candidates: Set<string>;
    approved: number;
    questionable: number;
    rejected: number;
    total_discovery_score: number;
  }>();

  for (const candidate of candidates) {
    const evaluation = evaluateCandidate(candidate, deriveSignals(candidate));
    for (const mention of candidate.merged_sources) {
      const row = contribution.get(mention.source) || {
        raw_mentions: 0,
        normalized_candidates: new Set<string>(),
        approved: 0,
        questionable: 0,
        rejected: 0,
        total_discovery_score: 0,
      };
      row.raw_mentions += 1;
      row.normalized_candidates.add(candidate.candidate_id);
      row.total_discovery_score += candidate.discovery_score;
      if (evaluation.status === 'APPROVED') row.approved += 1;
      if (evaluation.status === 'QUESTIONABLE') row.questionable += 1;
      if (evaluation.status === 'REJECTED') row.rejected += 1;
      contribution.set(mention.source, row);
    }
  }

  return Array.from(contribution.entries()).map(([source, row]) => ({
    source,
    raw_mentions: row.raw_mentions,
    normalized_candidates: row.normalized_candidates.size,
    approved: row.approved,
    questionable: row.questionable,
    rejected: row.rejected,
    average_discovery_score: row.raw_mentions ? row.total_discovery_score / row.raw_mentions : 0,
  })).sort((a, b) => b.approved - a.approved || b.average_discovery_score - a.average_discovery_score);
}

function sourceOverlap(candidates: ScoredCandidateVenue[]) {
  const distribution = candidates.reduce<Record<string, number>>((acc, candidate) => {
    const bucket = `${candidate.source_count} source${candidate.source_count === 1 ? '' : 's'}`;
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});

  const pairs = new Map<string, number>();
  for (const candidate of candidates) {
    const sources = [...candidate.sources].sort();
    for (let i = 0; i < sources.length; i += 1) {
      for (let j = i + 1; j < sources.length; j += 1) {
        const key = `${sources[i]} + ${sources[j]}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  }

  return {
    distribution,
    topPairs: Array.from(pairs.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12),
  };
}

function markdownRows(candidates: ScoredCandidateVenue[], includeSources = false) {
  const header = includeSources
    ? '| Venue | District | Score | Source Count | Sources |\n|---|---|---:|---:|---|'
    : '| Venue | District | Score | Source Count |\n|---|---|---:|---:|';

  return [
    header,
    ...candidates.map((candidate) => includeSources
      ? `| ${candidate.venue_name} | ${candidate.district} | ${candidate.discovery_score} | ${candidate.source_count} | ${candidate.sources.join(', ')} |`
      : `| ${candidate.venue_name} | ${candidate.district} | ${candidate.discovery_score} | ${candidate.source_count} |`
    ),
  ].join('\n');
}

function decisionRecommendation(candidates: ScoredCandidateVenue[], evaluations: Map<string, EditorialEvaluation>) {
  const approved = candidates.filter((candidate) => evaluations.get(candidate.candidate_id)?.status === 'APPROVED').length;
  const pending = candidates.filter((candidate) => candidate.discovery_score >= 60).length;
  const palermoShare = candidates.filter((candidate) => candidate.district.includes('Palermo')).length / candidates.length;
  const singleSourceShare = candidates.filter((candidate) => candidate.source_count === 1).length / candidates.length;

  if (approved >= 30 && pending >= 50 && palermoShare < 0.4) return 'A) Proceed to Google Enrichment';
  if (singleSourceShare > 0.6) return 'C) Expand Source Coverage First';
  if (palermoShare > 0.4) return 'D) Rebalance District Coverage First';
  return 'B) Improve Discovery First';
}

async function main() {
  const candidateFile = readJsonFile<CandidateVenuesFile>(path.join(DISCOVERY_DATA_DIR, 'candidate_venues.json'));
  const normalized = readJsonFile<NormalizedCandidatesFile>(path.join(DISCOVERY_DATA_DIR, 'normalized_candidates.json'));
  const candidates = candidateFile.candidates;
  const signalsByCandidate = new Map<string, EditorialSignals>();
  const evaluations = new Map<string, EditorialEvaluation>();

  for (const candidate of candidates) {
    const signals = deriveSignals(candidate);
    signalsByCandidate.set(candidate.candidate_id, signals);
    evaluations.set(candidate.candidate_id, evaluateCandidate(candidate, signals));
  }

  const csv = [
    [
      'venue_name',
      'category',
      'district',
      'source_count',
      'consensus_score',
      'discovery_score',
      'sources',
      'aliases',
      'discovery_notes',
      'editorial_status',
      'editorial_reasons',
    ].join(','),
    ...candidates.map((candidate) => {
      const evaluation = evaluations.get(candidate.candidate_id)!;
      return [
        candidate.venue_name,
        candidate.category,
        candidate.district,
        candidate.source_count,
        candidate.consensus_score,
        candidate.discovery_score,
        candidate.sources,
        candidate.aliases,
        candidate.discovery_notes,
        evaluation.status,
        evaluation.reasons.join('; '),
      ].map(csvEscape).join(',');
    }),
  ].join('\n');

  writeMarkdownFile(path.join(process.cwd(), 'data', 'discovery_candidate_audit.csv'), csv);

  writeJsonFile(path.join(process.cwd(), 'data', 'discovery_candidate_editorial_signals.json'), {
    generatedAt: new Date().toISOString(),
    signals: candidates.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      venue_name: candidate.venue_name,
      signals: signalsByCandidate.get(candidate.candidate_id),
    })),
  });

  const statusCounts = candidates.reduce<Record<AuditStatus, number>>((acc, candidate) => {
    const status = evaluations.get(candidate.candidate_id)!.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { APPROVED: 0, QUESTIONABLE: 0, REJECTED: 0 });

  const districtRows = Object.entries(candidates.reduce<Record<string, ScoredCandidateVenue[]>>((acc, candidate) => {
    acc[candidate.district] = acc[candidate.district] || [];
    acc[candidate.district].push(candidate);
    return acc;
  }, {})).sort((a, b) => b[1].length - a[1].length);

  const districtMarkdown = [
    '| District | Candidate Count | Avg Discovery | Strongest Categories | Weakest Categories |',
    '|---|---:|---:|---|---|',
    ...districtRows.map(([district, rows]) => {
      const categoryRows = strongestCategories(rows);
      const strongest = categoryRows.slice(0, 2).map(([category, count]) => `${category} (${count})`).join(', ');
      const weakest = categoryRows.slice(-2).map(([category, count]) => `${category} (${count})`).join(', ');
      return `| ${district} | ${rows.length} | ${average(rows.map((row) => row.discovery_score)).toFixed(1)} | ${strongest || '-'} | ${weakest || '-'} |`;
    }),
  ].join('\n');

  const sourceDiagnostics = sourceContribution(candidates);
  const overlap = sourceOverlap(candidates);
  const sourceDiagnosticsMarkdown = [
    '| Source | Raw Mentions | Candidates Created | Approved | Questionable | Rejected | Avg Discovery |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...sourceDiagnostics.map((row) => (
      `| ${row.source} | ${row.raw_mentions} | ${row.normalized_candidates} | ${row.approved} | ${row.questionable} | ${row.rejected} | ${row.average_discovery_score.toFixed(1)} |`
    )),
  ].join('\n');
  const sourceOverlapMarkdown = [
    '### Source Count Distribution',
    '',
    ...Object.entries(overlap.distribution).sort((a, b) => a[0].localeCompare(b[0])).map(([bucket, count]) => `- ${bucket}: ${count}`),
    '',
    '### Top Source Overlaps',
    '',
    ...(overlap.topPairs.length ? overlap.topPairs.map(([pair, count]) => `- ${pair}: ${count}`) : ['- No multi-source overlap detected.']),
  ].join('\n');

  const categorySections = (Object.keys(CATEGORY_LABELS) as DiscoveryCategory[]).map((category) => [
    `## ${CATEGORY_LABELS[category]} - Top 50`,
    '',
    markdownRows(categoryRanking(candidates, category, 50)),
  ].join('\n')).join('\n\n');

  const samplingSections = [
    ['Top 20 Cafes', categoryRanking(candidates, 'cafe', 20)],
    ['Top 20 Restaurants', categoryRanking(candidates, 'restaurant', 20)],
    ['Top 10 Wine Bars', categoryRanking(candidates, 'wine_bar', 10)],
    ['Top 10 Cocktail Bars', categoryRanking(candidates, 'cocktail_bar', 10)],
  ].map(([title, rows]) => [
    `## ${title}`,
    '',
    markdownRows(rows as ScoredCandidateVenue[], true),
  ].join('\n')).join('\n\n');

  const auditMarkdown = [
    '# Discovery Candidate Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Editorial Evaluation Summary',
    '',
    `- Total candidates: ${candidates.length}`,
    `- APPROVED: ${statusCounts.APPROVED}`,
    `- QUESTIONABLE: ${statusCounts.QUESTIONABLE}`,
    `- REJECTED: ${statusCounts.REJECTED}`,
    `- Average consensus score: ${average(candidates.map((candidate) => candidate.consensus_score)).toFixed(1)}`,
    `- Average discovery score: ${average(candidates.map((candidate) => candidate.discovery_score)).toFixed(1)}`,
    '',
    '## Full Candidate Audit',
    '',
    '| Venue | Category | District | Sources | Consensus | Discovery | Aliases | Status | Reasons |',
    '|---|---|---|---:|---:|---:|---|---|---|',
    ...candidates.map((candidate) => {
      const evaluation = evaluations.get(candidate.candidate_id)!;
      return `| ${candidate.venue_name} | ${candidate.category} | ${candidate.district} | ${candidate.source_count} | ${candidate.consensus_score} | ${candidate.discovery_score} | ${candidate.aliases.join('; ') || '-'} | ${evaluation.status} | ${evaluation.reasons.join('; ')} |`;
    }),
    '',
    categorySections,
    '',
    '## District Quality Analysis',
    '',
    districtMarkdown,
    '',
    '## Candidate Quality Sampling',
    '',
    samplingSections,
    '',
    '## Discovery Engine Diagnostics',
    '',
    `- Raw mentions: ${normalized.duplicateMergeStatistics.raw_mentions}`,
    `- Normalized candidates: ${normalized.duplicateMergeStatistics.normalized_candidates}`,
    `- Duplicate mentions merged: ${normalized.duplicateMergeStatistics.merged_mentions}`,
    `- Candidates with aliases: ${normalized.duplicateMergeStatistics.candidates_with_aliases}`,
    `- Candidates surviving consensus scoring: ${candidates.length}`,
    `- Candidates with discovery_score >= 60: ${candidates.filter((candidate) => candidate.discovery_score >= 60).length}`,
    '',
    sourceOverlapMarkdown,
    '',
    sourceDiagnosticsMarkdown,
  ].join('\n');

  writeMarkdownFile(path.join(process.cwd(), 'data', 'discovery_candidate_audit.md'), auditMarkdown);
  writeMarkdownFile(path.join(process.cwd(), 'data', 'discovery_district_quality_analysis.md'), [
    '# Discovery District Quality Analysis',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    districtMarkdown,
  ].join('\n'));

  const recommendation = decisionRecommendation(candidates, evaluations);
  const overrepresentedDistricts = districtRows.filter(([, rows]) => rows.length >= 20).map(([district, rows]) => `${district} (${rows.length})`);
  const underrepresentedDistricts = districtRows.filter(([, rows]) => rows.length <= 4).map(([district, rows]) => `${district} (${rows.length})`);
  const categoryStrengthRows = Object.entries(candidates.reduce<Record<string, number>>((acc, candidate) => {
    acc[candidate.category] = (acc[candidate.category] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const valuableSources = sourceDiagnostics.filter((row) => row.approved > 0 || row.average_discovery_score >= 45).map((row) => `${row.source} (${row.normalized_candidates} candidates, avg ${row.average_discovery_score.toFixed(1)})`);
  const weakSources = sourceDiagnostics.filter((row) => row.approved === 0 && row.average_discovery_score < 40).map((row) => `${row.source} (${row.normalized_candidates} candidates, avg ${row.average_discovery_score.toFixed(1)})`);

  const recommendationsMarkdown = [
    '# Discovery Phase D.6 Recommendations',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## 1. Is the candidate universe good enough?',
    '',
    `Not yet. It is directionally useful, but only ${statusCounts.APPROVED} of ${candidates.length} candidates are editorially approved by heuristic audit, and only ${candidates.filter((candidate) => candidate.discovery_score >= 60).length} candidates clear the current discovery review threshold.`,
    '',
    '## 2. Which districts are strongest?',
    '',
    ...districtRows.slice(0, 5).map(([district, rows]) => `- ${district}: ${rows.length} candidates, avg discovery ${average(rows.map((row) => row.discovery_score)).toFixed(1)}`),
    '',
    '## 3. Which categories are strongest?',
    '',
    ...categoryStrengthRows.map(([category, count]) => `- ${category}: ${count} candidates`),
    '',
    '## 4. Which source adapters are valuable?',
    '',
    ...(valuableSources.length ? valuableSources.map((source) => `- ${source}`) : ['- None yet with enough approved signal.']),
    '',
    '## 5. Which source adapters should be improved?',
    '',
    ...(weakSources.length ? weakSources.map((source) => `- ${source}`) : ['- No low-performing source adapters identified by this heuristic.']),
    '',
    '## 6. Should Google enrichment begin?',
    '',
    'No. Google enrichment should wait until a larger manually reviewed set is approved_for_enrichment. The current universe validates the architecture, but not enough candidates have strong independent signal.',
    '',
    '## 7. What should be filtered before enrichment?',
    '',
    '- Single-source candidates with discovery_score below 36 unless a human explicitly approves them.',
    '- Chain or generic venues such as Pani, La Panera Rosa, and On Tap.',
    '- Tourist-heavy landmark venues unless Korantis wants a heritage-specific collection.',
    '- Candidates with unclear atmosphere potential or generic guide-list inclusion.',
    '- Overrepresented Palermo Soho candidates should be capped during the next collection pass.',
    '',
    '## District Coverage Diagnosis',
    '',
    `- Overrepresented districts: ${overrepresentedDistricts.join(', ') || 'none'}`,
    `- Underrepresented districts: ${underrepresentedDistricts.join(', ') || 'none'}`,
    '- Missing target districts: Puerto Madero, Las Canitas',
    '',
    '## Final Decision',
    '',
    recommendation,
  ].join('\n');

  writeMarkdownFile(path.join(process.cwd(), 'data', 'discovery_phase_d6_recommendations.md'), recommendationsMarkdown);

  console.log(`Wrote data/discovery_candidate_audit.csv`);
  console.log(`Wrote data/discovery_candidate_audit.md`);
  console.log(`Wrote data/discovery_candidate_editorial_signals.json`);
  console.log(`Wrote data/discovery_district_quality_analysis.md`);
  console.log(`Wrote data/discovery_phase_d6_recommendations.md`);
  console.log(`Final decision: ${recommendation}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
