import {
  escapeMd,
  loadControlledBatch,
  loadPublicVenues,
  mapByCandidateId,
  mapPublicImagesByName,
  normalizeName,
  writeJsonAndMarkdown,
  type GoogleRecord,
  type IntelligenceOutput,
  type VisionVenue,
} from './enrichment_utils';

type PhotoRole = 'hero' | 'card' | 'gallery';

type SelectedPhoto = {
  role: PhotoRole;
  sort_order: number;
  google_photo_reference: string;
  width?: number;
  height?: number;
  quality_score: number | null;
  hero_suitability_score: number | null;
  card_suitability_score: number | null;
  source: 'vision' | 'google_places';
};

type VenuePhotoSelection = {
  candidate_id: string;
  google_place_id: string | null;
  venue_name: string;
  city: 'buenos-aires';
  category: string;
  selected_photos: SelectedPhoto[];
  skipped_reason?: string;
};

function sortVisionPhotos(vision: VisionVenue) {
  return [...(vision.photo_results || [])].sort((a, b) => {
    const scoreA = (a.hero_suitability_score || 0) + (a.atmosphere_score || 0) + (a.card_suitability_score || 0);
    const scoreB = (b.hero_suitability_score || 0) + (b.atmosphere_score || 0) + (b.card_suitability_score || 0);
    return scoreB - scoreA;
  });
}

function selectFromVision(vision: VisionVenue): SelectedPhoto[] {
  const photos = sortVisionPhotos(vision);
  const used = new Set<string>();
  const selected: SelectedPhoto[] = [];
  const acceptable = photos.filter((photo) => !photo.product_only && !photo.menu_only && (photo.hero_suitability_score || 0) >= 55);
  const hero = acceptable[0] || photos[0];
  const card = acceptable.find((photo) => photo.photo_reference !== hero?.photo_reference) || photos.find((photo) => photo.photo_reference !== hero?.photo_reference);

  function push(photo: typeof photos[number] | undefined, role: PhotoRole, sortOrder: number) {
    if (!photo || used.has(photo.photo_reference)) return;
    used.add(photo.photo_reference);
    selected.push({
      role,
      sort_order: sortOrder,
      google_photo_reference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
      quality_score: photo.atmosphere_score ?? null,
      hero_suitability_score: photo.hero_suitability_score ?? null,
      card_suitability_score: photo.card_suitability_score ?? null,
      source: 'vision',
    });
  }

  push(hero, 'hero', 0);
  push(card, 'card', 1);

  for (const photo of photos) {
    if (selected.filter((item) => item.role === 'gallery').length >= 6) break;
    push(photo, 'gallery', selected.length);
  }

  return selected.slice(0, 8);
}

function selectFromGoogle(google: GoogleRecord): SelectedPhoto[] {
  const photos = google.google_data?.photos || [];
  return photos.slice(0, 8).map((photo, index): SelectedPhoto => ({
    role: index === 0 ? 'hero' : index === 1 ? 'card' : 'gallery',
    sort_order: index,
    google_photo_reference: photo.name || '',
    width: photo.widthPx,
    height: photo.heightPx,
    quality_score: null,
    hero_suitability_score: null,
    card_suitability_score: null,
    source: 'google_places',
  })).filter((photo) => photo.google_photo_reference.length > 0);
}

function shouldCollect(output: IntelligenceOutput, google: GoogleRecord | undefined, publicImage: { cloudinaryHero: boolean } | undefined, alreadyPublic: boolean) {
  if (alreadyPublic) return false;
  if ((google?.status || output.match_status) !== 'matched') return false;
  if (output.eligibility?.status !== 'active') return false;
  return !publicImage?.cloudinaryHero;
}

function markdown(rows: VenuePhotoSelection[]) {
  return [
    '# Publish Candidate Photo Refs',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Candidate venues with selected refs: ${rows.filter((row) => row.selected_photos.length > 0).length}`,
    `- Candidate venues skipped/no refs: ${rows.filter((row) => row.selected_photos.length === 0).length}`,
    `- Total selected photos: ${rows.reduce((sum, row) => sum + row.selected_photos.length, 0)}`,
    '',
    '| Venue | Google place ID | Selected photos | Hero | Card | Galleries | Skipped reason |',
    '| --- | --- | ---: | --- | --- | ---: | --- |',
    ...rows.map((row) => {
      const hero = row.selected_photos.find((photo) => photo.role === 'hero');
      const card = row.selected_photos.find((photo) => photo.role === 'card');
      const galleries = row.selected_photos.filter((photo) => photo.role === 'gallery').length;
      return `| ${escapeMd(row.venue_name)} | ${escapeMd(row.google_place_id)} | ${row.selected_photos.length} | ${hero ? 'yes' : 'no'} | ${card ? 'yes' : 'no'} | ${galleries} | ${escapeMd(row.skipped_reason || '')} |`;
    }),
  ].join('\n');
}

async function main() {
  const [{ venues: publicVenues }, batch] = await Promise.all([loadPublicVenues(), loadControlledBatch()]);
  const publicNames = new Set(publicVenues.map((venue) => normalizeName(venue.name)));
  const imagesByName = mapPublicImagesByName(publicVenues, batch.imageVerification);
  const googleById = mapByCandidateId(batch.googleRecords);
  const rows: VenuePhotoSelection[] = [];

  for (const output of batch.intelligence) {
    const nameKey = normalizeName(output.venue_name);
    const google = googleById.get(output.candidate_id);
    const alreadyPublic = publicNames.has(nameKey);
    const publicImage = imagesByName.get(nameKey);
    const base = {
      candidate_id: output.candidate_id,
      google_place_id: google?.google_place_id || output.google_place_id || null,
      venue_name: output.venue_name,
      city: 'buenos-aires' as const,
      category: output.category,
    };

    if (!shouldCollect(output, google, publicImage, alreadyPublic)) {
      rows.push({
        ...base,
        selected_photos: [],
        skipped_reason: [
          alreadyPublic ? 'already public' : '',
          (google?.status || output.match_status) !== 'matched' ? `match status ${google?.status || output.match_status || 'missing'}` : '',
          output.eligibility?.status !== 'active' ? `eligibility ${output.eligibility?.status || 'missing'}` : '',
          publicImage?.cloudinaryHero ? 'already has Cloudinary hero' : '',
        ].filter(Boolean).join('; '),
      });
      continue;
    }

    const vision = batch.visionById.get(output.candidate_id);
    const selected = vision?.photo_results?.length ? selectFromVision(vision) : google ? selectFromGoogle(google) : [];
    rows.push({
      ...base,
      selected_photos: selected,
      skipped_reason: selected.length ? undefined : 'no safe photo refs found',
    });
  }

  const payload = {
    generated_at: new Date().toISOString(),
    venues: rows.filter((row) => row.selected_photos.length > 0),
    skipped: rows.filter((row) => row.selected_photos.length === 0),
  };

  await writeJsonAndMarkdown('publish_candidate_photo_refs.json', 'publish_candidate_photo_refs_report.md', payload, markdown(rows));
  console.log(`Photo ref venues: ${payload.venues.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

