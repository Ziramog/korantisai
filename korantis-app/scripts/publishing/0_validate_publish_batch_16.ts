import {
  APPROVED_PUBLISH_BATCH,
  approvedNameSet,
  byNormalizedName,
  clampQuality,
  deriveAtmosphere,
  loadCandidateImageAssets,
  loadPublicVenueLookup,
  loadPublishingInputs,
  validationMarkdown,
  writeReport,
  type ApprovedVenueName,
  type ValidationOutput,
  type ValidationVenue,
} from './publishing_utils';
import { normalizeName } from '../enrichment/enrichment_utils';

function roleCount(roles: string[], role: string) {
  return roles.filter((item) => item === role).length;
}

async function main() {
  const inputs = await loadPublishingInputs();
  const readyByName = byNormalizedName(inputs.ready);
  const mappingByName = byNormalizedName(inputs.mappings.filter((item) => item.scope === 'candidate'));
  const googleByName = byNormalizedName(inputs.googleRecords);
  const intelligenceByName = byNormalizedName(inputs.intelligence);
  const approvedSet = approvedNameSet();

  const candidateIds = inputs.ready
    .filter((item) => approvedSet.has(normalizeName(item.venue)))
    .map((item) => item.candidate_id);

  const [assets, publicVenues] = await Promise.all([
    loadCandidateImageAssets(candidateIds),
    loadPublicVenueLookup(),
  ]);

  const publicById = new Map(publicVenues.map((venue) => [venue.id, venue]));
  const publicByName = new Map(publicVenues.map((venue) => [normalizeName(venue.name), venue]));
  const assetsByCandidateId = new Map<string, typeof assets>();

  for (const asset of assets) {
    const current = assetsByCandidateId.get(asset.candidate_id) || [];
    current.push(asset);
    assetsByCandidateId.set(asset.candidate_id, current);
  }

  const venues: ValidationVenue[] = [];
  const blockers: ValidationOutput['blockers'] = [];
  const warnings: ValidationOutput['warnings'] = [];

  for (const approvedName of APPROVED_PUBLISH_BATCH) {
    const key = normalizeName(approvedName);
    const ready = readyByName.get(key);
    const mapping = mappingByName.get(key);
    const google = googleByName.get(key);
    const intelligence = intelligenceByName.get(key);
    const reasons: string[] = [];
    const warningNotes: string[] = [];

    if (!ready) reasons.push('missing publish-ready asset record');
    if (!ready?.publish_ready) reasons.push('candidate is not publish_ready after image assets');
    if (ready && ready.eligibility_status !== 'active') reasons.push(`eligibility is ${ready.eligibility_status}`);
    if (ready && ready.match_status !== 'matched') reasons.push(`match status is ${ready.match_status}`);
    if (!mapping) reasons.push('missing category normalization mapping');
    if (mapping && !mapping.write_safe) reasons.push('category mapping is not write-safe');
    if (mapping && mapping.confidence < 70) reasons.push(`category confidence too low: ${mapping.confidence}`);
    if (!google) reasons.push('missing Google enrichment record');
    if (google && google.status !== 'matched') reasons.push(`Google status is ${google.status}`);
    if (!intelligence) reasons.push('missing intelligence output');
    if (intelligence?.eligibility?.status !== 'active') reasons.push(`intelligence eligibility is ${intelligence?.eligibility?.status || 'missing'}`);
    if (!intelligence?.photo_intelligence?.acceptable_hero_photo) reasons.push('no acceptable hero photo in intelligence');

    const googlePlaceId = google?.google_place_id || google?.google_data?.id || intelligence?.google_place_id || '';
    if (!googlePlaceId) reasons.push('missing Google place id');
    if (googlePlaceId && publicById.has(googlePlaceId)) reasons.push('public venue id already exists');
    if (publicByName.has(key)) reasons.push('public venue name already exists');

    const location = google?.google_data?.location;
    const lat = location?.latitude;
    const lng = location?.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) reasons.push('missing canonical Google coordinates');

    const candidateAssets = ready ? assetsByCandidateId.get(ready.candidate_id) || [] : [];
    const roles = candidateAssets.map((asset) => asset.role);
    const cloudinaryAssets = candidateAssets.filter((asset) => asset.url.startsWith('https://res.cloudinary.com/'));
    const hero = roleCount(roles, 'hero');
    const card = roleCount(roles, 'card');
    const gallery = roleCount(roles, 'gallery');
    if (hero < 1) reasons.push('missing candidate Cloudinary hero asset');
    if (card < 1) reasons.push('missing candidate Cloudinary card asset');
    if (gallery < 1) reasons.push('missing candidate Cloudinary gallery assets');
    if (cloudinaryAssets.length !== candidateAssets.length) reasons.push('one or more candidate assets are not Cloudinary URLs');

    if (google?.match?.match_warnings?.length) warningNotes.push(...google.match.match_warnings);
    if (intelligence?.eligibility?.warnings?.length) warningNotes.push(...intelligence.eligibility.warnings);
    if (ready?.gallery_count && ready.gallery_count < 6) warningNotes.push(`gallery count below target: ${ready.gallery_count}`);
    if (!google?.google_data?.priceLevel) warningNotes.push('priceLevel unavailable from Google');
    if (!google?.google_data?.websiteUri) warningNotes.push('website unavailable from Google');
    if (!google?.google_data?.nationalPhoneNumber && !google?.google_data?.internationalPhoneNumber) warningNotes.push('phone unavailable from Google');

    if (reasons.length > 0 || !ready || !mapping || !google || !intelligence || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      blockers.push({ venue: approvedName, reasons });
      if (warningNotes.length) warnings.push({ venue: approvedName, warnings: warningNotes });
      continue;
    }

    const eligibilityScore = intelligence.scores?.eligibility_score ?? 75;
    const normalizedCategory = mapping.normalized_category;

    venues.push({
      approved_name: approvedName as ApprovedVenueName,
      candidate_id: ready.candidate_id,
      google_place_id: googlePlaceId,
      public_venue_id: googlePlaceId,
      name: ready.venue,
      district: ready.district || intelligence.district || google.district || '',
      normalized_category: normalizedCategory,
      display_category_en: mapping.display_category_en,
      display_category_es: mapping.display_category_es,
      category_confidence: mapping.confidence,
      eligibility_score: eligibilityScore,
      quality: clampQuality(eligibilityScore),
      atmosphere: deriveAtmosphere(normalizedCategory, intelligence.intent_scores),
      coordinates: { lat: Number(lat), lng: Number(lng) },
      google: {
        rating: google.google_data?.rating ?? null,
        userRatingCount: google.google_data?.userRatingCount ?? null,
        priceLevel: google.google_data?.priceLevel ?? null,
        websiteUri: google.google_data?.websiteUri ?? null,
        googleMapsUri: google.google_data?.googleMapsUri ?? null,
        nationalPhoneNumber: google.google_data?.nationalPhoneNumber ?? null,
        internationalPhoneNumber: google.google_data?.internationalPhoneNumber ?? null,
        formattedAddress: google.google_data?.formattedAddress ?? null,
      },
      image_assets: {
        total: candidateAssets.length,
        hero,
        card,
        gallery,
        cloudinary: cloudinaryAssets.length,
      },
      reasons: ['active intelligence', 'matched Google place', 'Cloudinary candidate images present', 'write-safe normalized category'],
      warnings: warningNotes,
    });

    if (warningNotes.length) warnings.push({ venue: approvedName, warnings: warningNotes });
  }

  const output: ValidationOutput = {
    generated_at: new Date().toISOString(),
    mode: 'validation',
    approved_count: APPROVED_PUBLISH_BATCH.length,
    valid_count: venues.length,
    blocked_count: blockers.length,
    public_venues_before: publicVenues.length,
    venues,
    blockers,
    warnings,
  };

  await writeReport('publish_batch_16_validation.json', 'publish_batch_16_validation.md', output, validationMarkdown(output));

  console.log(`Validated ${venues.length}/${APPROVED_PUBLISH_BATCH.length} approved candidates`);
  if (blockers.length > 0) {
    console.error(`Blocked candidates: ${blockers.map((blocker) => blocker.venue).join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

