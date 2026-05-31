import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import type { District, ScoredCandidateVenue } from './types';
import { DISCOVERY_DATA_DIR, readJsonFile, scoreCap, writeJsonFile, writeMarkdownFile } from './utils';

type CandidateVenuesFile = { candidates: ScoredCandidateVenue[] };
type RawMentionsFile = { count: number; mentions: Array<{ source: string; venue_name: string }> };
type NormalizedFile = {
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
  landmark_signal: number;
  tourist_signal: number;
  community_signal: number;
  specialty_signal: number;
  design_signal: number;
  novelty_signal: number;
};

const BASELINE = {
  raw_mentions: 158,
  candidates: 112,
  approved: 10,
  questionable: 80,
  rejected: 22,
};

const CHAIN_OR_GENERIC = [
  'pani',
  'panera rosa',
  'on tap',
  'tea connection',
  'le pain quotidien',
  'freddo',
  'sushiclub',
  'kansas',
  'club de la birra',
];

const TOURIST_OR_LANDMARK = [
  'tortoni',
  'guerrin',
  'biela',
  'violetas',
  'london city',
  'cabaña las lilas',
  'madero tango',
  'el cuartito',
  'la brigada',
];

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function textFor(candidate: ScoredCandidateVenue) {
  return [
    candidate.venue_name,
    candidate.canonical_name,
    candidate.aliases.join(' '),
    candidate.district,
    candidate.category,
    candidate.sources.join(' '),
    candidate.merged_sources.map((mention) => mention.context).join(' '),
  ].join(' ').toLowerCase();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function signalsFor(candidate: ScoredCandidateVenue): EditorialSignals {
  const text = textFor(candidate);
  const communityMentions = candidate.merged_sources.filter((mention) => mention.source_type === 'community').length;
  const highAuthorityMentions = candidate.sources.filter((source) => ['Michelin', "World's Best Bars", '50 Best Discovery'].includes(source)).length;

  return {
    heritage_signal: scoreCap((hasAny(text, ['historic', 'classic', 'heritage', 'traditional', 'confiteria', 'federal', 'galgos']) ? 65 : 0) + (['San Telmo', 'Microcentro', 'Retiro', 'Recoleta'].includes(candidate.district) ? 15 : 0)),
    landmark_signal: scoreCap((hasAny(text, TOURIST_OR_LANDMARK) ? 75 : 0) + (highAuthorityMentions > 0 ? 10 : 0)),
    tourist_signal: scoreCap((hasAny(text, ['tourist', 'travel', 'landmark', 'waterfront', 'hotel', 'classic pizzeria']) ? 55 : 0) + (hasAny(text, TOURIST_OR_LANDMARK) ? 35 : 0)),
    community_signal: scoreCap(communityMentions * 28 + (candidate.sources.includes('Reddit') ? 25 : 0)),
    specialty_signal: scoreCap(
      (candidate.category === 'cafe' && hasAny(text, ['specialty', 'coffee', 'tostadores', 'espresso']) ? 80 : 0) ||
      (candidate.category === 'wine_bar' && hasAny(text, ['wine', 'cava', 'malbec', 'natural wine', 'tasting']) ? 80 : 0) ||
      (candidate.category === 'cocktail_bar' && hasAny(text, ['cocktail', 'vermouth', 'speakeasy', 'bar']) ? 78 : 0) ||
      (candidate.category === 'restaurant' && hasAny(text, ['michelin', '50 best', 'creative', 'tasting', 'asado', 'grill']) ? 65 : 0)
    ),
    design_signal: scoreCap((hasAny(text, ['design', 'polished', 'garden', 'hotel', 'speakeasy', 'skyline', 'view', 'waterfront', 'courtyard']) ? 70 : 0)),
    novelty_signal: scoreCap((hasAny(text, ['creative', 'modern', 'independent', 'emerging', 'natural wine', 'speakeasy']) ? 65 : 0) + (['Chacarita', 'Villa Crespo', 'Colegiales'].includes(candidate.district) ? 15 : 0)),
  };
}

function evaluate(candidate: ScoredCandidateVenue, signals: EditorialSignals) {
  const text = textFor(candidate);
  const fit = Math.max(signals.heritage_signal, signals.landmark_signal, signals.community_signal, signals.specialty_signal, signals.design_signal, signals.novelty_signal);
  const reasons: string[] = [];

  if (hasAny(text, CHAIN_OR_GENERIC)) {
    return { status: 'REJECTED' as const, reasons: ['chain or generic pattern', 'not distinctive enough before enrichment'] };
  }

  if (candidate.source_count <= 1 && candidate.discovery_score < 40 && fit < 60) {
    return { status: 'REJECTED' as const, reasons: ['low signal', 'single-source candidate', 'unclear atmosphere potential'] };
  }

  if (candidate.source_count >= 3 && candidate.discovery_score >= 60 && candidate.consensus_score >= 80 && fit >= 60 && signals.tourist_signal < 90) {
    reasons.push('repeated independent recommendations');
    reasons.push('strong weighted consensus');
    if (signals.specialty_signal >= 60) reasons.push('specialty/category signal');
    if (signals.community_signal >= 50) reasons.push('community signal');
    if (signals.design_signal >= 60) reasons.push('design or spatial signal');
    if (signals.heritage_signal >= 60) reasons.push('heritage signal');
    if (signals.novelty_signal >= 60) reasons.push('novelty signal');
    return { status: 'APPROVED' as const, reasons };
  }

  if (signals.tourist_signal >= 90) {
    return { status: 'QUESTIONABLE' as const, reasons: ['tourist-heavy or landmark venue', 'may fit a heritage collection but needs manual review'] };
  }

  return {
    status: 'QUESTIONABLE' as const,
    reasons: candidate.source_count >= 2
      ? ['promising but still requires manual review', 'source diversity improved but editorial fit is not final']
      : ['weak source diversity', 'needs additional independent confirmation'],
  };
}

function parseBaselineAudit() {
  const file = path.join(process.cwd(), 'data', 'discovery_candidate_audit.csv');
  if (!existsSync(file)) return new Map<string, AuditStatus>();
  const lines = readFileSync(file, 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
  const rows = new Map<string, AuditStatus>();

  for (const line of lines) {
    const cells = line.match(/("([^"]|"")*"|[^,]+)/g)?.map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
    const name = cells[0];
    const status = cells[9] as AuditStatus | undefined;
    if (name && status) rows.set(name, status);
  }

  return rows;
}

function markdownTable(candidates: ScoredCandidateVenue[], evaluations: Map<string, ReturnType<typeof evaluate>>, limit = 100) {
  return [
    '| Rank | Venue | District | Category | Sources | Consensus | Discovery | Editorial |',
    '|---:|---|---|---|---:|---:|---:|---|',
    ...candidates.slice(0, limit).map((candidate, index) => {
      const evaluation = evaluations.get(candidate.candidate_id)!;
      return `| ${index + 1} | ${candidate.venue_name} | ${candidate.district} | ${candidate.category} | ${candidate.source_count} | ${candidate.consensus_score} | ${candidate.discovery_score} | ${evaluation.status} |`;
    }),
  ].join('\n');
}

function districtCoverage(candidates: ScoredCandidateVenue[], districts: District[]) {
  return districts.map((district) => {
    const rows = candidates.filter((candidate) => candidate.district === district.district);
    const sources = new Set(rows.flatMap((candidate) => candidate.sources));
    const avg_consensus = average(rows.map((candidate) => candidate.consensus_score));
    const avg_discovery = average(rows.map((candidate) => candidate.discovery_score));
    const targetRatio = district.venue_target ? Math.min(rows.length / district.venue_target, 1) : 0;
    const sourceScore = Math.min(sources.size / 6, 1) * 100;
    const coverage_score = scoreCap(targetRatio * 35 + sourceScore * 0.25 + avg_consensus * 0.20 + avg_discovery * 0.20);

    return {
      district: district.district,
      candidate_count: rows.length,
      source_count: sources.size,
      avg_consensus,
      avg_discovery,
      coverage_score,
      status: coverage_score >= 70 ? 'healthy' : coverage_score < 40 ? 'incomplete' : 'developing',
    };
  }).sort((a, b) => b.coverage_score - a.coverage_score);
}

function sourceQuality(candidates: ScoredCandidateVenue[], raw: RawMentionsFile, evaluations: Map<string, ReturnType<typeof evaluate>>) {
  const bySource = new Map<string, {
    mentions: number;
    candidates: Set<string>;
    approved: number;
    questionable: number;
    rejected: number;
    scoreTotal: number;
  }>();

  for (const mention of raw.mentions) {
    const row = bySource.get(mention.source) || { mentions: 0, candidates: new Set<string>(), approved: 0, questionable: 0, rejected: 0, scoreTotal: 0 };
    row.mentions += 1;
    bySource.set(mention.source, row);
  }

  for (const candidate of candidates) {
    const evaluation = evaluations.get(candidate.candidate_id)!;
    for (const source of candidate.sources) {
      const row = bySource.get(source) || { mentions: 0, candidates: new Set<string>(), approved: 0, questionable: 0, rejected: 0, scoreTotal: 0 };
      row.candidates.add(candidate.candidate_id);
      row.scoreTotal += candidate.discovery_score;
      if (evaluation.status === 'APPROVED') row.approved += 1;
      if (evaluation.status === 'QUESTIONABLE') row.questionable += 1;
      if (evaluation.status === 'REJECTED') row.rejected += 1;
      bySource.set(source, row);
    }
  }

  return Array.from(bySource.entries()).map(([source, row]) => ({
    source,
    mentions_generated: row.mentions,
    unique_candidates: row.candidates.size,
    approved_candidates: row.approved,
    questionable_candidates: row.questionable,
    rejected_candidates: row.rejected,
    average_discovery_score: row.candidates.size ? row.scoreTotal / row.candidates.size : 0,
  })).sort((a, b) => b.approved_candidates - a.approved_candidates || b.average_discovery_score - a.average_discovery_score);
}

function sourceOverlap(candidates: ScoredCandidateVenue[]) {
  const distribution = candidates.reduce<Record<string, number>>((acc, candidate) => {
    const key = `${candidate.source_count} source${candidate.source_count === 1 ? '' : 's'}`;
    acc[key] = (acc[key] || 0) + 1;
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
    pairs: Array.from(pairs.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15),
  };
}

async function main() {
  const candidateFile = readJsonFile<CandidateVenuesFile>(path.join(DISCOVERY_DATA_DIR, 'candidate_venues.json'));
  const normalized = readJsonFile<NormalizedFile>(path.join(DISCOVERY_DATA_DIR, 'normalized_candidates.json'));
  const raw = readJsonFile<RawMentionsFile>(path.join(DISCOVERY_DATA_DIR, 'raw_mentions.json'));
  const districts = readJsonFile<District[]>(path.join(DISCOVERY_DATA_DIR, 'buenos_aires_districts.json'));
  const candidates = candidateFile.candidates;
  const baselineAudit = parseBaselineAudit();
  const signals = new Map<string, EditorialSignals>();
  const evaluations = new Map<string, ReturnType<typeof evaluate>>();

  for (const candidate of candidates) {
    const candidateSignals = signalsFor(candidate);
    signals.set(candidate.candidate_id, candidateSignals);
    evaluations.set(candidate.candidate_id, evaluate(candidate, candidateSignals));
  }

  const approved = candidates.filter((candidate) => evaluations.get(candidate.candidate_id)?.status === 'APPROVED');
  const questionable = candidates.filter((candidate) => evaluations.get(candidate.candidate_id)?.status === 'QUESTIONABLE');
  const rejected = candidates.filter((candidate) => evaluations.get(candidate.candidate_id)?.status === 'REJECTED');
  const promoted = candidates.filter((candidate) => baselineAudit.get(candidate.venue_name) === 'QUESTIONABLE' && evaluations.get(candidate.candidate_id)?.status === 'APPROVED');
  const downgraded = candidates.filter((candidate) => {
    const previous = baselineAudit.get(candidate.venue_name);
    return (previous === 'QUESTIONABLE' || previous === 'APPROVED') && evaluations.get(candidate.candidate_id)?.status === 'REJECTED';
  });
  const coverage = districtCoverage(candidates, districts);
  const quality = sourceQuality(candidates, raw, evaluations);
  const overlap = sourceOverlap(candidates);

  writeJsonFile(path.join(process.cwd(), 'data', 'discovery_candidate_editorial_signals_d7.json'), {
    generatedAt: new Date().toISOString(),
    signals: candidates.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      venue_name: candidate.venue_name,
      signals: signals.get(candidate.candidate_id),
    })),
  });

  const sourceQualityMarkdown = [
    '# Source Quality Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Source | Mentions | Unique Candidates | Approved | Questionable | Rejected | Avg Discovery |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...quality.map((row) => `| ${row.source} | ${row.mentions_generated} | ${row.unique_candidates} | ${row.approved_candidates} | ${row.questionable_candidates} | ${row.rejected_candidates} | ${row.average_discovery_score.toFixed(1)} |`),
  ].join('\n');
  writeMarkdownFile(path.join(process.cwd(), 'data', 'source_quality_report.md'), sourceQualityMarkdown);

  const districtCoverageMarkdown = [
    '# District Coverage Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| District | Candidates | Sources | Avg Consensus | Avg Discovery | Coverage Score | Status |',
    '|---|---:|---:|---:|---:|---:|---|',
    ...coverage.map((row) => `| ${row.district} | ${row.candidate_count} | ${row.source_count} | ${row.avg_consensus.toFixed(1)} | ${row.avg_discovery.toFixed(1)} | ${row.coverage_score} | ${row.status} |`),
  ].join('\n');
  writeMarkdownFile(path.join(process.cwd(), 'data', 'district_coverage_report.md'), districtCoverageMarkdown);

  const audit = [
    '# Discovery Phase D.7 Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total mentions: ${raw.count}`,
    `- Total candidates: ${candidates.length}`,
    `- Candidate growth: ${BASELINE.candidates} -> ${candidates.length} (+${candidates.length - BASELINE.candidates})`,
    `- Mention growth: ${BASELINE.raw_mentions} -> ${raw.count} (+${raw.count - BASELINE.raw_mentions})`,
    `- APPROVED: ${approved.length}`,
    `- QUESTIONABLE: ${questionable.length}`,
    `- REJECTED: ${rejected.length}`,
    `- Candidates with discovery_score >= 60: ${candidates.filter((candidate) => candidate.discovery_score >= 60).length}`,
    `- Single-source candidates: ${candidates.filter((candidate) => candidate.source_count === 1).length}`,
    `- Multi-source candidates: ${candidates.filter((candidate) => candidate.source_count > 1).length}`,
    `- Duplicate mentions merged: ${normalized.duplicateMergeStatistics.merged_mentions}`,
    '',
    '## District Growth',
    '',
    `- Puerto Madero candidates: ${candidates.filter((candidate) => candidate.district === 'Puerto Madero').length}`,
    `- Las Canitas candidates: ${candidates.filter((candidate) => candidate.district === 'Las Canitas').length}`,
    `- Recoleta candidates: ${candidates.filter((candidate) => candidate.district === 'Recoleta').length}`,
    `- Retiro candidates: ${candidates.filter((candidate) => candidate.district === 'Retiro').length}`,
    `- Belgrano candidates: ${candidates.filter((candidate) => candidate.district === 'Belgrano').length}`,
    '',
    '## District Coverage Ranking',
    '',
    districtCoverageMarkdown.split('\n').slice(4).join('\n'),
    '',
    '## Source Quality Ranking',
    '',
    sourceQualityMarkdown.split('\n').slice(4).join('\n'),
    '',
    '## Source Overlap Analysis',
    '',
    '### Source Count Distribution',
    '',
    ...Object.entries(overlap.distribution).sort((a, b) => a[0].localeCompare(b[0])).map(([bucket, count]) => `- ${bucket}: ${count}`),
    '',
    '### Top Source Overlaps',
    '',
    ...overlap.pairs.map(([pair, count]) => `- ${pair}: ${count}`),
    '',
    '## Top 100 Candidates',
    '',
    markdownTable(candidates, evaluations, 100),
    '',
    '## Candidates Promoted From QUESTIONABLE To APPROVED',
    '',
    ...(promoted.length ? promoted.map((candidate) => `- ${candidate.venue_name} (${candidate.district}, ${candidate.category})`) : ['- None from baseline QUESTIONABLE.']),
    '',
    '## Candidates Downgraded To REJECTED',
    '',
    ...(downgraded.length ? downgraded.map((candidate) => `- ${candidate.venue_name} (${candidate.district}, ${candidate.category})`) : ['- None from baseline approved/questionable.']),
    '',
    '## D.7 Recommendation',
    '',
    approved.length >= 30 && candidates.filter((candidate) => candidate.source_count === 1).length < candidates.length / 2
      ? 'Discovery quality is materially stronger, but enrichment should still wait for human review of APPROVED candidates.'
      : 'Discovery improved but still needs more source coverage or manual review before enrichment.',
    '',
    '## Guardrails',
    '',
    '- No candidates were promoted to staging.',
    '- No Google enrichment was run.',
    '- No public venues were published.',
  ].join('\n');

  writeMarkdownFile(path.join(process.cwd(), 'data', 'discovery_phase_d7_audit.md'), audit);

  console.log(`Wrote data/discovery_phase_d7_audit.md`);
  console.log(`Wrote data/source_quality_report.md`);
  console.log(`Wrote data/district_coverage_report.md`);
  console.log(`Wrote data/discovery_candidate_editorial_signals_d7.json`);
  console.log(`Approved: ${approved.length}; Questionable: ${questionable.length}; Rejected: ${rejected.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
