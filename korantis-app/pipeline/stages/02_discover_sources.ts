import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadLocalEnv } from './01_extract_data';
import type { VenueRaw } from '../types';

type SourceKind =
  | 'official_website'
  | 'instagram'
  | 'menu'
  | 'reservation'
  | 'whatsapp'
  | 'contact'
  | 'editorial_press'
  | 'google_maps'
  | 'unknown';

interface DiscoveredSource {
  kind: SourceKind;
  url: string;
  label?: string;
  source_url: string;
  confidence: number;
  evidence_text: string;
}

interface VenueSourceDiscovery {
  venue_name: string;
  place_id?: string;
  google_maps_url?: string;
  official_website_candidate?: DiscoveredSource;
  instagram_candidate?: DiscoveredSource;
  reservation_url_candidate?: DiscoveredSource;
  menu_url_candidate?: DiscoveredSource;
  whatsapp_candidate?: DiscoveredSource;
  contact_candidates: DiscoveredSource[];
  editorial_press_mentions: DiscoveredSource[];
  discovered_sources: DiscoveredSource[];
  source_confidence: number;
  missing_fields: string[];
  next_action: string;
  fetch_status: 'fetched' | 'skipped_no_website' | 'fetch_failed' | 'non_html';
  warnings: string[];
}

interface Stage02Result {
  batch_id: string;
  generated_at: string;
  venues_processed: number;
  websites_attempted: number;
  websites_fetched: number;
  instagram_found: number;
  menu_found: number;
  reservation_found: number;
  whatsapp_found: number;
  editorial_mentions_found: number;
  source_confidence_average: number;
  venues: VenueSourceDiscovery[];
}

const USER_AGENT = 'KorantisSourceDiscovery/1.0';
const FETCH_TIMEOUT_MS = 12000;

export async function runStage02SourceDiscovery(batchName: string): Promise<Stage02Result> {
  loadLocalEnv();

  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const rawVenues = readRawVenues(path.join(outputDir, 'stage_01_raw_venues.json'));
  const venues: VenueSourceDiscovery[] = [];

  for (const venue of rawVenues) {
    venues.push(await discoverVenueSources(venue));
  }

  const result: Stage02Result = {
    batch_id: batchName,
    generated_at: new Date().toISOString(),
    venues_processed: venues.length,
    websites_attempted: venues.filter((venue) => venue.fetch_status !== 'skipped_no_website').length,
    websites_fetched: venues.filter((venue) => venue.fetch_status === 'fetched').length,
    instagram_found: venues.filter((venue) => venue.instagram_candidate).length,
    menu_found: venues.filter((venue) => venue.menu_url_candidate).length,
    reservation_found: venues.filter((venue) => venue.reservation_url_candidate).length,
    whatsapp_found: venues.filter((venue) => venue.whatsapp_candidate).length,
    editorial_mentions_found: venues.reduce((sum, venue) => sum + venue.editorial_press_mentions.length, 0),
    source_confidence_average: average(venues.map((venue) => venue.source_confidence)),
    venues,
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'stage_02_source_discovery.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_02_source_discovery_report.md'), buildStage02Report(result), 'utf8');

  console.log(`Stage 02 source discovery JSON written to ${path.join(outputDir, 'stage_02_source_discovery.json')}`);
  console.log(`Stage 02 source discovery report written to ${path.join(outputDir, 'stage_02_source_discovery_report.md')}`);
  console.log(
    `Stage 02 summary: venues=${result.venues_processed}, websites_fetched=${result.websites_fetched}, instagram=${result.instagram_found}, menu=${result.menu_found}, reservation=${result.reservation_found}`,
  );

  return result;
}

async function discoverVenueSources(venue: VenueRaw): Promise<VenueSourceDiscovery> {
  const discoveredSources: DiscoveredSource[] = [];
  const warnings: string[] = [];
  let fetchStatus: VenueSourceDiscovery['fetch_status'] = 'skipped_no_website';
  let html = '';
  let finalWebsiteUrl = venue.website_url || '';

  const googleMapsSource = venue.google_maps_url
    ? buildSource('google_maps', venue.google_maps_url, venue.google_maps_url, 0.95, 'Google Maps seed URL from Stage 01.')
    : undefined;
  if (googleMapsSource) discoveredSources.push(googleMapsSource);

  if (venue.website_url) {
    const fetchResult = await fetchWebsiteHtml(venue.website_url);
    fetchStatus = fetchResult.status;
    html = fetchResult.html;
    finalWebsiteUrl = fetchResult.finalUrl || venue.website_url;
    if (fetchResult.warning) warnings.push(fetchResult.warning);
  }

  const officialWebsite = venue.website_url
    ? buildSource('official_website', finalWebsiteUrl, venue.website_url, fetchStatus === 'fetched' ? 0.9 : 0.7, 'Official website URL from Google Places seed.')
    : undefined;
  if (officialWebsite) discoveredSources.push(officialWebsite);

  if (html) {
    discoveredSources.push(...extractSourcesFromHtml(html, finalWebsiteUrl, venue.name));
  }

  const deduped = dedupeSources(discoveredSources);
  const instagram = highestConfidence(deduped.filter((source) => source.kind === 'instagram'));
  const reservation = highestConfidence(deduped.filter((source) => source.kind === 'reservation'));
  const menu = highestConfidence(deduped.filter((source) => source.kind === 'menu'));
  const whatsapp = highestConfidence(deduped.filter((source) => source.kind === 'whatsapp'));
  const contactCandidates = deduped.filter((source) => source.kind === 'contact');
  const editorialMentions = deduped.filter((source) => source.kind === 'editorial_press');
  const missingFields = missingSourceFields({ officialWebsite, instagram, reservation, menu, whatsapp, editorialMentions });
  const confidence = computeSourceConfidence({ officialWebsite, instagram, reservation, menu, whatsapp, editorialMentions, fetchStatus });

  return {
    venue_name: venue.name,
    place_id: venue.place_id,
    google_maps_url: venue.google_maps_url,
    official_website_candidate: officialWebsite,
    instagram_candidate: instagram,
    reservation_url_candidate: reservation,
    menu_url_candidate: menu,
    whatsapp_candidate: whatsapp,
    contact_candidates: contactCandidates,
    editorial_press_mentions: editorialMentions,
    discovered_sources: deduped,
    source_confidence: confidence,
    missing_fields: missingFields,
    next_action: nextAction(missingFields, fetchStatus),
    fetch_status: fetchStatus,
    warnings,
  };
}

async function fetchWebsiteHtml(url: string): Promise<{ status: VenueSourceDiscovery['fetch_status']; html: string; finalUrl?: string; warning?: string }> {
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
    if (!response.ok) return { status: 'fetch_failed', html: '', finalUrl: response.url, warning: `website_http_${response.status}` };
    if (!contentType.toLowerCase().includes('text/html')) return { status: 'non_html', html: '', finalUrl: response.url, warning: `website_non_html_${contentType}` };
    return { status: 'fetched', html: await response.text(), finalUrl: response.url };
  } catch (error) {
    return { status: 'fetch_failed', html: '', warning: `website_fetch_failed: ${formatUnknownError(error)}` };
  }
}

function extractSourcesFromHtml(html: string, pageUrl: string, venueName: string): DiscoveredSource[] {
  const sources: DiscoveredSource[] = [];
  const pageTitle = extractTitle(html) || venueName;
  for (const attrs of extractTagAttributes(html, 'a')) {
    const href = attrs.href || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
    const url = resolveUrl(href, pageUrl);
    if (!url || !isHttpUrl(url)) continue;
    const label = cleanText(attrs.title || attrs['aria-label'] || attrs.text || '');
    const evidence = cleanText(`${pageTitle} ${label} ${href}`.trim());
    const kind = classifyLink(url, evidence);
    if (kind === 'unknown') continue;
    sources.push(buildSource(kind, url, pageUrl, confidenceForKind(kind), evidence || `Discovered ${kind} link on official website.`, label));
  }

  for (const attrs of extractTagAttributes(html, 'meta')) {
    const property = (attrs.property || attrs.name || '').toLowerCase();
    const content = attrs.content || '';
    if (property === 'og:site_name' || property === 'description' || property === 'og:description') {
      const evidence = cleanText(content);
      if (evidence) sources.push(buildSource('official_website', pageUrl, pageUrl, 0.75, evidence));
    }
  }

  return sources;
}

function classifyLink(url: string, evidence: string): SourceKind {
  const haystack = foldText(`${url} ${evidence}`);
  if (haystack.includes('instagram.com/')) return 'instagram';
  if (haystack.includes('wa.me/') || haystack.includes('api.whatsapp.com') || haystack.includes('whatsapp')) return 'whatsapp';
  if (containsAny(haystack, ['reserv', 'booking', 'opentable', 'thefork', 'meitre', 'covermanager', 'book'])) return 'reservation';
  if (containsAny(haystack, ['menu', 'carta'])) return 'menu';
  if (containsAny(haystack, ['contact', 'contacto', 'phone', 'tel:', 'ubicacion'])) return 'contact';
  if (containsAny(haystack, ['press', 'prensa', 'media', 'blog', 'review', 'nota', 'article', 'infobae', 'lanacion', 'clarin', 'timeout', 'eater'])) return 'editorial_press';
  return 'unknown';
}

function buildSource(kind: SourceKind, url: string, sourceUrl: string, confidence: number, evidenceText: string, label?: string): DiscoveredSource {
  return {
    kind,
    url,
    label,
    source_url: sourceUrl,
    confidence,
    evidence_text: truncate(cleanText(evidenceText), 280),
  };
}

function missingSourceFields(input: {
  officialWebsite?: DiscoveredSource;
  instagram?: DiscoveredSource;
  reservation?: DiscoveredSource;
  menu?: DiscoveredSource;
  whatsapp?: DiscoveredSource;
  editorialMentions: DiscoveredSource[];
}): string[] {
  const missing: string[] = [];
  if (!input.officialWebsite) missing.push('official_website');
  if (!input.instagram) missing.push('instagram');
  if (!input.reservation) missing.push('reservation_url');
  if (!input.menu) missing.push('menu_url');
  if (!input.whatsapp) missing.push('whatsapp');
  if (input.editorialMentions.length === 0) missing.push('editorial_press_mentions');
  return missing;
}

function computeSourceConfidence(input: {
  officialWebsite?: DiscoveredSource;
  instagram?: DiscoveredSource;
  reservation?: DiscoveredSource;
  menu?: DiscoveredSource;
  whatsapp?: DiscoveredSource;
  editorialMentions: DiscoveredSource[];
  fetchStatus: VenueSourceDiscovery['fetch_status'];
}): number {
  let score = 0.15;
  if (input.officialWebsite) score += 0.25;
  if (input.fetchStatus === 'fetched') score += 0.15;
  if (input.instagram) score += 0.15;
  if (input.reservation) score += 0.1;
  if (input.menu) score += 0.1;
  if (input.whatsapp) score += 0.05;
  if (input.editorialMentions.length > 0) score += 0.1;
  return Math.min(1, Number(score.toFixed(2)));
}

function nextAction(missingFields: string[], fetchStatus: VenueSourceDiscovery['fetch_status']): string {
  if (fetchStatus === 'skipped_no_website') return 'Add or verify official website before multi-source enrichment.';
  if (fetchStatus === 'fetch_failed' || fetchStatus === 'non_html') return 'Manually verify official site or add seed URLs.';
  if (missingFields.includes('instagram') || missingFields.includes('reservation_url') || missingFields.includes('menu_url')) {
    return 'Review website manually or add targeted source discovery for missing official links.';
  }
  return 'Ready for evidence extraction.';
}

function buildStage02Report(result: Stage02Result): string {
  const lines = [
    '# Stage 02 Source Discovery Report',
    '',
    `- Batch: ${result.batch_id}`,
    `- Generated: ${result.generated_at}`,
    `- Venues processed: ${result.venues_processed}`,
    `- Websites attempted: ${result.websites_attempted}`,
    `- Websites fetched: ${result.websites_fetched}`,
    `- Instagram candidates found: ${result.instagram_found}`,
    `- Menu candidates found: ${result.menu_found}`,
    `- Reservation candidates found: ${result.reservation_found}`,
    `- WhatsApp candidates found: ${result.whatsapp_found}`,
    `- Editorial/press mentions found: ${result.editorial_mentions_found}`,
    `- Average source confidence: ${result.source_confidence_average.toFixed(2)}`,
    '',
    '## Venue Results',
    '',
    '| Venue | Website | Instagram | Reservation | Menu | WhatsApp | Editorial | Confidence | Missing | Next Action |',
    '| --- | --- | --- | --- | --- | --- | ---: | ---: | --- | --- |',
  ];

  for (const venue of result.venues) {
    lines.push(`| ${[
      escapeTable(venue.venue_name),
      linkOrNone(venue.official_website_candidate?.url),
      linkOrNone(venue.instagram_candidate?.url),
      linkOrNone(venue.reservation_url_candidate?.url),
      linkOrNone(venue.menu_url_candidate?.url),
      linkOrNone(venue.whatsapp_candidate?.url),
      String(venue.editorial_press_mentions.length),
      venue.source_confidence.toFixed(2),
      escapeTable(venue.missing_fields.join(', ') || 'none'),
      escapeTable(venue.next_action),
    ].join(' | ')} |`);
  }

  lines.push(
    '',
    '## Safety',
    '',
    '- Report-only stage.',
    '- No Supabase writes.',
    '- No Cloudinary uploads.',
    '- No external model calls.',
    '- No consumer UI changes.',
    '- Fetches only Google-seeded official websites and links found on those pages.',
  );

  return `${lines.join('\n')}\n`;
}

function readRawVenues(filePath: string): VenueRaw[] {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error(`Stage 02 input must be a VenueRaw array: ${filePath}`);
  return parsed.filter((entry): entry is VenueRaw => typeof entry === 'object' && entry !== null && 'name' in entry && 'city' in entry);
}

function extractTagAttributes(html: string, tagName: string): Array<Record<string, string>> {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>(.*?)</${tagName}>|<${tagName}\\b([^>]*)>`, 'gis');
  return [...html.matchAll(pattern)].map((match) => ({
    ...parseAttributes(match[1] || match[3] || ''),
    text: cleanText(match[2] || ''),
  }));
}

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of raw.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[3] || match[4] || match[5] || '');
  }
  return attrs;
}

function extractTitle(html: string): string {
  return cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).toString();
  } catch {
    return '';
  }
}

function isHttpUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function highestConfidence(sources: DiscoveredSource[]): DiscoveredSource | undefined {
  return [...sources].sort((a, b) => b.confidence - a.confidence)[0];
}

function dedupeSources(sources: DiscoveredSource[]): DiscoveredSource[] {
  const seen = new Set<string>();
  const deduped: DiscoveredSource[] = [];
  for (const source of sources) {
    const key = `${source.kind}:${normalizeUrl(source.url)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(source);
  }
  return deduped;
}

function confidenceForKind(kind: SourceKind): number {
  if (kind === 'instagram') return 0.85;
  if (kind === 'reservation' || kind === 'menu' || kind === 'whatsapp') return 0.8;
  if (kind === 'editorial_press') return 0.65;
  if (kind === 'contact') return 0.7;
  return 0.6;
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function cleanText(value: string): string {
  return decodeHtml(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function foldText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return value.trim();
  }
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function linkOrNone(value?: string): string {
  return value ? escapeTable(value) : 'none';
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/02_discover_sources.ts <batch_id>');
    process.exitCode = 1;
  } else {
    runStage02SourceDiscovery(batchName).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Stage 02 source discovery failed: ${message}`);
      process.exitCode = 1;
    });
  }
}
