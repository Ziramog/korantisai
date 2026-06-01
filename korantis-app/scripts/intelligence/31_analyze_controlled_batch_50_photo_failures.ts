import * as path from 'path';
import { writeFileSync } from 'fs';
import {
  type BatchGoogleRecord,
  type PhotoVisionResult,
  type VenueVisionResult,
  readJson,
} from './controlled_batch_utils';

type VisionFile = { venues: VenueVisionResult[] };
type EnrichmentFile = { records: BatchGoogleRecord[] };

function percent(results: PhotoVisionResult[], selector: (photo: PhotoVisionResult) => boolean): number {
  return results.length ? Math.round((results.filter(selector).length / results.length) * 100) : 0;
}

function maxScore(results: PhotoVisionResult[], selector: (photo: PhotoVisionResult) => number): number {
  return results.length ? Math.max(...results.map(selector)) : 0;
}

function failureType(venue: VenueVisionResult, google?: BatchGoogleRecord): string[] {
  const results = venue.photo_results;
  const types = new Set<string>();
  const productDominance = percent(results, (photo) => photo.product_only || photo.menu_only);
  const storefrontDominance = percent(results, (photo) => photo.storefront_only && !photo.interior_visible);
  const hasNearHero = results.some((photo) => photo.hero_suitability_score >= 60 && photo.atmosphere_score >= 55 && !photo.product_only && !photo.menu_only);
  const hasWrongMatchRisk = google?.match?.match_warnings?.some((warning) => warning.includes('name mismatch') || warning.includes('category')) || google?.status !== 'matched';

  if (hasWrongMatchRisk) types.add('wrong Google match');
  if (productDominance >= 50) types.add('product/menu/storefront dominance');
  if (storefrontDominance >= 40) types.add('product/menu/storefront dominance');
  if (hasNearHero) types.add('too strict hero threshold');
  if (maxScore(results, (photo) => photo.hero_suitability_score) < 60) types.add('poor Google photo set');
  if (!hasNearHero && productDominance < 50 && storefrontDominance < 40) types.add('true visual rejection');
  if (types.size === 0) types.add('needs alternative photo source');
  if (productDominance >= 50 || storefrontDominance >= 40 || maxScore(results, (photo) => photo.hero_suitability_score) < 65) types.add('needs alternative photo source');
  return [...types];
}

function main() {
  const vision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_photo_vision.json'));
  const google = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_google_enrichment.json'));
  const googleById = new Map(google.records.map((record) => [record.candidate_id, record]));
  const failures = vision.venues.filter((venue) => !venue.aggregation.acceptable_hero_photo).map((venue) => {
    const productMenuShare = percent(venue.photo_results, (photo) => photo.product_only || photo.menu_only);
    const storefrontOnlyShare = percent(venue.photo_results, (photo) => photo.storefront_only && !photo.interior_visible);
    const interiorShare = percent(venue.photo_results, (photo) => photo.interior_visible);
    const seatingShare = percent(venue.photo_results, (photo) => photo.seating_visible);
    return {
      candidate_id: venue.candidate_id,
      venue_name: venue.venue_name,
      google_place_id: venue.google_place_id,
      photo_count: venue.photos_evaluated,
      warnings: venue.aggregation.warnings,
      max_hero_score: maxScore(venue.photo_results, (photo) => photo.hero_suitability_score),
      max_atmosphere_score: maxScore(venue.photo_results, (photo) => photo.atmosphere_score),
      product_menu_share: productMenuShare,
      storefront_only_share: storefrontOnlyShare,
      interior_share: interiorShare,
      seating_share: seatingShare,
      failure_type: failureType(venue, googleById.get(venue.candidate_id)),
      recommendation: productMenuShare >= 50 || storefrontOnlyShare >= 40 ? 'needs alternative photo source' : 'manual photo review before override',
    };
  });

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_photo_failure_analysis.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    failures,
  }, null, 2));

  const report = [
    '# Controlled Batch 50 Photo Failure Analysis',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Failed hero venues: ${failures.length}`,
    '',
    ...failures.map((failure) => [
      `## ${failure.venue_name}`,
      '',
      `- Photo count: ${failure.photo_count}`,
      `- Max hero score: ${failure.max_hero_score}`,
      `- Max atmosphere score: ${failure.max_atmosphere_score}`,
      `- Product/menu share: ${failure.product_menu_share}%`,
      `- Storefront-only share: ${failure.storefront_only_share}%`,
      `- Interior share: ${failure.interior_share}%`,
      `- Seating share: ${failure.seating_share}%`,
      `- Reason no hero accepted: ${failure.warnings.join('; ') || 'none'}`,
      `- Failure classification: ${failure.failure_type.join(', ')}`,
      `- Recommendation: ${failure.recommendation}`,
      '',
    ].join('\n')),
    '## Note',
    '',
    '- No hero rejection was overridden by this analysis.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_photo_failure_analysis.md'), report);
  console.log(report);
}

main();
