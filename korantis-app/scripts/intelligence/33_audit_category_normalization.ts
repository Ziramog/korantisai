import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeVenueCategory, type CategoryNormalizationInput, type CategoryNormalizationProposal } from './category_normalization';

type PublicVenue = {
  id: string;
  name: string;
  category: string;
  location?: string;
  tags?: string[];
  atmosphere?: string;
  quality?: number;
};

type BatchCandidate = {
  candidate_id: string;
  venue_name: string;
  category: string;
  district: string;
  merged_sources?: Array<{ category?: string; context?: string; source?: string }>;
  discovery_score?: number;
};

type GoogleRecord = {
  candidate_id: string;
  candidate_name: string;
  category: string;
  district: string;
  status: string;
  google_place_id?: string | null;
  google_data?: {
    primaryType?: string | null;
    types?: string[];
    displayName?: { text?: string };
    formattedAddress?: string;
  } | null;
  match?: {
    match_confidence?: number;
    match_warnings?: string[];
    match_reasons?: string[];
  } | null;
};

type IntelligenceOutput = {
  venue_name: string;
  candidate_id: string;
  category: string;
  district: string;
  match_status?: string;
  scores?: Record<string, number>;
  signals?: Record<string, number>;
  intent_scores?: Record<string, number>;
  eligibility?: { status?: string; reasons?: string[]; warnings?: string[] };
};

type AuditFinding = {
  venue: string;
  source: 'public_venues' | 'controlled_batch';
  current_category: string;
  proposed_normalized_category: string;
  severity: 'high' | 'medium' | 'low';
  issue_codes: string[];
  reasons: string[];
  warnings: string[];
  confidence: number;
};

function normalizeText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(process.cwd(), file), 'utf8')) as T;
}

async function loadPublicVenues(): Promise<{ source: string; venues: PublicVenue[] }> {
  const bases = [
    process.env.API_BASE_URL,
    'http://localhost:3000',
    'https://korantis-app.vercel.app',
  ].filter(Boolean) as string[];

  for (const base of bases) {
    try {
      const response = await fetch(`${base.replace(/\/$/, '')}/api/venues`, {
        headers: { accept: 'application/json' },
      });
      if (!response.ok) continue;
      const payload = await response.json() as { venues?: PublicVenue[] };
      if (payload.venues?.length) {
        return { source: `${base}/api/venues`, venues: payload.venues };
      }
    } catch {
      // Continue to the next source.
    }
  }

  return { source: 'unavailable', venues: [] };
}

function severity(issueCodes: string[], confidence: number): AuditFinding['severity'] {
  if (issueCodes.some((code) => code.includes('restaurant_misclassified_as_bar')) || confidence < 65) return 'high';
  if (issueCodes.length >= 2) return 'medium';
  return 'low';
}

function issueCodes(input: CategoryNormalizationInput, proposal: CategoryNormalizationProposal) {
  const codes: string[] = [];
  const name = normalizeText(input.venue_name);
  const current = normalizeText(input.current_category);
  const google = normalizeText([input.google_primary_type, ...(input.google_types || [])].join(' '));
  const sources = normalizeText([...(input.source_categories || []), ...(input.source_contexts || [])].join(' '));

  if (name.includes(' bar') && current.includes('restaurant')) codes.push('name_contains_bar_but_category_restaurant');
  if (includesAny(google, ['bar', 'night_club']) && current.includes('restaurant')) codes.push('google_bar_type_but_category_restaurant');
  if (includesAny(google, ['cocktail', 'bar', 'night_club']) && proposal.proposed_normalized_category === 'restaurant') codes.push('restaurant_misclassified_as_bar_risk');
  if (sources.includes('wine_bar') && proposal.proposed_normalized_category !== 'wine_bar') codes.push('source_wine_bar_divergence');
  if (sources.includes('cocktail_bar') && proposal.proposed_normalized_category !== 'cocktail_bar') codes.push('source_cocktail_bar_divergence');
  if (['restaurant', 'bar', 'cafe'].includes(current)) codes.push('generic_category');
  if (!current.includes(proposal.proposed_normalized_category.replace('_', ' ')) && current !== proposal.proposed_normalized_category) codes.push('display_normalized_divergence');

  return Array.from(new Set(codes));
}

function publicInput(venue: PublicVenue): CategoryNormalizationInput {
  return {
    venue_name: venue.name,
    current_category: venue.category,
    display_category: venue.category,
    source_categories: [],
    source_contexts: [venue.atmosphere || '', ...(venue.tags || [])],
    intent_scores: {},
    signals: { quality: Math.round((venue.quality || 0) * 100) },
  };
}

function batchInput(candidate: BatchCandidate | undefined, google: GoogleRecord | undefined, intelligence: IntelligenceOutput): CategoryNormalizationInput {
  return {
    venue_name: intelligence.venue_name,
    current_category: intelligence.category || candidate?.category || google?.category,
    display_category: intelligence.category || candidate?.category || google?.category,
    google_primary_type: google?.google_data?.primaryType,
    google_types: google?.google_data?.types || [],
    source_categories: candidate?.merged_sources?.map((source) => source.category || '').filter(Boolean) || [candidate?.category || ''].filter(Boolean),
    source_contexts: candidate?.merged_sources?.map((source) => source.context || '').filter(Boolean) || [],
    intent_scores: intelligence.intent_scores,
    signals: intelligence.signals,
  };
}

function finding(source: AuditFinding['source'], input: CategoryNormalizationInput, proposal: CategoryNormalizationProposal): AuditFinding | null {
  const codes = issueCodes(input, proposal);
  if (codes.length === 0 && proposal.warnings.length === 0 && normalizeText(input.current_category) === proposal.proposed_normalized_category) {
    return null;
  }

  return {
    venue: input.venue_name,
    source,
    current_category: input.current_category || 'unknown',
    proposed_normalized_category: proposal.proposed_normalized_category,
    severity: severity(codes, proposal.confidence),
    issue_codes: codes,
    reasons: proposal.reasons,
    warnings: proposal.warnings,
    confidence: proposal.confidence,
  };
}

function duplicateCategories(venues: PublicVenue[], outputs: IntelligenceOutput[]) {
  const counts = new Map<string, number>();
  for (const category of [...venues.map((venue) => venue.category), ...outputs.map((output) => output.category)]) {
    const key = normalizeText(category);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([category, count]) => category && count > 1)
    .sort(([, a], [, b]) => b - a)
    .map(([category, count]) => ({ category, count }));
}

function proposalsMarkdown(proposals: CategoryNormalizationProposal[]) {
  return [
    '# Category Normalization Proposals',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Venue | Current | Proposed | Display EN | Display ES | Confidence | Reasons |',
    '| --- | --- | --- | --- | --- | ---: | --- |',
    ...proposals.map((proposal) => (
      `| ${proposal.venue.replace(/\|/g, '\\|')} | ${proposal.current_category} | ${proposal.proposed_normalized_category} | ${proposal.proposed_display_category_en} | ${proposal.proposed_display_category_es} | ${proposal.confidence} | ${proposal.reasons.join('; ') || proposal.warnings.join('; ')} |`
    )),
  ].join('\n');
}

function auditMarkdown(source: string, findings: AuditFinding[], duplicates: Array<{ category: string; count: number }>) {
  const high = findings.filter((finding) => finding.severity === 'high');
  const medium = findings.filter((finding) => finding.severity === 'medium');
  const low = findings.filter((finding) => finding.severity === 'low');

  return [
    '# Category Normalization Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Public venue source: ${source}`,
    '',
    '## Summary',
    '',
    `- Total findings: ${findings.length}`,
    `- High severity: ${high.length}`,
    `- Medium severity: ${medium.length}`,
    `- Low severity: ${low.length}`,
    `- Duplicate/generic category names: ${duplicates.length}`,
    '',
    '## High Severity Findings',
    '',
    ...(high.length ? high.map((item) => `- ${item.venue}: ${item.current_category} -> ${item.proposed_normalized_category} (${item.issue_codes.join(', ')})`) : ['- None']),
    '',
    '## Medium Severity Findings',
    '',
    ...(medium.length ? medium.map((item) => `- ${item.venue}: ${item.current_category} -> ${item.proposed_normalized_category} (${item.issue_codes.join(', ')})`) : ['- None']),
    '',
    '## Duplicate / Generic Category Names',
    '',
    ...(duplicates.length ? duplicates.slice(0, 30).map((item) => `- ${item.category}: ${item.count}`) : ['- None']),
    '',
    '## All Findings',
    '',
    '| Venue | Source | Current | Proposed | Severity | Confidence | Issues |',
    '| --- | --- | --- | --- | --- | ---: | --- |',
    ...findings.map((item) => `| ${item.venue.replace(/\|/g, '\\|')} | ${item.source} | ${item.current_category} | ${item.proposed_normalized_category} | ${item.severity} | ${item.confidence} | ${item.issue_codes.join(', ')} |`),
  ].join('\n');
}

async function main() {
  const [{ source, venues }, candidatesFile, googleFile, intelligenceFile] = await Promise.all([
    loadPublicVenues(),
    readJson<{ candidates: BatchCandidate[] }>('data/controlled_batch_50_candidates.json'),
    readJson<{ records: GoogleRecord[] }>('data/controlled_batch_50_google_enrichment_repaired.json'),
    readJson<{ outputs: IntelligenceOutput[] }>('data/controlled_batch_50_f4_intelligence.json'),
  ]);

  const candidatesById = new Map(candidatesFile.candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const googleById = new Map(googleFile.records.map((record) => [record.candidate_id, record]));
  const findings: AuditFinding[] = [];
  const proposalMap = new Map<string, CategoryNormalizationProposal>();

  for (const venue of venues) {
    const input = publicInput(venue);
    const proposal = normalizeVenueCategory(input);
    proposalMap.set(`public:${venue.name}`, proposal);
    const item = finding('public_venues', input, proposal);
    if (item) findings.push(item);
  }

  for (const output of intelligenceFile.outputs) {
    const input = batchInput(candidatesById.get(output.candidate_id), googleById.get(output.candidate_id), output);
    const proposal = normalizeVenueCategory(input);
    proposalMap.set(`batch:${output.venue_name}`, proposal);
    const item = finding('controlled_batch', input, proposal);
    if (item) findings.push(item);
  }

  const proposals = [...proposalMap.values()]
    .filter((proposal) => normalizeText(proposal.current_category) !== proposal.proposed_normalized_category || proposal.confidence < 75 || proposal.warnings.length > 0)
    .sort((a, b) => b.confidence - a.confidence || a.venue.localeCompare(b.venue));
  const duplicates = duplicateCategories(venues, intelligenceFile.outputs);
  const payload = {
    generated_at: new Date().toISOString(),
    public_venue_source: source,
    summary: {
      public_venues: venues.length,
      controlled_batch_outputs: intelligenceFile.outputs.length,
      findings: findings.length,
      proposals: proposals.length,
    },
    duplicate_categories: duplicates,
    findings,
  };

  await mkdir(path.join(process.cwd(), 'data'), { recursive: true });
  await writeFile('data/category_normalization_audit.json', JSON.stringify(payload, null, 2), 'utf8');
  await writeFile('data/category_normalization_audit.md', `${auditMarkdown(source, findings, duplicates)}\n`, 'utf8');
  await writeFile('data/category_normalization_proposals.json', JSON.stringify({ generated_at: new Date().toISOString(), proposals }, null, 2), 'utf8');
  await writeFile('data/category_normalization_proposals.md', `${proposalsMarkdown(proposals)}\n`, 'utf8');
  console.log(`Category audit findings: ${findings.length}`);
  console.log(`Category proposals: ${proposals.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

