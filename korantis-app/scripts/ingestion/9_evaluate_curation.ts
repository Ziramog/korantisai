import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

type StagingVenue = {
  id: string;
  name: string;
  city: string;
  category_seed: string;
  status: string;
  canonical_data: Record<string, unknown> | null;
  atmosphere_prose: string | null;
};

type VenueImage = {
  id: string;
  venue_id: string;
  width: number | null;
  height: number | null;
  is_cover: boolean | null;
};

type VenueReview = {
  venue_id: string;
  text: string;
  rating: number | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
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
  'cómodo',
  'comodo',
  'terraza',
  'jardin',
  'música',
  'musica',
];

const PRODUCT_ONLY_SIGNALS = [
  'takeaway',
  'take away',
  'to go',
  'grab and go',
  'beans',
  'packaging',
  'shelves',
  'counter only',
  'kiosk',
  'delivery',
  'product',
  'bakery counter',
  'retail',
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

const TAG_RULES = [
  { tag: 'morning', words: ['morning', 'coffee', 'café', 'cafe', 'desayuno'] },
  { tag: 'quiet', words: ['quiet', 'tranquilo', 'calm', 'reading', 'work'] },
  { tag: 'lively', words: ['lively', 'buzz', 'friends', 'music', 'bar', 'cocktail'] },
  { tag: 'terrace', words: ['terrace', 'patio', 'outdoor', 'vereda', 'terraza'] },
  { tag: 'date', words: ['romantic', 'date', 'intimate', 'wine', 'dinner'] },
  { tag: 'work', words: ['work', 'laptop', 'wifi', 'meeting'] },
  { tag: 'compact', words: ['small', 'compact', 'counter', 'tiny'] },
  { tag: 'destination', words: ['destination', 'view', 'elegant', 'refined'] },
];

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function lower(value: string) {
  return value.toLowerCase();
}

function canonicalTypes(canonicalData: Record<string, unknown> | null) {
  const types = canonicalData?.types;
  return Array.isArray(types) ? types.filter((type): type is string => typeof type === 'string') : [];
}

function canonicalValue(canonicalData: Record<string, unknown> | null, key: string) {
  return canonicalData?.[key] ?? null;
}

function countSignals(text: string, signals: string[]) {
  const haystack = lower(text);
  return signals.filter((signal) => haystack.includes(signal)).length;
}

function scoreFromRatio(value: number, max: number) {
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function deriveTags(evidenceText: string, fallbackCategory: string) {
  const tags = TAG_RULES
    .filter((rule) => rule.words.some((word) => lower(evidenceText).includes(word)))
    .map((rule) => rule.tag);

  if (fallbackCategory === 'cafe' && !tags.includes('coffee')) tags.unshift('coffee');
  if (fallbackCategory === 'wine_bar' && !tags.includes('wine')) tags.unshift('wine');
  if (fallbackCategory === 'cocktail_bar' && !tags.includes('drinks')) tags.unshift('drinks');
  if (fallbackCategory === 'restaurant' && !tags.includes('dinner')) tags.unshift('dinner');

  return [...new Set(tags)].slice(0, 6);
}

function primaryAtmosphere(tags: string[], category: string, score: number) {
  if (score < 55) return category === 'cafe' ? 'Quick Specialty Coffee' : 'Needs Review';
  if (tags.includes('work')) return 'Quiet Work Cafe';
  if (tags.includes('date')) return category.includes('bar') ? 'Low-lit Drinks' : 'Refined Date Night';
  if (tags.includes('terrace')) return 'Lively Terrace';
  if (category === 'cafe') return tags.includes('compact') ? 'Quick Specialty Coffee' : 'Warm Neighborhood Cafe';
  if (category === 'wine_bar') return 'Low-lit Wine Bar';
  if (category === 'cocktail_bar') return 'Cocktail Bar';
  return 'Dinner Spot';
}

function groundedDescription(name: string, primary: string, tags: string[], constraints: string[]) {
  const warning = constraints.length > 0 ? ` Not ideal for ${constraints[0]}.` : '';
  const tagText = tags.slice(0, 3).join(', ').replace(/_/g, ' ');
  return `${name} reads as a ${primary.toLowerCase()} with ${tagText || 'clear hospitality'} signals. Use it when the evidence supports the visit type, not as a generic atmospheric escape.${warning}`;
}

function statusFromScore(score: number, hardReject: boolean) {
  if (hardReject) return 'rejected';
  if (score >= 75) return 'active';
  if (score >= 55) return 'pending_review';
  return 'rejected';
}

async function hasColumn(table: string, column: string) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

async function main() {
  const apply = hasFlag('apply');
  const schemaReady = await hasColumn('staging_venues', 'curation_status');

  const { data: venues, error: venueError } = await supabase
    .from('staging_venues')
    .select('id, name, city, category_seed, status, canonical_data, atmosphere_prose')
    .order('name');

  if (venueError) throw new Error(`Unable to read staging_venues: ${venueError.message}`);

  const venueIds = (venues || []).map((venue) => venue.id);
  const [{ data: reviews }, { data: images }] = await Promise.all([
    supabase.from('venue_reviews').select('venue_id, text, rating').in('venue_id', venueIds),
    supabase.from('venue_images').select('id, venue_id, width, height, is_cover').in('venue_id', venueIds),
  ]);

  const reviewsByVenue = new Map<string, VenueReview[]>();
  for (const review of (reviews || []) as VenueReview[]) {
    const rows = reviewsByVenue.get(review.venue_id) || [];
    rows.push(review);
    reviewsByVenue.set(review.venue_id, rows);
  }

  const imagesByVenue = new Map<string, VenueImage[]>();
  for (const image of (images || []) as VenueImage[]) {
    const rows = imagesByVenue.get(image.venue_id) || [];
    rows.push(image);
    imagesByVenue.set(image.venue_id, rows);
  }

  const results = [];

  for (const venue of (venues || []) as StagingVenue[]) {
    const types = canonicalTypes(venue.canonical_data);
    const joinedReviews = (reviewsByVenue.get(venue.id) || []).map((review) => review.text).join('\n');
    const reviewSignalCount = countSignals(joinedReviews, ATMOSPHERE_SIGNALS);
    const productSignalCount = countSignals(joinedReviews, PRODUCT_ONLY_SIGNALS);
    const venueImages = imagesByVenue.get(venue.id) || [];
    const typeSet = new Set(types);
    const hardReject = types.some((type) => STORE_TYPES.has(type)) && !types.some((type) => HOSPITALITY_TYPES.has(type));

    const review_signal_score = scoreFromRatio(reviewSignalCount, 8);
    const photo_quality_score = scoreFromRatio(venueImages.length, 8);
    const category_fit_score = hardReject
      ? 20
      : types.some((type) => HOSPITALITY_TYPES.has(type)) || ['cafe', 'restaurant', 'wine_bar', 'cocktail_bar'].includes(venue.category_seed)
        ? 85
        : 55;
    const hospitality_confidence = Math.max(category_fit_score - productSignalCount * 10, 0);
    const atmosphere_confidence = Math.max(review_signal_score - productSignalCount * 8, 0);
    const seating_confidence = Math.max(
      scoreFromRatio(countSignals(joinedReviews, ['seat', 'sit', 'table', 'mesa', 'chairs', 'interior', 'patio', 'terrace']), 5),
      typeSet.has('restaurant') || typeSet.has('bar') ? 65 : 35,
    );

    const score = Math.round(
      seating_confidence * 0.22 +
      atmosphere_confidence * 0.24 +
      hospitality_confidence * 0.2 +
      photo_quality_score * 0.16 +
      review_signal_score * 0.12 +
      category_fit_score * 0.06,
    );
    const curation_status = statusFromScore(score, hardReject);
    const rejection_reason = hardReject
      ? `Store-like Google category: ${types.join(', ')}`
      : score < 55
        ? 'Insufficient hospitality or atmosphere evidence'
        : null;
    const evidenceText = [venue.name, venue.category_seed, types.join(' '), joinedReviews, venue.atmosphere_prose || ''].join(' ');
    const tags = deriveTags(evidenceText, venue.category_seed);
    const primary_atmosphere = primaryAtmosphere(tags, venue.category_seed, score);
    const not_ideal_for = productSignalCount > 0 || seating_confidence < 55 ? ['long stay'] : [];
    const best_for = tags.includes('work')
      ? ['work', 'short meeting']
      : venue.category_seed === 'cafe'
        ? ['coffee', seating_confidence >= 65 ? 'short stay' : 'quick coffee']
        : venue.category_seed === 'restaurant'
          ? ['dinner']
          : ['drinks'];

    const evidence = {
      google_category: getText(canonicalValue(venue.canonical_data, 'primaryType')),
      price_level: canonicalValue(venue.canonical_data, 'priceLevel'),
      rating: canonicalValue(venue.canonical_data, 'rating'),
      review_count: (reviewsByVenue.get(venue.id) || []).length,
      photo_observations: [`${venueImages.length} Google photo references available`],
      review_signals: ATMOSPHERE_SIGNALS.filter((signal) => lower(joinedReviews).includes(signal)).slice(0, 12),
      seating_signal: seating_confidence >= 65 ? 'seating likely supported' : 'limited seating evidence',
      stay_duration_signal: seating_confidence >= 75 ? 'short-to-long stay plausible' : 'quick or short stay only',
      atmosphere_tags: tags,
      negative_constraints: not_ideal_for,
      confidence: score,
    };

    const eligibility = {
      score,
      seating_confidence,
      atmosphere_confidence,
      hospitality_confidence,
      photo_quality_score,
      review_signal_score,
      category_fit_score,
      rejection_reason,
    };

    const grounded_description = groundedDescription(venue.name, primary_atmosphere, tags, not_ideal_for);

    if (apply && schemaReady) {
      const { error } = await supabase.from('staging_venues').update({
        curation_status,
        eligibility_score: score,
        eligibility,
        evidence,
        primary_atmosphere,
        best_for,
        not_ideal_for,
        grounded_description,
        curation_notes: rejection_reason,
      }).eq('id', venue.id);

      if (error) throw new Error(`Unable to update ${venue.name}: ${error.message}`);
    }

    results.push({
      id: venue.id,
      name: venue.name,
      category: venue.category_seed,
      curation_status,
      score,
      eligibility,
      evidence,
      primary_atmosphere,
      tags,
      best_for,
      not_ideal_for,
      grounded_description,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry-run',
    schemaReady,
    totals: {
      venues: results.length,
      active: results.filter((row) => row.curation_status === 'active').length,
      pending_review: results.filter((row) => row.curation_status === 'pending_review').length,
      rejected: results.filter((row) => row.curation_status === 'rejected').length,
    },
    results,
  };

  writeFileSync(path.join('data', 'venue_curation_evaluation.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.totals, null, 2));
  if (!schemaReady) {
    console.log('Schema not ready. Apply supabase/06_venue_curation_reset_schema.sql before running with --apply.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

