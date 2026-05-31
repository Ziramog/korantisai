import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { PHASE_A_PLACE_IDS } from './phase_a_ids';

type StagingVenue = {
  id: string;
  name: string;
  category_seed: string;
  status: string;
  canonical_data: Record<string, unknown> | null;
  atmosphere_prose: string | null;
};

type QualityScore = {
  venue_id: string;
  has_prose: boolean | null;
  has_embeddings: boolean | null;
  atmosphere_word_count: number | null;
  interpretation_notes: string | null;
};

type PhotoScore = {
  hero_candidate: boolean;
  card_candidate: boolean;
  interior_visible: boolean;
  seating_visible: boolean;
  people_staying_visible: boolean;
  storefront_only: boolean;
  product_only: boolean;
  menu_only: boolean;
  atmosphere_score: number;
  rationale?: string;
};

type PhotoScoreResult = {
  id: string;
  venue_id: string;
  score?: PhotoScore;
  error?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
  auth: { persistSession: false },
});

const ATMOSPHERE_SIGNALS = [
  'ambience',
  'ambiance',
  'atmosphere',
  'vibe',
  'quiet',
  'cozy',
  'romantic',
  'elegant',
  'hidden',
  'lively',
  'work',
  'date',
  'friends',
  'brunch',
  'dinner',
  'wine',
  'music',
  'terrace',
  'patio',
  'garden',
  'view',
  'interior',
  'decor',
  'seating',
  'sit',
  'mesa',
  'ambiente',
  'tranquilo',
  'comodo',
  'terraza',
  'jardin',
  'musica',
];

const TAKEAWAY_SIGNALS = [
  'takeaway',
  'take away',
  'to go',
  'coffee-to-go',
  'coffee to go',
  'grab and go',
  'kiosk',
  'counter only',
  'retail',
  'beans',
  'product shop',
  'bakery counter',
  'delivery',
];

const STORE_TYPES = new Set([
  'store',
  'food_store',
  'grocery_store',
  'market',
  'bakery',
  'meal_takeaway',
  'convenience_store',
]);

const HOSPITALITY_TYPES = new Set([
  'restaurant',
  'cafe',
  'coffee_shop',
  'bar',
  'wine_bar',
  'brunch_restaurant',
  'fine_dining_restaurant',
]);

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function selectedIds() {
  if (hasFlag('phase-a')) return [...PHASE_A_PLACE_IDS];
  const ids = getArgValue('ids');
  return ids ? ids.split(',').map((id) => id.trim()).filter(Boolean) : [];
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function countSignals(text: string, signals: string[]) {
  const normalized = normalize(text);
  return signals.filter((signal) => normalized.includes(normalize(signal))).length;
}

function scoreFromRatio(value: number, max: number) {
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function canonicalTypes(canonicalData: Record<string, unknown> | null) {
  const types = canonicalData?.types;
  return Array.isArray(types) ? types.filter((type): type is string => typeof type === 'string') : [];
}

function hasCanonicalNumber(canonicalData: Record<string, unknown> | null, field: string) {
  return typeof canonicalData?.[field] === 'number';
}

function parseNotes(notes: string | null) {
  if (!notes) return {};
  try {
    return JSON.parse(notes) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function loadPhotoScores() {
  const file = path.join('data', 'phase_a_photo_scores.json');
  if (!existsSync(file)) return new Map<string, PhotoScore[]>();
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as { results?: PhotoScoreResult[] };
  const byVenue = new Map<string, PhotoScore[]>();

  for (const result of parsed.results || []) {
    if (!result.score) continue;
    const rows = byVenue.get(result.venue_id) || [];
    rows.push(result.score);
    byVenue.set(result.venue_id, rows);
  }

  return byVenue;
}

function bestHeroScore(photoScores: PhotoScore[]) {
  return photoScores
    .filter((score) => score.hero_candidate && !score.product_only && !score.menu_only && !score.storefront_only)
    .sort((a, b) => b.atmosphere_score - a.atmosphere_score)[0] || null;
}

function qualityFromPhotos(photoScores: PhotoScore[]) {
  if (photoScores.length === 0) {
    return {
      photo_quality_score: 0,
      seatingFromPhotos: 0,
      atmosphereFromPhotos: 0,
      acceptableHero: false,
      photoWarnings: ['missing_photo_scores'],
    };
  }

  const best = Math.max(...photoScores.map((score) => score.atmosphere_score || 0));
  const seatingVisible = photoScores.some((score) => score.seating_visible);
  const interiorVisible = photoScores.some((score) => score.interior_visible);
  const peopleStaying = photoScores.some((score) => score.people_staying_visible);
  const acceptableHero = Boolean(bestHeroScore(photoScores));
  const productOnlyCount = photoScores.filter((score) => score.product_only || score.menu_only).length;
  const storefrontOnlyCount = photoScores.filter((score) => score.storefront_only).length;
  const warnings: string[] = [];

  if (!acceptableHero) warnings.push('no_acceptable_hero_photo');
  if (!seatingVisible) warnings.push('no_visible_seating');
  if (!interiorVisible) warnings.push('no_interior_visible');
  if (productOnlyCount > 0) warnings.push('product_or_menu_photos_present');
  if (storefrontOnlyCount > 0) warnings.push('storefront_only_photos_present');

  return {
    photo_quality_score: Math.round(
      best * 0.55 +
      (interiorVisible ? 15 : 0) +
      (seatingVisible ? 20 : 0) +
      (peopleStaying ? 10 : 0) -
      productOnlyCount * 5 -
      storefrontOnlyCount * 4
    ),
    seatingFromPhotos: seatingVisible ? 80 : 25,
    atmosphereFromPhotos: Math.round(best),
    acceptableHero,
    photoWarnings: warnings,
  };
}

function statusFromEligibility(score: number, hardReject: boolean, pending: boolean) {
  if (hardReject || score < 55) return 'rejected';
  if (pending || score < 75) return 'pending_review';
  return 'ready_for_review';
}

async function main() {
  console.log('Starting Step 6: Quality Check...');

  const ids = selectedIds();
  let query = supabase.from('staging_venues').select('*');

  if (ids.length > 0) {
    query = query.in('id', ids);
  } else {
    query = query.eq('status', 'processing');
  }

  const { data: venues, error: venueError } = await query;
  if (venueError) throw new Error(`Unable to read staging_venues: ${venueError.message}`);
  if (!venues || venues.length === 0) return;

  const photoScoresByVenue = loadPhotoScores();
  const reportRows = [];

  for (const venue of venues as StagingVenue[]) {
    console.log(`Checking quality for ${venue.name}...`);

    const { data: scores } = await supabase
      .from('quality_scores')
      .select('*')
      .eq('venue_id', venue.id)
      .single();

    const quality = scores as QualityScore | null;

    const [{ count: reviewCount, error: reviewError }, { count: embeddingCount }, { data: reviewRows }] = await Promise.all([
      supabase
        .from('venue_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venue.id)
        .neq('text', ''),
      supabase
        .from('venue_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venue.id)
        .eq('layer', 'L3'),
      supabase
        .from('venue_reviews')
        .select('text')
        .eq('venue_id', venue.id)
        .neq('text', ''),
    ]);

    if (reviewError) {
      console.log(`  Could not verify reviews: ${reviewError.message}`);
      continue;
    }

    const reviewText = (reviewRows || []).map((row) => row.text).join('\n');
    const types = canonicalTypes(venue.canonical_data);
    const reviewSignalCount = countSignals(reviewText, ATMOSPHERE_SIGNALS);
    const takeawaySignalCount = countSignals([reviewText, venue.name, types.join(' ')].join(' '), TAKEAWAY_SIGNALS);
    const photoQuality = qualityFromPhotos(photoScoresByVenue.get(venue.id) || []);
    const storeTypeOnly = types.some((type) => STORE_TYPES.has(type)) && !types.some((type) => HOSPITALITY_TYPES.has(type));
    const notes = parseNotes(quality?.interpretation_notes || null);
    const generatedConfidence = typeof notes.confidence === 'number' ? notes.confidence : 0;
    const generatedReviewSignals = stringArray(notes.review_signals);
    const generatedPhotoSignals = stringArray(notes.photo_signals);
    const hasGeneratedEvidence = generatedReviewSignals.length > 0 || generatedPhotoSignals.length > 0;
    const wordCount = quality?.atmosphere_word_count || venue.atmosphere_prose?.split(/\s+/).filter(Boolean).length || 0;

    const review_signal_score = scoreFromRatio(reviewSignalCount, 8);
    const category_fit_score = storeTypeOnly
      ? 15
      : types.some((type) => HOSPITALITY_TYPES.has(type))
        ? 85
        : ['cafe', 'restaurant', 'wine_bar', 'cocktail_bar'].includes(venue.category_seed)
          ? 65
          : 45;
    const seating_confidence = Math.max(
      photoQuality.seatingFromPhotos,
      scoreFromRatio(countSignals(reviewText, ['seat', 'sit', 'table', 'mesa', 'chair', 'interior', 'patio', 'terrace']), 5)
    );
    const hospitality_confidence = Math.max(0, category_fit_score - takeawaySignalCount * 12);
    const atmosphere_confidence = Math.max(
      0,
      Math.round(review_signal_score * 0.55 + photoQuality.atmosphereFromPhotos * 0.35 + generatedConfidence * 0.1 - takeawaySignalCount * 8)
    );
    const photo_quality_score = Math.max(0, Math.min(100, photoQuality.photo_quality_score));
    const generatedAtmosphereSpeculative = Boolean(
      venue.atmosphere_prose && (
        generatedConfidence < 45 ||
        (!hasGeneratedEvidence && reviewSignalCount === 0 && photoQuality.atmosphereFromPhotos < 50)
      )
    );
    const eligibility_score = Math.max(0, Math.min(100, Math.round(
      seating_confidence * 0.2 +
      hospitality_confidence * 0.2 +
      atmosphere_confidence * 0.25 +
      photo_quality_score * 0.2 +
      review_signal_score * 0.1 +
      category_fit_score * 0.05
    )));

    const warning_notes = [
      ...photoQuality.photoWarnings,
      takeawaySignalCount > 0 ? 'takeaway_or_product_signal' : '',
      reviewSignalCount === 0 ? 'no_atmosphere_signal' : '',
      seating_confidence < 55 ? 'weak_seating_signal' : '',
      atmosphere_confidence < 70 ? 'weak_atmosphere_signal' : '',
      generatedAtmosphereSpeculative ? 'speculative_atmosphere' : '',
      wordCount > 70 ? 'prose_too_long' : '',
      !hasCanonicalNumber(venue.canonical_data, 'rating') ? 'missing_rating' : '',
      !hasCanonicalNumber(venue.canonical_data, 'userRatingCount') ? 'missing_userRatingCount' : '',
    ].filter(Boolean);

    const hardReject = Boolean(
      storeTypeOnly ||
      !photoQuality.acceptableHero ||
      hospitality_confidence < 45 ||
      atmosphere_confidence < 35 ||
      generatedAtmosphereSpeculative ||
      takeawaySignalCount >= 3
    );
    const pending = Boolean(
      photo_quality_score < 70 ||
      seating_confidence < 65 ||
      atmosphere_confidence < 70 ||
      wordCount > 70
    );
    const rejection_reason = hardReject
      ? storeTypeOnly
        ? 'store_or_retail_category'
        : !photoQuality.acceptableHero
          ? 'no_acceptable_hero_photo'
          : hospitality_confidence < 45
            ? 'no_hospitality_signal'
            : atmosphere_confidence < 35
              ? 'no_atmosphere_signal'
              : generatedAtmosphereSpeculative
                ? 'speculative_atmosphere'
                : 'takeaway_or_product_first'
      : null;
    const nextStatus = statusFromEligibility(eligibility_score, hardReject, pending);

    await supabase.from('quality_scores').upsert({
      venue_id: venue.id,
      review_count: reviewCount || 0,
      has_images: photoQuality.acceptableHero,
      has_prose: Boolean(venue.atmosphere_prose && wordCount <= 70),
      has_embeddings: Boolean(embeddingCount && embeddingCount > 0),
      atmosphere_word_count: wordCount,
      interpretation_notes: JSON.stringify({
        ...(notes || {}),
        seating_confidence,
        hospitality_confidence,
        atmosphere_confidence,
        photo_quality_score,
        review_signal_score,
        category_fit_score,
        eligibility_score,
        rejection_reason,
        warning_notes,
      }),
      last_processed_at: new Date().toISOString(),
    }, { onConflict: 'venue_id' });

    await supabase.from('staging_venues').update({ status: nextStatus }).eq('id', venue.id);

    reportRows.push({
      id: venue.id,
      name: venue.name,
      previous_status: venue.status,
      status: nextStatus,
      seating_confidence,
      hospitality_confidence,
      atmosphere_confidence,
      photo_quality_score,
      review_signal_score,
      category_fit_score,
      eligibility_score,
      rejection_reason,
      warning_notes,
      word_count: wordCount,
      has_reviews: Boolean(reviewCount && reviewCount > 0),
      has_l3_embedding: Boolean(embeddingCount && embeddingCount > 0),
      has_acceptable_hero_photo: photoQuality.acceptableHero,
      has_rating: hasCanonicalNumber(venue.canonical_data, 'rating'),
      has_userRatingCount: hasCanonicalNumber(venue.canonical_data, 'userRatingCount'),
    });

    console.log(`  ${nextStatus}: eligibility=${eligibility_score}, atmosphere=${atmosphere_confidence}, hero=${photoQuality.acceptableHero}`);
  }

  writeFileSync(path.join('data', 'phase_a_quality_check.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    ids,
    rows: reportRows,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
