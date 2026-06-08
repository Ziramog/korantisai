import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadLocalEnv } from './01_extract_data';
import { searchGooglePlacesText, type GooglePlacesTextCandidate } from '../utils/google_places';

export type EditorialBatchType = 'cafes' | 'bars' | 'restaurants' | 'mixed';
type EditorialSourceKind = 'prestige_guide' | 'local_editorial' | 'coffee_editorial' | 'bar_editorial' | 'city_guide';
export type EditorialVerificationStatus = 'confirmed' | 'not_found' | 'verification_unavailable' | 'fetch_failed' | 'non_html';

interface EditorialSourceTarget {
  source_id: string;
  source_name: string;
  kind: EditorialSourceKind;
  cities: string[];
  batch_types: EditorialBatchType[];
  source_url: string;
  authority_weight: number;
  query_templates: string[];
}

export interface EditorialSourceQuery {
  source_id: string;
  source_name: string;
  source_kind: EditorialSourceKind;
  source_url: string;
  authority_weight: number;
  city: string;
  neighborhood: string;
  batch_type: EditorialBatchType;
  text_query: string;
}

export interface EditorialSourceCandidate {
  venue_name: string;
  normalized_name: string;
  city: string;
  neighborhood: string;
  source_id: string;
  source_name: string;
  source_kind: EditorialSourceKind;
  source_url: string;
  text_query: string;
  authority_weight: number;
  source_confidence: number;
  source_authority: number;
  verification_status: EditorialVerificationStatus;
  verified_source_url?: string;
  source_urls_checked: string[];
  matched_text_snippet?: string;
  match_confidence: number;
  confirmed_editorial_mentions: Array<{
    source_id: string;
    source_name: string;
    source_kind: EditorialSourceKind;
    source_url: string;
    matched_text_snippet: string;
    match_confidence: number;
    source_authority: number;
  }>;
  place: GooglePlacesTextCandidate;
  signals: string[];
  warnings: string[];
}

export interface EditorialSourceEnrichmentResult {
  batch_id: string;
  generated_at: string;
  city: string;
  neighborhoods: string[];
  batch_type: EditorialBatchType;
  mode: 'url_verification';
  caveat: string;
  queries_run: number;
  candidates_found: number;
  unique_candidates: number;
  confirmed_editorial_mentions: number;
  source_query_candidates: number;
  verification_failed: number;
  sources_used: Array<{
    source_id: string;
    source_name: string;
    source_kind: EditorialSourceKind;
    source_url: string;
    authority_weight: number;
  }>;
  candidates: EditorialSourceCandidate[];
  warnings: string[];
  next_step: string;
}

interface EditorialSourceOptions {
  city: string;
  neighborhoods: string[];
  batchType: EditorialBatchType;
  maxSourceQueries?: number;
}

const SOURCE_QUERY_CAVEAT = 'Source-query discovery is a prestige-weighted candidate signal, not proof that the source published this exact venue. Confirmed editorial mentions require a future URL-level source verification pass.';
const URL_VERIFICATION_CAVEAT = 'Confirmed means the normalized venue name appeared in visible HTML fetched from a real source/search URL. It does not prove a ranking, award, or recommendation unless the saved snippet explicitly says so.';
const USER_AGENT = 'KorantisEditorialVerifier/1.0';
const FETCH_TIMEOUT_MS = 9000;

const EDITORIAL_SOURCE_TARGETS: EditorialSourceTarget[] = [
  {
    source_id: 'michelin',
    source_name: 'Michelin Guide',
    kind: 'prestige_guide',
    cities: ['buenos aires', 'new york city', 'new york', 'dubai'],
    batch_types: ['restaurants', 'bars', 'mixed'],
    source_url: 'https://guide.michelin.com/',
    authority_weight: 1,
    query_templates: [
      'Michelin Guide {type_phrase} in {neighborhood} {city}',
      'Michelin recommended {type_phrase} {neighborhood} {city}',
    ],
  },
  {
    source_id: 'fifty_best_discovery',
    source_name: '50 Best Discovery',
    kind: 'prestige_guide',
    cities: ['buenos aires', 'new york city', 'new york', 'dubai'],
    batch_types: ['restaurants', 'bars', 'mixed'],
    source_url: 'https://www.theworlds50best.com/discovery/',
    authority_weight: 0.95,
    query_templates: [
      '50 Best Discovery {type_phrase} in {neighborhood} {city}',
      'Worlds 50 Best {type_phrase} {neighborhood} {city}',
    ],
  },
  {
    source_id: 'eater',
    source_name: 'Eater',
    kind: 'local_editorial',
    cities: ['new york city', 'new york'],
    batch_types: ['restaurants', 'bars', 'cafes', 'mixed'],
    source_url: 'https://ny.eater.com/',
    authority_weight: 0.85,
    query_templates: [
      'Eater best {type_phrase} in {neighborhood} {city}',
      'Eater essential {type_phrase} {neighborhood} {city}',
    ],
  },
  {
    source_id: 'infatuation',
    source_name: 'The Infatuation',
    kind: 'local_editorial',
    cities: ['new york city', 'new york'],
    batch_types: ['restaurants', 'bars', 'cafes', 'mixed'],
    source_url: 'https://www.theinfatuation.com/new-york',
    authority_weight: 0.85,
    query_templates: [
      'The Infatuation best {type_phrase} in {neighborhood} {city}',
      'Infatuation {type_phrase} {neighborhood} {city}',
    ],
  },
  {
    source_id: 'nymag_grubstreet',
    source_name: 'NYMag / Grub Street',
    kind: 'local_editorial',
    cities: ['new york city', 'new york'],
    batch_types: ['restaurants', 'bars', 'cafes', 'mixed'],
    source_url: 'https://www.grubstreet.com/',
    authority_weight: 0.78,
    query_templates: [
      'Grub Street best {type_phrase} in {neighborhood} {city}',
      'New York Magazine {type_phrase} {neighborhood} {city}',
    ],
  },
  {
    source_id: 'sprudge',
    source_name: 'Sprudge',
    kind: 'coffee_editorial',
    cities: ['new york city', 'new york'],
    batch_types: ['cafes', 'mixed'],
    source_url: 'https://sprudge.com/',
    authority_weight: 0.75,
    query_templates: [
      'Sprudge coffee {neighborhood} {city}',
      'Sprudge best coffee shops {neighborhood} {city}',
    ],
  },
  {
    source_id: 'timeout_ba',
    source_name: 'Time Out Buenos Aires',
    kind: 'city_guide',
    cities: ['buenos aires'],
    batch_types: ['restaurants', 'bars', 'cafes', 'mixed'],
    source_url: 'https://www.timeout.com/buenos-aires',
    authority_weight: 0.72,
    query_templates: [
      'Time Out Buenos Aires best {type_phrase} in {neighborhood}',
      'Time Out {type_phrase} {neighborhood} Buenos Aires',
    ],
  },
  {
    source_id: 'lanacion_gastronomia',
    source_name: 'La Nacion Gastronomia',
    kind: 'local_editorial',
    cities: ['buenos aires'],
    batch_types: ['restaurants', 'bars', 'cafes', 'mixed'],
    source_url: 'https://www.lanacion.com.ar/',
    authority_weight: 0.7,
    query_templates: [
      'La Nacion gastronomia {type_phrase} {neighborhood} Buenos Aires',
      'La Nacion mejores {type_phrase} {neighborhood}',
    ],
  },
  {
    source_id: 'infobae_gastronomia',
    source_name: 'Infobae Gastronomia',
    kind: 'local_editorial',
    cities: ['buenos aires'],
    batch_types: ['restaurants', 'bars', 'cafes', 'mixed'],
    source_url: 'https://www.infobae.com/',
    authority_weight: 0.68,
    query_templates: [
      'Infobae gastronomia {type_phrase} {neighborhood} Buenos Aires',
      'Infobae mejores {type_phrase} Buenos Aires {neighborhood}',
    ],
  },
  {
    source_id: 'timeout_dubai',
    source_name: 'Time Out Dubai',
    kind: 'city_guide',
    cities: ['dubai'],
    batch_types: ['restaurants', 'bars', 'cafes', 'mixed'],
    source_url: 'https://www.timeoutdubai.com/',
    authority_weight: 0.76,
    query_templates: [
      'Time Out Dubai best {type_phrase} in {neighborhood}',
      'Time Out Dubai {type_phrase} {neighborhood}',
    ],
  },
  {
    source_id: 'whats_on_dubai',
    source_name: "What's On Dubai",
    kind: 'local_editorial',
    cities: ['dubai'],
    batch_types: ['restaurants', 'bars', 'cafes', 'mixed'],
    source_url: 'https://whatson.ae/dubai/',
    authority_weight: 0.72,
    query_templates: [
      "What's On Dubai best {type_phrase} in {neighborhood}",
      "What's On Dubai {type_phrase} {neighborhood}",
    ],
  },
  {
    source_id: 'gault_millau_uae',
    source_name: 'Gault&Millau UAE',
    kind: 'prestige_guide',
    cities: ['dubai'],
    batch_types: ['restaurants', 'mixed'],
    source_url: 'https://www.gaultmillauae.com/',
    authority_weight: 0.86,
    query_templates: [
      'Gault Millau UAE {type_phrase} Dubai {neighborhood}',
      'Gault&Millau Dubai {type_phrase} {neighborhood}',
    ],
  },
];

export async function runEditorialSourceEnrichment(batchId: string, options: EditorialSourceOptions): Promise<EditorialSourceEnrichmentResult> {
  loadLocalEnv();
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchId);
  mkdirSync(outputDir, { recursive: true });
  const result = await discoverEditorialSourceCandidates(batchId, options);
  writeFileSync(path.join(outputDir, 'stage_00b_editorial_source_enrichment.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_00b_editorial_source_enrichment_report.md'), buildReport(result), 'utf8');
  console.log(`Stage 00B editorial source enrichment JSON written to ${path.join(outputDir, 'stage_00b_editorial_source_enrichment.json')}`);
  console.log(`Stage 00B editorial source enrichment report written to ${path.join(outputDir, 'stage_00b_editorial_source_enrichment_report.md')}`);
  console.log(`Stage 00B summary: queries=${result.queries_run}, candidates=${result.candidates_found}, unique=${result.unique_candidates}`);
  return result;
}

export async function discoverEditorialSourceCandidates(batchId: string, options: EditorialSourceOptions): Promise<EditorialSourceEnrichmentResult> {
  loadLocalEnv();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const queries = buildEditorialSourceQueries(options).slice(0, options.maxSourceQueries);
  const warnings: string[] = [];
  const candidates: EditorialSourceCandidate[] = [];

  if (!apiKey) {
    warnings.push('missing_google_places_api_key_editorial_source_queries_skipped');
  } else {
    for (const query of queries) {
      const result = await searchGooglePlacesText(query.text_query, {
        apiKey,
        city: options.city,
        languageCode: 'en',
        regionCode: regionCodeForCity(options.city),
        maxResultCount: 8,
      });
      if (result.error) {
        warnings.push(`query_failed:${query.source_id}:${result.error}`);
        continue;
      }
      for (const place of result.candidates) {
        candidates.push({
          venue_name: place.name,
          normalized_name: normalizeName(place.name),
          city: options.city,
          neighborhood: query.neighborhood,
          source_id: query.source_id,
          source_name: query.source_name,
          source_kind: query.source_kind,
          source_url: query.source_url,
          text_query: query.text_query,
          authority_weight: query.authority_weight,
          source_confidence: computeSourceConfidence(query, place),
          source_authority: query.authority_weight,
          verification_status: 'verification_unavailable',
          source_urls_checked: [],
          match_confidence: 0,
          confirmed_editorial_mentions: [],
          place,
          signals: buildSignals(query),
          warnings: [SOURCE_QUERY_CAVEAT],
        });
      }
    }
  }

  const uniqueCandidates = await verifyCandidates(dedupeCandidates(candidates));
  const sourcesUsed = dedupeSources(queries.map((query) => ({
    source_id: query.source_id,
    source_name: query.source_name,
    source_kind: query.source_kind,
    source_url: query.source_url,
    authority_weight: query.authority_weight,
  })));

  return {
    batch_id: batchId,
    generated_at: new Date().toISOString(),
    city: options.city,
    neighborhoods: options.neighborhoods,
    batch_type: options.batchType,
    mode: 'url_verification',
    caveat: URL_VERIFICATION_CAVEAT,
    queries_run: apiKey ? queries.length : 0,
    candidates_found: candidates.length,
    unique_candidates: uniqueCandidates.length,
    confirmed_editorial_mentions: uniqueCandidates.reduce((sum, candidate) => sum + candidate.confirmed_editorial_mentions.length, 0),
    source_query_candidates: uniqueCandidates.length,
    verification_failed: uniqueCandidates.filter((candidate) => candidate.verification_status === 'fetch_failed' || candidate.verification_status === 'non_html' || candidate.verification_status === 'verification_unavailable').length,
    sources_used: sourcesUsed,
    candidates: uniqueCandidates,
    warnings,
    next_step: `npx tsx pipeline/stages/00_build_venue_seed.ts ${batchId} --count <N> --city "${options.city}" --neighborhoods "${options.neighborhoods.join(',')}" --type-mix "<mix>" --continue`,
  };
}

export function buildEditorialSourceQueries(options: EditorialSourceOptions): EditorialSourceQuery[] {
  const cityKey = normalizeName(options.city);
  const typePhrase = typePhraseForBatchType(options.batchType);
  const targets = EDITORIAL_SOURCE_TARGETS.filter((target) =>
    target.cities.some((city) => cityKey.includes(city) || normalizeName(city).includes(cityKey)) &&
    target.batch_types.includes(options.batchType),
  );

  const queries: EditorialSourceQuery[] = [];
  for (const neighborhood of options.neighborhoods) {
    for (const target of targets) {
      for (const template of target.query_templates) {
        queries.push({
          source_id: target.source_id,
          source_name: target.source_name,
          source_kind: target.kind,
          source_url: target.source_url,
          authority_weight: target.authority_weight,
          city: options.city,
          neighborhood,
          batch_type: options.batchType,
          text_query: template
            .replace(/\{type_phrase\}/g, typePhrase)
            .replace(/\{neighborhood\}/g, neighborhood)
            .replace(/\{city\}/g, options.city),
        });
      }
    }
  }
  return queries;
}

function dedupeCandidates(candidates: EditorialSourceCandidate[]): EditorialSourceCandidate[] {
  const byKey = new Map<string, EditorialSourceCandidate>();
  for (const candidate of candidates) {
    const key = candidate.place.place_id || `${candidate.normalized_name}|${normalizeName(candidate.neighborhood)}|${normalizeName(candidate.city)}`;
    const current = byKey.get(key);
    if (!current || candidate.source_confidence > current.source_confidence) {
      byKey.set(key, candidate);
      continue;
    }
    current.signals = [...new Set([...current.signals, ...candidate.signals])];
    current.warnings = [...new Set([...current.warnings, ...candidate.warnings])];
  }
  return [...byKey.values()].sort((a, b) => b.source_confidence - a.source_confidence);
}

function dedupeSources<T extends { source_id: string }>(sources: T[]): T[] {
  const byId = new Map<string, T>();
  for (const source of sources) byId.set(source.source_id, source);
  return [...byId.values()];
}

function computeSourceConfidence(query: EditorialSourceQuery, place: GooglePlacesTextCandidate): number {
  let score = query.authority_weight * 0.55;
  if (place.rating && place.rating >= 4.3) score += 0.12;
  if (place.user_ratings_total && place.user_ratings_total >= 80) score += 0.1;
  if (place.photos.length > 0) score += 0.08;
  if (place.website_url) score += 0.08;
  if (query.source_kind === 'prestige_guide') score += 0.05;
  return Number(Math.min(0.95, score).toFixed(2));
}

function buildSignals(query: EditorialSourceQuery): string[] {
  return [
    'editorial_source_query',
    `editorial_source:${query.source_id}`,
    `editorial_kind:${query.source_kind}`,
    query.source_kind === 'prestige_guide' ? 'prestige_source_query' : '',
  ].filter(Boolean);
}

async function verifyCandidates(candidates: EditorialSourceCandidate[]): Promise<EditorialSourceCandidate[]> {
  const verified: EditorialSourceCandidate[] = [];
  for (const candidate of candidates) {
    verified.push(await verifyCandidate(candidate));
  }
  return verified.sort((a, b) =>
    b.confirmed_editorial_mentions.length - a.confirmed_editorial_mentions.length ||
    b.source_confidence - a.source_confidence,
  );
}

async function verifyCandidate(candidate: EditorialSourceCandidate): Promise<EditorialSourceCandidate> {
  const urls = buildVerificationUrls(candidate);
  const checked: string[] = [];
  const failedStatuses: EditorialVerificationStatus[] = [];

  for (const url of urls) {
    checked.push(url);
    const fetched = await fetchVisibleSourceText(url);
    if (fetched.status !== 'confirmed') {
      failedStatuses.push(fetched.status);
      continue;
    }

    const verificationPages = isSearchVerificationUrl(url)
      ? extractLikelyResultUrls(fetched.html, fetched.finalUrl || url, candidate).slice(0, 4)
      : [fetched.finalUrl || url];

    if (verificationPages.length === 0) {
      failedStatuses.push('not_found');
      continue;
    }

    for (const verificationPage of verificationPages) {
      if (checked.includes(verificationPage)) continue;
      checked.push(verificationPage);
      const page = isSearchVerificationUrl(url) ? await fetchVisibleSourceText(verificationPage) : fetched;
      if (page.status !== 'confirmed') {
        failedStatuses.push(page.status);
        continue;
      }
      const match = matchVenueInText(candidate.venue_name, page.visibleText);
      if (!match) {
        failedStatuses.push('not_found');
        continue;
      }

      const mention = {
        source_id: candidate.source_id,
        source_name: candidate.source_name,
        source_kind: candidate.source_kind,
        source_url: page.finalUrl || verificationPage,
        matched_text_snippet: match.snippet,
        match_confidence: match.confidence,
        source_authority: candidate.authority_weight,
      };
      return {
        ...candidate,
        source_url: mention.source_url,
        verified_source_url: mention.source_url,
        source_urls_checked: checked,
        verification_status: 'confirmed',
        matched_text_snippet: mention.matched_text_snippet,
        match_confidence: mention.match_confidence,
        source_authority: mention.source_authority,
        source_confidence: Number(Math.min(0.98, candidate.source_confidence + 0.12 + mention.match_confidence * 0.08).toFixed(2)),
        confirmed_editorial_mentions: [mention],
        signals: [...new Set([...candidate.signals, `editorial_confirmed:${candidate.source_id}`, 'editorial_mention_confirmed'])],
        warnings: candidate.warnings.filter((warning) => warning !== SOURCE_QUERY_CAVEAT),
      };
    }
  }

  return {
    ...candidate,
    source_urls_checked: checked,
    verification_status: summarizeFailedStatus(failedStatuses),
    warnings: [...new Set([...candidate.warnings, `editorial_verification_${summarizeFailedStatus(failedStatuses)}`])],
  };
}

function buildVerificationUrls(candidate: EditorialSourceCandidate): string[] {
  const query = encodeURIComponent(`${candidate.venue_name} ${candidate.city}`);
  const shortQuery = encodeURIComponent(candidate.venue_name);
  const urls: string[] = [];

  if (candidate.source_id === 'michelin') urls.push(`https://guide.michelin.com/en/search?q=${query}`);
  if (candidate.source_id === 'fifty_best_discovery') urls.push(`https://www.theworlds50best.com/search/?q=${query}`);
  if (candidate.source_id === 'eater') urls.push(`https://ny.eater.com/search?q=${query}`);
  if (candidate.source_id === 'infatuation') urls.push(`https://www.theinfatuation.com/search?query=${query}`);
  if (candidate.source_id === 'nymag_grubstreet') urls.push(`https://www.grubstreet.com/search.html?q=${query}`);
  if (candidate.source_id === 'sprudge') urls.push(`https://sprudge.com/?s=${shortQuery}`);
  if (candidate.source_id === 'timeout_ba') urls.push(`https://www.timeout.com/search?q=${query}`);
  if (candidate.source_id === 'lanacion_gastronomia') urls.push(`https://www.lanacion.com.ar/buscador/?query=${query}`);
  if (candidate.source_id === 'infobae_gastronomia') urls.push(`https://www.infobae.com/search/${query}/`);
  if (candidate.source_id === 'timeout_dubai') urls.push(`https://www.timeoutdubai.com/search?q=${query}`);
  if (candidate.source_id === 'whats_on_dubai') urls.push(`https://whatson.ae/dubai/search/${query}/`);
  if (candidate.source_id === 'gault_millau_uae') urls.push(`https://www.gaultmillauae.com/search?query=${query}`);

  return [...new Set(urls)].slice(0, 3);
}

async function fetchVisibleSourceText(url: string): Promise<{
  status: EditorialVerificationStatus | 'confirmed';
  visibleText: string;
  finalUrl?: string;
  html: string;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': USER_AGENT,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) return { status: 'fetch_failed', visibleText: '', finalUrl: response.url, html: '' };
    if (!contentType.toLowerCase().includes('text/html')) return { status: 'non_html', visibleText: '', finalUrl: response.url, html: '' };
    const html = await response.text();
    const visibleText = extractVisibleText(html);
    return visibleText ? { status: 'confirmed', visibleText, finalUrl: response.url, html } : { status: 'verification_unavailable', visibleText: '', finalUrl: response.url, html };
  } catch {
    return { status: 'fetch_failed', visibleText: '', html: '' };
  }
}

function isSearchVerificationUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return normalized.includes('/search') || normalized.includes('?q=') || normalized.includes('?query=') || normalized.includes('/buscador/') || normalized.includes('/search/');
}

function extractLikelyResultUrls(html: string, baseUrl: string, candidate: EditorialSourceCandidate): string[] {
  const links: Array<{ url: string; score: number }> = [];
  const base = new URL(baseUrl);
  const variants = buildNameVariants(candidate.venue_name);
  const sourceHost = normalizeHost(base.hostname);
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const rawHref = match[1] || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) continue;

    let url: URL;
    try {
      url = new URL(rawHref, baseUrl);
    } catch {
      continue;
    }

    if (!['http:', 'https:'].includes(url.protocol)) continue;
    if (normalizeHost(url.hostname) !== sourceHost) continue;
    if (isSearchVerificationUrl(url.href)) continue;
    if (/\.(jpg|jpeg|png|webp|gif|svg|pdf|zip)(\?|$)/i.test(url.pathname)) continue;

    const anchorText = extractVisibleText(match[2] || '');
    const normalizedAnchor = normalizeName(anchorText);
    const normalizedHref = normalizeName(`${url.pathname} ${url.searchParams.toString()}`);
    const hasNameMatch = variants.some((variant) => variant.length >= 4 && (normalizedAnchor.includes(variant) || normalizedHref.includes(variant)));
    const sourcePathSignal = /restaurant|bar|cafe|coffee|food|dining|review|guide|best|eat|drink|venue|discovery|restaurants/i.test(url.pathname);
    const score = (hasNameMatch ? 4 : 0) + (sourcePathSignal ? 1 : 0) + Math.min(anchorText.length / 180, 1);
    if (score < 1) continue;

    links.push({ url: url.href.split('#')[0], score });
  }

  return [...new Map(links.sort((a, b) => b.score - a.score).map((link) => [link.url, link.url])).values()].slice(0, 8);
}

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

function extractVisibleText(html: string): string {
  return cleanText(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"'));
}

function matchVenueInText(venueName: string, visibleText: string): { snippet: string; confidence: number } | null {
  const normalizedText = normalizeName(visibleText);
  const variants = buildNameVariants(venueName);
  for (const variant of variants) {
    const tokenCount = variant.split(' ').filter(Boolean).length;
    if (!variant || variant.length < 4 || (tokenCount === 1 && variant.length < 8)) continue;
    if (normalizedText.includes(variant)) {
      return {
        snippet: extractMatchedSnippet(visibleText, variant),
        confidence: variant === normalizeName(venueName) ? 0.95 : 0.82,
      };
    }
  }
  return null;
}

function buildNameVariants(name: string): string[] {
  const base = normalizeName(name);
  const withoutBranch = normalizeName(name.split(/\s[-|]\s|,|\(/)[0] || name);
  const withoutVenueWords = base
    .replace(/\b(coffee|cafe|cafes|restaurant|bar|bistro|bakery|specialty|speciality|roasters?|house|lounge|dubai|nyc|new york|buenos aires)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return [
    ...new Set(
      [base, withoutBranch, withoutVenueWords].filter((item) => {
        const tokenCount = item.split(' ').filter(Boolean).length;
        return tokenCount >= 2 || item.length >= 8;
      }),
    ),
  ];
}

function extractMatchedSnippet(visibleText: string, normalizedVariant: string): string {
  const sentences = visibleText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => cleanText(item))
    .filter(Boolean);
  const match = sentences.find((sentence) => {
    const normalizedSentence = normalizeName(sentence);
    return normalizedSentence.includes(normalizedVariant);
  });
  return truncate(match || visibleText, 240);
}

function summarizeFailedStatus(statuses: EditorialVerificationStatus[]): EditorialVerificationStatus {
  if (statuses.includes('not_found')) return 'not_found';
  if (statuses.includes('non_html')) return 'non_html';
  if (statuses.includes('fetch_failed')) return 'fetch_failed';
  return 'verification_unavailable';
}

function buildReport(result: EditorialSourceEnrichmentResult): string {
  return [
    '# Stage 00B Editorial Source Enrichment Report',
    '',
    `- Batch: ${result.batch_id}`,
    `- Generated: ${result.generated_at}`,
    `- City: ${result.city}`,
    `- Batch type: ${result.batch_type}`,
    `- Neighborhoods: ${result.neighborhoods.join(', ')}`,
    `- Mode: ${result.mode}`,
    `- Queries run: ${result.queries_run}`,
    `- Candidates found: ${result.candidates_found}`,
    `- Unique candidates: ${result.unique_candidates}`,
    `- Confirmed editorial mentions: ${result.confirmed_editorial_mentions}`,
    `- Source-query candidates: ${result.source_query_candidates}`,
    `- Verification failed/unavailable: ${result.verification_failed}`,
    `- Caveat: ${result.caveat}`,
    '',
    '## Sources Used',
    '',
    ...result.sources_used.map((source) => `- ${source.source_name} (${source.source_kind}, weight ${source.authority_weight}): ${source.source_url}`),
    '',
    '## Confirmed Mentions',
    '',
    '| Venue | Neighborhood | Source | Match | URL | Evidence |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...result.candidates
      .filter((candidate) => candidate.verification_status === 'confirmed')
      .slice(0, 120)
      .map((candidate) =>
        `| ${escapeTable(candidate.venue_name)} | ${escapeTable(candidate.neighborhood)} | ${escapeTable(candidate.source_name)} | ${candidate.match_confidence.toFixed(2)} | ${escapeTable(candidate.verified_source_url || candidate.source_url)} | ${escapeTable(candidate.matched_text_snippet || '')} |`,
      ),
    ...(result.candidates.some((candidate) => candidate.verification_status === 'confirmed') ? [] : ['| none |  |  |  |  |  |']),
    '',
    '## Top Source-Query Candidates',
    '',
    '| Venue | Neighborhood | Source | Status | Confidence | Query |',
    '| --- | --- | --- | --- | ---: | --- |',
    ...result.candidates.slice(0, 120).map((candidate) =>
      `| ${escapeTable(candidate.venue_name)} | ${escapeTable(candidate.neighborhood)} | ${escapeTable(candidate.source_name)} | ${candidate.verification_status} | ${candidate.source_confidence} | ${escapeTable(candidate.text_query)} |`,
    ),
    '',
    '## Warnings',
    '',
    ...(result.warnings.length > 0 ? result.warnings.map((warning) => `- ${warning}`) : ['- none']),
    '',
    '## Next Step',
    '',
    'Run Stage 00. Stage 00 now consumes this file automatically when it exists for the same batch.',
    '',
    '```powershell',
    result.next_step,
    '```',
  ].join('\n') + '\n';
}

function typePhraseForBatchType(type: EditorialBatchType): string {
  if (type === 'cafes') return 'cafes coffee shops';
  if (type === 'bars') return 'bars cocktail bars wine bars';
  if (type === 'restaurants') return 'restaurants';
  return 'restaurants bars cafes';
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function regionCodeForCity(city: string): string {
  const normalized = normalizeName(city);
  if (normalized.includes('new york') || normalized.includes('nyc') || normalized.includes('united states')) return 'US';
  if (normalized.includes('buenos aires') || normalized.includes('argentina')) return 'AR';
  if (normalized.includes('dubai') || normalized.includes('united arab emirates') || normalized.includes('uae')) return 'AE';
  return 'US';
}

function parseBatchType(value?: string): EditorialBatchType {
  const normalized = normalizeName(value || '');
  if (normalized.includes('cafe') || normalized.includes('coffee')) return 'cafes';
  if (normalized.includes('bar') || normalized.includes('cocktail') || normalized.includes('wine')) return 'bars';
  if (normalized.includes('restaurant')) return 'restaurants';
  return 'mixed';
}

function parseList(value?: string): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function truncate(value: string, maxLength: number): string {
  const cleaned = cleanText(value);
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1).trim()}…` : cleaned;
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchId = process.argv[2];
  if (!batchId) {
    console.error('Usage: npx tsx pipeline/stages/00b_editorial_source_enrichment.ts <batch_id> --city "New York City" --neighborhoods "Williamsburg,DUMBO" --type cafes [--max-source-queries 40]');
    process.exitCode = 1;
  } else {
    const args = process.argv.slice(3);
    const city = valueAfter(args, '--city') || 'Buenos Aires';
    const neighborhoods = parseList(valueAfter(args, '--neighborhoods'));
    const batchType = parseBatchType(valueAfter(args, '--type') || valueAfter(args, '--batch-type'));
    if (neighborhoods.length === 0) {
      console.error('Stage 00B failed: --neighborhoods is required.');
      process.exitCode = 1;
    } else {
      runEditorialSourceEnrichment(batchId, {
        city,
        neighborhoods,
        batchType,
        maxSourceQueries: valueAfter(args, '--max-source-queries') ? Number(valueAfter(args, '--max-source-queries')) : undefined,
      }).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Stage 00B editorial source enrichment failed: ${message}`);
        process.exitCode = 1;
      });
    }
  }
}
