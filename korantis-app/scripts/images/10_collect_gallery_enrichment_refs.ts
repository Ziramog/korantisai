import {
  escapeMd,
  loadPublicImageState,
  loadVisionMetadata,
  normalizeName,
  photoEditorialScore,
  readJson,
  writeJsonMd,
  type EnrichmentPhotoRef,
  type GalleryAuditVenue,
  type PhotoVision,
} from './gallery_quality_utils';

type PhotoRefInput = {
  venue_id?: string;
  venue_name: string;
  google_place_id?: string;
  category?: string | null;
  selected_photos?: Array<{
    google_photo_reference: string;
    width?: number | null;
    height?: number | null;
  }>;
};

function shouldTarget(venue: GalleryAuditVenue) {
  return venue.statuses.some((status) => [
    'interior_weak',
    'seating_weak',
    'product_heavy',
    'storefront_heavy',
    'metadata_missing',
    'fallback_unresolved',
  ].includes(status));
}

function sourceReason(vision: PhotoVision | null | undefined) {
  if (!vision) return 'metadata missing; needs vision evaluation';
  const signals = [
    vision.interior_visible ? 'interior' : '',
    vision.seating_visible ? 'seating' : '',
    vision.people_staying_visible ? 'people staying' : '',
    (vision.atmosphere_score || 0) >= 70 ? 'atmosphere' : '',
    (vision.spatial_depth_score || 0) >= 65 ? 'spatial depth' : '',
  ].filter(Boolean);
  return signals.length ? signals.join(', ') : 'available photo ref needs review';
}

function markdown(refs: EnrichmentPhotoRef[]) {
  const targetVenues = new Set(refs.map((ref) => ref.venue_id));
  return [
    '# Gallery Enrichment Photo Refs',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Target venues with refs: ${targetVenues.size}`,
    `- Candidate refs: ${refs.length}`,
    `- Already evaluated: ${refs.filter((ref) => !ref.needs_vision).length}`,
    `- Needs vision: ${refs.filter((ref) => ref.needs_vision).length}`,
    '',
    '| Venue | Source | Needs Vision | Existing | Score | Reason |',
    '|---|---|---:|---:|---:|---|',
    ...refs.map((ref) => `| ${escapeMd(ref.venue_name)} | ${ref.source} | ${ref.needs_vision ? 'yes' : 'no'} | ${ref.already_in_venue_images ? 'yes' : 'no'} | ${photoEditorialScore(ref.vision).toString()} | ${escapeMd(ref.reason)} |`),
  ].join('\n');
}

async function main() {
  const audit = readJson<{ venues: GalleryAuditVenue[] }>('data/public_gallery_quality_audit.json', { venues: [] });
  const targets = audit.venues.filter(shouldTarget);
  const targetById = new Map(targets.map((venue) => [venue.venue_id, venue]));
  const targetByName = new Map(targets.map((venue) => [normalizeName(venue.venue_name), venue]));
  const { imagesByVenue } = await loadPublicImageState();
  const vision = loadVisionMetadata();
  const refs: EnrichmentPhotoRef[] = [];
  const seen = new Set<string>();

  function pushRef(venue: GalleryAuditVenue, source: EnrichmentPhotoRef['source'], googlePhotoReference: string, width?: number | null, height?: number | null) {
    const existingRefs = new Set((imagesByVenue.get(venue.venue_id) || []).map((image) => image.google_photo_reference || image.photo_reference).filter(Boolean) as string[]);
    const key = `${venue.venue_id}|${googlePhotoReference}`;
    if (seen.has(key)) return;
    seen.add(key);
    const photoVision = vision.byRef.get(googlePhotoReference) || null;
    refs.push({
      venue_id: venue.venue_id,
      venue_name: venue.venue_name,
      category: venue.category,
      source,
      google_photo_reference: googlePhotoReference,
      width,
      height,
      vision: photoVision,
      already_in_venue_images: existingRefs.has(googlePhotoReference),
      needs_vision: !photoVision,
      reason: sourceReason(photoVision),
    });
  }

  for (const venue of targets) {
    for (const venueVision of vision.byVenueId.get(venue.venue_id) || []) {
      for (const photo of venueVision.photo_results || []) {
        pushRef(venue, 'existing_vision', photo.photo_reference, null, null);
      }
    }

    for (const venueVision of vision.byVenueName.get(normalizeName(venue.venue_name)) || []) {
      for (const photo of venueVision.photo_results || []) {
        pushRef(venue, 'existing_vision', photo.photo_reference, null, null);
      }
    }
  }

  const photoRefFiles = [
    { file: 'data/missing_venue_photo_refs.json', source: 'missing_venue_photo_refs' as const },
    { file: 'data/publish_candidate_photo_refs.json', source: 'publish_candidate_photo_refs' as const },
  ];

  for (const item of photoRefFiles) {
    const payload = readJson<{ venues?: PhotoRefInput[] }>(item.file, { venues: [] });
    for (const inputVenue of payload.venues || []) {
      const venue = (inputVenue.venue_id && targetById.get(inputVenue.venue_id)) || targetByName.get(normalizeName(inputVenue.venue_name));
      if (!venue) continue;
      for (const photo of inputVenue.selected_photos || []) {
        pushRef(venue, item.source, photo.google_photo_reference, photo.width, photo.height);
      }
    }
  }

  const filtered = refs
    .filter((ref) => !ref.already_in_venue_images)
    .sort((a, b) => photoEditorialScore(b.vision) - photoEditorialScore(a.vision));

  const output = {
    generated_at: new Date().toISOString(),
    target_venues: targets.length,
    collected_refs: filtered.length,
    needs_vision: filtered.filter((ref) => ref.needs_vision).length,
    refs: filtered,
  };

  writeJsonMd('gallery_enrichment_photo_refs.json', 'gallery_enrichment_photo_refs.md', output, markdown(filtered));
  console.log(JSON.stringify({
    target_venues: output.target_venues,
    collected_refs: output.collected_refs,
    needs_vision: output.needs_vision,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

