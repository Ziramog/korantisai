import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  applyCircadianMixGuardrail,
  getCircadianCategoryBias,
  getCircadianDaypart,
  getVenueCategoryKind,
} from '../../src/lib/ranking/circadianRanking';
import { getLaunchFreshnessDiagnostics } from '../../src/lib/ranking/freshnessRanking';
import { createServiceSupabaseClient } from '../enrichment/supabase_enrichment_utils';
import { APPROVED_PUBLISH_BATCH } from '../publishing/publishing_utils';
import { escapeMd, normalizeName } from '../enrichment/enrichment_utils';

type ApiVenue = {
  id: string;
  name: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  category: string;
  atmosphere: 'morning' | 'afternoon' | 'golden-hour' | 'night' | 'late-night' | 'dawn';
  quality: number;
  tags?: string[];
  tagline?: string;
  narrative?: string;
  heroImage?: string;
  cardImage?: string;
  imageUrl?: string;
  galleryImages?: Array<{ src?: string | null }>;
  images?: Array<{ src?: string | null }>;
  lat: number;
  lng: number;
};

type RankedVenue = ApiVenue & {
  scoreFinal: string;
  originalIndex: number;
  baseScore: number;
  circadianBias: number;
  launchFreshnessBias: number;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const ATMOSPHERE_PEAKS: Record<string, number> = {
  'late-night': 2.5,
  dawn: 6.5,
  morning: 9.5,
  afternoon: 14.5,
  'golden-hour': 18.0,
  night: 21.5,
};

const SCORING_WEIGHTS = {
  circadian: 0.40,
  context: 0.20,
};

function circularTimeDistance(h1: number, h2: number) {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 24 - diff);
}

function hasFallback(venue: ApiVenue) {
  return [venue.heroImage, venue.cardImage, venue.imageUrl, ...(venue.galleryImages || []).map((image) => image.src)]
    .filter(Boolean)
    .some((url) => url?.includes('/venue_invernadero.png'));
}

async function fetchVenues() {
  const apiBaseUrl = (process.env.API_BASE_URL || 'https://korantis-app.vercel.app').replace(/\/$/, '');
  const response = await fetch(`${apiBaseUrl}/api/venues`, {
    headers: {
      accept: 'application/json',
      'cache-control': 'no-cache',
    },
  });
  if (!response.ok) throw new Error(`API failed ${response.status}: ${await response.text()}`);
  const payload = await response.json() as { venues?: ApiVenue[] };
  return {
    apiBaseUrl,
    venues: payload.venues || [],
  };
}

async function augmentCreatedAtFromSupabase(venues: ApiVenue[]) {
  const missingCreatedAt = venues.filter((venue) => !venue.createdAt).length;
  if (missingCreatedAt === 0) return { venues, missingCreatedAt, augmentedFromSupabase: false };

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from('venues')
    .select('id,created_at,updated_at')
    .in('id', venues.map((venue) => venue.id));

  if (error) throw error;

  const byId = new Map((data || []).map((row) => [String(row.id), row as { id: string; created_at: string | null; updated_at: string | null }]));
  return {
    venues: venues.map((venue) => {
      const row = byId.get(venue.id);
      return {
        ...venue,
        createdAt: venue.createdAt || row?.created_at || null,
        updatedAt: venue.updatedAt || row?.updated_at || null,
      };
    }),
    missingCreatedAt,
    augmentedFromSupabase: true,
  };
}

function rankVenues(venues: ApiVenue[], hour: number, useFreshness: boolean, now: Date) {
  const daypart = getCircadianDaypart(hour);
  const scored: RankedVenue[] = venues
    .filter((venue) => venue.lat < 0)
    .map((venue, originalIndex) => {
      const peakHour = ATMOSPHERE_PEAKS[venue.atmosphere];
      const dist = peakHour !== undefined ? circularTimeDistance(hour, peakHour) : 6.0;
      const cScore = 1.0 - (dist / 12.0);
      const xScore = venue.quality;
      const baseScore = (
        SCORING_WEIGHTS.circadian * cScore +
        SCORING_WEIGHTS.context * xScore +
        0.03
      );
      const circadianBias = getCircadianCategoryBias(daypart, venue);
      const launchFreshnessBias = useFreshness ? getLaunchFreshnessDiagnostics(venue, now).bias : 0;
      const finalDisplayScore = Math.max(0, Math.min(1.2, baseScore + circadianBias + launchFreshnessBias));

      return {
        ...venue,
        scoreFinal: finalDisplayScore.toFixed(3),
        baseScore,
        circadianBias,
        launchFreshnessBias,
        originalIndex,
      };
    })
    .sort((a, b) => {
      const diff = Number.parseFloat(b.scoreFinal) - Number.parseFloat(a.scoreFinal);
      return Math.abs(diff) < 0.0001 ? a.originalIndex - b.originalIndex : diff;
    });

  return applyCircadianMixGuardrail(scored, daypart, false)
    .map((venue, index) => ({ ...venue, rank: index + 1 }));
}

function categoryDistribution(ranked: Array<RankedVenue & { rank: number }>, limit: number) {
  return ranked.slice(0, limit).reduce<Record<string, number>>((acc, venue) => {
    const kind = getVenueCategoryKind(venue);
    acc[kind] = (acc[kind] || 0) + 1;
    return acc;
  }, {});
}

function batchCounts(ranked: Array<RankedVenue & { rank: number }>) {
  const approved = new Set(APPROVED_PUBLISH_BATCH.map(normalizeName));
  return {
    top10: ranked.slice(0, 10).filter((venue) => approved.has(normalizeName(venue.name))).length,
    top20: ranked.slice(0, 20).filter((venue) => approved.has(normalizeName(venue.name))).length,
    top30: ranked.slice(0, 30).filter((venue) => approved.has(normalizeName(venue.name))).length,
  };
}

function positions(before: Array<RankedVenue & { rank: number }>, after: Array<RankedVenue & { rank: number }>, now: Date) {
  const beforeByName = new Map(before.map((venue) => [normalizeName(venue.name), venue]));
  const afterByName = new Map(after.map((venue) => [normalizeName(venue.name), venue]));
  return APPROVED_PUBLISH_BATCH.map((name) => {
    const beforeVenue = beforeByName.get(normalizeName(name));
    const afterVenue = afterByName.get(normalizeName(name));
    const freshness = afterVenue ? getLaunchFreshnessDiagnostics(afterVenue, now) : null;
    return {
      venue: name,
      before_rank: beforeVenue?.rank ?? null,
      after_rank: afterVenue?.rank ?? null,
      rank_delta: beforeVenue && afterVenue ? beforeVenue.rank - afterVenue.rank : null,
      before_score: beforeVenue?.scoreFinal ?? null,
      after_score: afterVenue?.scoreFinal ?? null,
      freshness_bias: afterVenue?.launchFreshnessBias ?? 0,
      freshness_status: freshness?.status ?? 'missing',
      age_days: freshness?.ageDays ?? null,
    };
  });
}

function topRows(ranked: Array<RankedVenue & { rank: number }>, limit: number) {
  return ranked.slice(0, limit).map((venue) => ({
    rank: venue.rank,
    venue: venue.name,
    category: venue.category,
    score: venue.scoreFinal,
    freshness_bias: venue.launchFreshnessBias,
  }));
}

function markdown(payload: Awaited<ReturnType<typeof buildReport>>) {
  return [
    '# Launch Freshness Bias Report',
    '',
    `Generated: ${payload.generated_at}`,
    `API base URL: ${payload.api_base_url}`,
    `Ranking hour: ${payload.ranking_hour}`,
    `API missing createdAt before augmentation: ${payload.api_missing_created_at_count}`,
    `CreatedAt augmented from Supabase for test: ${payload.augmented_from_supabase ? 'yes' : 'no'}`,
    '',
    '## Batch Visibility Counts',
    '',
    '| Window | Before | After |',
    '|---|---:|---:|',
    `| Top 10 | ${payload.batch_counts_before.top10} | ${payload.batch_counts_after.top10} |`,
    `| Top 20 | ${payload.batch_counts_before.top20} | ${payload.batch_counts_after.top20} |`,
    `| Top 30 | ${payload.batch_counts_before.top30} | ${payload.batch_counts_after.top30} |`,
    '',
    '## F.8 Positions',
    '',
    '| Venue | Before | After | Delta | Bias | Freshness Status | Age Days |',
    '|---|---:|---:|---:|---:|---|---:|',
    ...payload.f8_positions.map((row) => `| ${escapeMd(row.venue)} | ${row.before_rank ?? ''} | ${row.after_rank ?? ''} | ${row.rank_delta ?? ''} | ${row.freshness_bias.toFixed(3)} | ${row.freshness_status} | ${row.age_days === null ? '' : row.age_days.toFixed(2)} |`),
    '',
    '## Top 30 Before',
    '',
    '| Rank | Venue | Category | Score |',
    '|---:|---|---|---:|',
    ...payload.top_30_before.map((row) => `| ${row.rank} | ${escapeMd(row.venue)} | ${escapeMd(row.category)} | ${row.score} |`),
    '',
    '## Top 30 After',
    '',
    '| Rank | Venue | Category | Score | Freshness |',
    '|---:|---|---|---:|---:|',
    ...payload.top_30_after.map((row) => `| ${row.rank} | ${escapeMd(row.venue)} | ${escapeMd(row.category)} | ${row.score} | ${row.freshness_bias.toFixed(3)} |`),
    '',
    '## Category Distribution',
    '',
    `Before top 20: ${JSON.stringify(payload.category_distribution_before_top20)}`,
    '',
    `After top 20: ${JSON.stringify(payload.category_distribution_after_top20)}`,
    '',
    '## Guardrails',
    '',
    `- Fallback venues boosted: ${payload.fallback_venues_boosted.length ? payload.fallback_venues_boosted.join(', ') : 'none'}`,
    `- Circadian mix still includes night/meal categories in top 20: ${payload.circadian_mix_respected ? 'yes' : 'review'}`,
    '',
    '## Conclusion',
    '',
    payload.conclusion,
  ].join('\n');
}

async function buildReport() {
  const now = new Date();
  const rankingHour = Number(process.env.TEST_HOUR || '18');
  const { apiBaseUrl, venues: apiVenues } = await fetchVenues();
  const augmented = await augmentCreatedAtFromSupabase(apiVenues);
  const before = rankVenues(augmented.venues, rankingHour, false, now);
  const after = rankVenues(augmented.venues, rankingHour, true, now);
  const f8Positions = positions(before, after, now);
  const batchCountsBefore = batchCounts(before);
  const batchCountsAfter = batchCounts(after);
  const fallbackVenuesBoosted = after
    .filter((venue) => venue.launchFreshnessBias > 0 && hasFallback(venue))
    .map((venue) => venue.name);
  const afterTop20Distribution = categoryDistribution(after, 20);
  const circadianMixRespected = (afterTop20Distribution.restaurant || 0) + (afterTop20Distribution.wine_bar || 0) + (afterTop20Distribution.cocktail_bar || 0) + (afterTop20Distribution.bar || 0) >= 8;

  return {
    generated_at: now.toISOString(),
    api_base_url: apiBaseUrl,
    ranking_hour: rankingHour,
    venue_count: augmented.venues.length,
    api_missing_created_at_count: augmented.missingCreatedAt,
    augmented_from_supabase: augmented.augmentedFromSupabase,
    batch_counts_before: batchCountsBefore,
    batch_counts_after: batchCountsAfter,
    f8_positions: f8Positions,
    top_30_before: topRows(before, 30),
    top_30_after: topRows(after, 30),
    category_distribution_before_top20: categoryDistribution(before, 20),
    category_distribution_after_top20: afterTop20Distribution,
    fallback_venues_boosted: fallbackVenuesBoosted,
    circadian_mix_respected: circadianMixRespected,
    conclusion: `Freshness changes F.8 top-20 coverage from ${batchCountsBefore.top20} to ${batchCountsAfter.top20}; top-30 coverage from ${batchCountsBefore.top30} to ${batchCountsAfter.top30}.`,
  };
}

async function main() {
  const payload = await buildReport();
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, 'launch_freshness_bias_report.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(path.join(DATA_DIR, 'launch_freshness_bias_report.md'), `${markdown(payload)}\n`, 'utf8');

  console.log(JSON.stringify({
    before: payload.batch_counts_before,
    after: payload.batch_counts_after,
    missingCreatedAt: payload.api_missing_created_at_count,
    augmentedFromSupabase: payload.augmented_from_supabase,
    fallbackBoosted: payload.fallback_venues_boosted,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

