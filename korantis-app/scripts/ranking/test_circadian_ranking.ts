import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MOCK_VENUES, type Venue } from '../../src/app/data/venues';
import {
  applyCircadianMixGuardrail,
  getCircadianCategoryBias,
  getVenueCategoryKind,
  type CircadianDaypart,
} from '../../src/lib/ranking/circadianRanking';

type ApiVenue = Venue & {
  imageUrl?: string;
  galleryImages?: unknown[];
};

type RankedVenue = ApiVenue & {
  scoreFinal: string;
  originalIndex: number;
  baseScore: number;
  circadianBias: number;
};

const DAYPART_HOURS: Record<CircadianDaypart, number> = {
  morning: 9,
  midday: 12.5,
  afternoon: 16,
  golden_hour: 18.5,
  night: 21,
  late_night: 2,
};

const ATMOSPHERE_PEAKS: Record<string, number> = {
  'late-night': 2.5,
  dawn: 6.5,
  morning: 9.5,
  afternoon: 14.5,
  'golden-hour': 18,
  night: 21.5,
};

function circularTimeDistance(h1: number, h2: number) {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 24 - diff);
}

async function loadVenues() {
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/venues`, {
      headers: { accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json() as { venues?: ApiVenue[] };
    if (payload.venues?.length) {
      return {
        source: `${apiBaseUrl}/api/venues`,
        venues: payload.venues,
      };
    }
  } catch (error) {
    console.warn(`Falling back to MOCK_VENUES because /api/venues is unavailable: ${String(error)}`);
  }

  return {
    source: 'MOCK_VENUES fallback',
    venues: MOCK_VENUES as ApiVenue[],
  };
}

function baseRankVenues(venues: ApiVenue[], hour: number) {
  return venues
    .map((venue, originalIndex): RankedVenue => {
      const peakHour = ATMOSPHERE_PEAKS[venue.atmosphere] ?? 14.5;
      const circadianScore = 1 - (circularTimeDistance(hour, peakHour) / 12);
      const qualityScore = venue.quality ?? 0.8;
      const baseScore = (0.4 * circadianScore) + (0.2 * qualityScore) + 0.03;

      return {
        ...venue,
        originalIndex,
        baseScore,
        circadianBias: 0,
        scoreFinal: baseScore.toFixed(3),
      };
    })
    .sort((a, b) => {
      const scoreDiff = Number.parseFloat(b.scoreFinal) - Number.parseFloat(a.scoreFinal);
      return Math.abs(scoreDiff) < 0.0001 ? a.originalIndex - b.originalIndex : scoreDiff;
    });
}

function biasedRankVenues(venues: ApiVenue[], daypart: CircadianDaypart) {
  const hour = DAYPART_HOURS[daypart];
  const ranked = baseRankVenues(venues, hour)
    .map((venue): RankedVenue => {
      const circadianBias = getCircadianCategoryBias(daypart, venue);
      const finalScore = Math.max(0, Math.min(1.2, venue.baseScore + circadianBias));

      return {
        ...venue,
        circadianBias,
        scoreFinal: finalScore.toFixed(3),
      };
    })
    .sort((a, b) => {
      const scoreDiff = Number.parseFloat(b.scoreFinal) - Number.parseFloat(a.scoreFinal);
      return Math.abs(scoreDiff) < 0.0001 ? a.originalIndex - b.originalIndex : scoreDiff;
    });

  return applyCircadianMixGuardrail(ranked, daypart, false);
}

function categoryDistribution(venues: ApiVenue[]) {
  return venues.reduce<Record<string, number>>((counts, venue) => {
    const kind = getVenueCategoryKind(venue);
    counts[kind] = (counts[kind] || 0) + 1;
    return counts;
  }, {});
}

function formatDistribution(venues: ApiVenue[]) {
  const distribution = categoryDistribution(venues);
  return Object.entries(distribution)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kind, count]) => `${kind}: ${count}`)
    .join(', ');
}

function escapeCell(value: string | number) {
  return String(value).replace(/\|/g, '\\|');
}

function formatTop(top: RankedVenue[]) {
  return top.map((venue, index) => (
    `| ${index + 1} | ${escapeCell(venue.name)} | ${escapeCell(venue.category)} | ${getVenueCategoryKind(venue)} | ${venue.scoreFinal} | ${venue.circadianBias.toFixed(3)} |`
  )).join('\n');
}

function cafesDominate(venues: ApiVenue[]) {
  return (categoryDistribution(venues).cafe || 0) > 4;
}

async function main() {
  const { source, venues } = await loadVenues();
  const dayparts: CircadianDaypart[] = ['morning', 'midday', 'afternoon', 'golden_hour', 'night'];
  const lines: string[] = [];
  const generatedAt = new Date().toISOString();

  lines.push('# Circadian Ranking Test Report');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Venue source: ${source}`);
  lines.push(`Venue count: ${venues.length}`);
  lines.push('');
  lines.push('## Root Cause Snapshot');
  lines.push('');
  lines.push('- The previous ranking used venue quality plus atmosphere/time distance, but did not explicitly control category mix.');
  lines.push('- Cafes can rank high at midday when their atmosphere and image/quality scores are strong.');
  lines.push('- The new layer applies a modest presentation-only category bias and a top-10 mix guardrail when there is no explicit user search intent.');
  lines.push('');

  for (const daypart of dayparts) {
    const hour = DAYPART_HOURS[daypart];
    const before = baseRankVenues(venues, hour).slice(0, 10);
    const after = biasedRankVenues(venues, daypart).slice(0, 10);

    lines.push(`## ${daypart}`);
    lines.push('');
    lines.push(`Hour tested: ${hour}`);
    lines.push('');
    lines.push(`Before distribution: ${formatDistribution(before)}`);
    lines.push(`After distribution: ${formatDistribution(after)}`);
    lines.push('');
    lines.push('| Rank | Venue | Category | Kind | Display score | Bias |');
    lines.push('| --- | --- | --- | --- | ---: | ---: |');
    lines.push(formatTop(after));
    lines.push('');
  }

  const middayBefore = baseRankVenues(venues, DAYPART_HOURS.midday).slice(0, 10);
  const middayAfter = biasedRankVenues(venues, 'midday').slice(0, 10);
  const middayAfterDistribution = categoryDistribution(middayAfter);

  lines.push('## Midday Guardrail');
  lines.push('');
  lines.push(`Before top-10 distribution: ${formatDistribution(middayBefore)}`);
  lines.push(`After top-10 distribution: ${formatDistribution(middayAfter)}`);
  lines.push(`Cafes dominated before: ${cafesDominate(middayBefore) ? 'yes' : 'no'}`);
  lines.push(`Cafes dominate after: ${cafesDominate(middayAfter) ? 'yes' : 'no'}`);
  lines.push(`Restaurants appear at lunch: ${(middayAfterDistribution.restaurant || 0) > 0 ? 'yes' : 'no'}`);
  lines.push(`Restaurant share after: ${middayAfterDistribution.restaurant || 0}/10`);
  lines.push('');

  const outputPath = path.join(process.cwd(), 'data', 'circadian_ranking_test_report.md');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Circadian ranking report written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
