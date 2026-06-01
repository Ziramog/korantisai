import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeVenueCategory, type CategoryNormalizationProposal } from './category_normalization';

type PublicApiVenue = {
  id: string;
  name: string;
  category: string;
  location?: string;
  heroImage?: string;
  cardImage?: string;
  imageUrl?: string;
  galleryImages?: Array<{ src?: string; source?: string }>;
};

type ImageVerificationVenue = {
  id: string;
  name: string;
  hero_source?: string;
  card_source?: string;
  image_url_source?: string;
  uses_cloudinary?: boolean;
  uses_fallback?: boolean;
  has_hero_or_card?: boolean;
  gallery_cloudinary_count?: number;
};

type BatchCandidate = {
  candidate_id: string;
  venue_name: string;
  category: string;
  district: string;
  merged_sources?: Array<{ category?: string; context?: string }>;
};

type GoogleRecord = {
  candidate_id: string;
  status: string;
  google_place_id?: string | null;
  google_data?: {
    primaryType?: string | null;
    types?: string[];
  } | null;
  match?: {
    match_confidence?: number;
    match_warnings?: string[];
  } | null;
};

type IntelligenceOutput = {
  venue_name: string;
  candidate_id: string;
  google_place_id?: string | null;
  category: string;
  district: string;
  match_status?: string;
  scores?: Record<string, number>;
  signals?: Record<string, number>;
  intent_scores?: Record<string, number>;
  photo_intelligence?: {
    acceptable_hero_photo?: boolean;
    photo_quality_score?: number;
    evaluation_status?: string;
    warnings?: string[];
  };
  eligibility?: {
    status?: string;
    reasons?: string[];
    warnings?: string[];
  };
};

type ReadyCandidate = {
  venue: string;
  candidate_id: string;
  google_place_id: string | null;
  district: string;
  current_category: string;
  normalized_category: string;
  display_category_en: string;
  display_category_es: string;
  category_confidence: number;
  eligibility_score: number;
  photo_quality_score: number;
  cloudinary_image: boolean;
  already_public: boolean;
  reasons: string[];
};

type NotReadyCandidate = {
  venue: string;
  district: string;
  current_category: string;
  proposed_category: string;
  reasons: string[];
};

type CategoryAuditFile = {
  findings?: Array<{ severity?: string }>;
};

function normalizeText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(process.cwd(), file), 'utf8')) as T;
}

async function loadPublicVenues(): Promise<PublicApiVenue[]> {
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
      const payload = await response.json() as { venues?: PublicApiVenue[] };
      if (payload.venues?.length) return payload.venues;
    } catch {
      // Continue to local file fallback.
    }
  }

  return [];
}

function hasCloudinaryUrl(venue: PublicApiVenue) {
  const urls = [
    venue.heroImage,
    venue.cardImage,
    venue.imageUrl,
    ...(venue.galleryImages || []).map((image) => image.src),
  ].filter(Boolean) as string[];
  return urls.some((url) => url.includes('res.cloudinary.com'));
}

function publicImageMap(publicVenues: PublicApiVenue[], verification: ImageVerificationVenue[]) {
  const map = new Map<string, { cloudinary: boolean; fallback: boolean; hasHeroOrCard: boolean; id?: string }>();

  for (const venue of verification) {
    map.set(normalizeText(venue.name), {
      cloudinary: Boolean(venue.uses_cloudinary),
      fallback: Boolean(venue.uses_fallback),
      hasHeroOrCard: Boolean(venue.has_hero_or_card),
      id: venue.id,
    });
  }

  for (const venue of publicVenues) {
    const cloudinary = hasCloudinaryUrl(venue);
    map.set(normalizeText(venue.name), {
      cloudinary,
      fallback: !cloudinary && [venue.heroImage, venue.cardImage, venue.imageUrl].some((url) => url?.includes('/venue_invernadero.png')),
      hasHeroOrCard: Boolean(venue.heroImage || venue.cardImage || venue.imageUrl),
      id: venue.id,
    });
  }

  return map;
}

function proposalFor(
  output: IntelligenceOutput,
  candidate: BatchCandidate | undefined,
  google: GoogleRecord | undefined,
): CategoryNormalizationProposal {
  return normalizeVenueCategory({
    venue_name: output.venue_name,
    current_category: output.category || candidate?.category || google?.google_data?.primaryType,
    display_category: output.category || candidate?.category,
    google_primary_type: google?.google_data?.primaryType,
    google_types: google?.google_data?.types || [],
    source_categories: candidate?.merged_sources?.map((source) => source.category || '').filter(Boolean) || [candidate?.category || ''].filter(Boolean),
    source_contexts: candidate?.merged_sources?.map((source) => source.context || '').filter(Boolean) || [],
    intent_scores: output.intent_scores,
    signals: output.signals,
  });
}

function readinessReasons(
  output: IntelligenceOutput,
  google: GoogleRecord | undefined,
  category: CategoryNormalizationProposal,
  imageState: { cloudinary: boolean; fallback: boolean; hasHeroOrCard: boolean } | undefined,
) {
  const reasons: string[] = [];

  if (output.eligibility?.status !== 'active') reasons.push(`eligibility is ${output.eligibility?.status || 'missing'}`);
  if ((google?.status || output.match_status) !== 'matched') reasons.push(`match status is ${google?.status || output.match_status || 'missing'}`);
  if (!imageState?.cloudinary) reasons.push('Cloudinary image not found');
  if (imageState?.fallback) reasons.push('uses fallback image');
  if (!imageState?.hasHeroOrCard) reasons.push('missing hero/card image');
  if (!output.photo_intelligence?.acceptable_hero_photo) reasons.push('no acceptable hero photo');
  if (category.confidence < 75) reasons.push(`category confidence below threshold (${category.confidence})`);
  if (category.warnings.length > 0) reasons.push(`category warnings: ${category.warnings.join('; ')}`);
  if (output.eligibility?.status === 'rejected') reasons.push(`hard rejection: ${(output.eligibility.reasons || []).join('; ') || 'unspecified'}`);

  return reasons;
}

function countBy<T>(items: T[], selector: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = selector(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function formatCounts(counts: Record<string, number>) {
  const entries = Object.entries(counts).sort(([keyA, countA], [keyB, countB]) => countB - countA || keyA.localeCompare(keyB));
  return entries.length ? entries.map(([key, count]) => `- ${key}: ${count}`) : ['- None'];
}

function recommendationFor(ready: ReadyCandidate[], notReady: NotReadyCandidate[], categoryAudit: CategoryAuditFile | null) {
  const firstBatchCount = ready.filter((item) => !item.already_public).slice(0, 30).length;
  const categoryBlockingFindings = categoryAudit?.findings?.filter((finding) => finding.severity === 'high' || finding.severity === 'medium').length || 0;

  if (categoryBlockingFindings > 0) return 'B) Fix category normalization first';
  if (ready.length >= 20 && firstBatchCount >= 20) return 'A) Publish 20-30 active venues';
  if (notReady.some((item) => item.reasons.some((reason) => reason.includes('Cloudinary') || reason.includes('fallback')))) return 'C) Repair images first';
  return 'E) Run another batch';
}

function markdown(ready: ReadyCandidate[], notReady: NotReadyCandidate[], categoryAudit: CategoryAuditFile | null) {
  const readyByCategory = countBy(ready, (item) => item.normalized_category);
  const readyByDistrict = countBy(ready, (item) => item.district);
  const notReadyReasons = notReady.reduce<Record<string, number>>((acc, item) => {
    for (const reason of item.reasons) {
      const key = reason.split(':')[0];
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});
  const firstBatch = ready
    .filter((item) => !item.already_public)
    .sort((a, b) => b.eligibility_score - a.eligibility_score || b.category_confidence - a.category_confidence)
    .slice(0, 30);
  const recommendation = recommendationFor(ready, notReady, categoryAudit);
  const categoryBlockingFindings = categoryAudit?.findings?.filter((finding) => finding.severity === 'high' || finding.severity === 'medium').length || 0;

  return [
    '# Publish-Ready Candidates Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total publish-ready: ${ready.length}`,
    `- New publish-ready candidates not already public: ${firstBatch.length}`,
    `- Not ready: ${notReady.length}`,
    `- Category normalization medium/high findings: ${categoryBlockingFindings}`,
    `- Recommendation: ${recommendation}`,
    '',
    '## Publish-Ready By Category',
    '',
    ...formatCounts(readyByCategory),
    '',
    '## Publish-Ready By District',
    '',
    ...formatCounts(readyByDistrict),
    '',
    '## Not-Ready Reasons',
    '',
    ...formatCounts(notReadyReasons),
    '',
    '## Suggested First Publish Batch',
    '',
    ...(firstBatch.length ? firstBatch.map((item, index) => `${index + 1}. ${item.venue} - ${item.normalized_category} - ${item.district} - eligibility ${item.eligibility_score}`) : ['- None. Current controlled batch lacks enough non-public candidates that pass active + matched + Cloudinary + hero + category-confidence gates.']),
    '',
    '## Venues To Exclude',
    '',
    ...notReady
      .filter((item) => item.reasons.some((reason) => reason.includes('rejected') || reason.includes('no acceptable hero') || reason.includes('match status')))
      .map((item) => `- ${item.venue}: ${item.reasons.join('; ')}`)
      .slice(0, 80),
    '',
    '## Venues Needing Manual Repair',
    '',
    ...notReady
      .filter((item) => item.reasons.some((reason) => reason.includes('Cloudinary') || reason.includes('fallback') || reason.includes('category')))
      .map((item) => `- ${item.venue}: ${item.reasons.join('; ')}`)
      .slice(0, 80),
  ].join('\n');
}

async function main() {
  const [publicVenues, verificationFile, candidatesFile, googleFile, intelligenceFile] = await Promise.all([
    loadPublicVenues(),
    readJson<{ venues: ImageVerificationVenue[] }>('data/api_cloudinary_cutover_verification.json'),
    readJson<{ candidates: BatchCandidate[] }>('data/controlled_batch_50_candidates.json'),
    readJson<{ records: GoogleRecord[] }>('data/controlled_batch_50_google_enrichment_repaired.json'),
    readJson<{ outputs: IntelligenceOutput[] }>('data/controlled_batch_50_f4_intelligence.json'),
  ]);
  const categoryAudit = await readJson<CategoryAuditFile>('data/category_normalization_audit.json').catch(() => null);

  const imageByName = publicImageMap(publicVenues, verificationFile.venues);
  const publicNames = new Set(publicVenues.map((venue) => normalizeText(venue.name)));
  const candidatesById = new Map(candidatesFile.candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const googleById = new Map(googleFile.records.map((record) => [record.candidate_id, record]));
  const ready: ReadyCandidate[] = [];
  const notReady: NotReadyCandidate[] = [];

  for (const output of intelligenceFile.outputs) {
    const candidate = candidatesById.get(output.candidate_id);
    const google = googleById.get(output.candidate_id);
    const category = proposalFor(output, candidate, google);
    const normalizedName = normalizeText(output.venue_name);
    const imageState = imageByName.get(normalizedName);
    const reasons = readinessReasons(output, google, category, imageState);

    if (reasons.length === 0) {
      ready.push({
        venue: output.venue_name,
        candidate_id: output.candidate_id,
        google_place_id: output.google_place_id || google?.google_place_id || null,
        district: output.district,
        current_category: output.category,
        normalized_category: category.proposed_normalized_category,
        display_category_en: category.proposed_display_category_en,
        display_category_es: category.proposed_display_category_es,
        category_confidence: category.confidence,
        eligibility_score: output.scores?.eligibility_score || 0,
        photo_quality_score: output.photo_intelligence?.photo_quality_score || 0,
        cloudinary_image: Boolean(imageState?.cloudinary),
        already_public: publicNames.has(normalizedName),
        reasons: ['active', 'matched', 'Cloudinary image', 'acceptable hero', 'trusted category'],
      });
    } else {
      notReady.push({
        venue: output.venue_name,
        district: output.district,
        current_category: output.category,
        proposed_category: category.proposed_normalized_category,
        reasons,
      });
    }
  }

  const payload = {
    generated_at: new Date().toISOString(),
    summary: {
      total_publish_ready: ready.length,
      total_not_ready: notReady.length,
      suggested_first_batch_count: ready.filter((item) => !item.already_public).slice(0, 30).length,
      recommendation: recommendationFor(ready, notReady, categoryAudit),
    },
    ready,
    not_ready: notReady,
  };

  await mkdir(path.join(process.cwd(), 'data'), { recursive: true });
  await writeFile('data/publish_ready_candidates.json', JSON.stringify(payload, null, 2), 'utf8');
  await writeFile('data/publish_ready_candidates_report.md', `${markdown(ready, notReady, categoryAudit)}\n`, 'utf8');
  console.log(`Publish-ready: ${ready.length}`);
  console.log(`Not ready: ${notReady.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
