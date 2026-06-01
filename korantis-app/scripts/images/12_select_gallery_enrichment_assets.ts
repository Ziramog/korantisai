import {
  escapeMd,
  loadPublicImageState,
  normalizeName,
  photoEditorialScore,
  readJson,
  writeJsonMd,
  type EnrichmentPhotoRef,
  type GalleryAuditVenue,
  type SelectedGalleryAsset,
} from './gallery_quality_utils';

type VisionRef = EnrichmentPhotoRef & {
  vision_status: string;
  score: number;
};

type SelectionCandidate = VisionRef & {
  selection_score: number;
  selection_reason: 'preferred_spatial_evidence' | 'low_score_but_unique_spatial_evidence';
};

function isHardRejected(ref: VisionRef) {
  const vision = ref.vision;
  if (!vision) return true;
  if (vision.menu_only) return true;
  if (vision.product_only) return true;
  if (vision.storefront_only) return true;
  if (photoEditorialScore(vision) <= 0) return true;
  return false;
}

function preferredCandidate(ref: VisionRef): SelectionCandidate | null {
  const vision = ref.vision;
  if (!vision || isHardRejected(ref)) return null;

  const score = photoEditorialScore(vision);
  const hasSpatialEvidence = Boolean(vision.interior_visible || vision.seating_visible);
  const atmosphere = vision.atmosphere_score || 0;

  if (score >= 50 && atmosphere >= 60 && hasSpatialEvidence) {
    return {
      ...ref,
      selection_score: score,
      selection_reason: 'preferred_spatial_evidence',
    };
  }

  return null;
}

function fallbackSpatialCandidate(ref: VisionRef): SelectionCandidate | null {
  const vision = ref.vision;
  if (!vision || isHardRejected(ref)) return null;
  if (!vision.interior_visible && !vision.seating_visible) return null;

  return {
    ...ref,
    selection_score: photoEditorialScore(vision),
    selection_reason: 'low_score_but_unique_spatial_evidence',
  };
}

function normalizedImageIdentity(ref: VisionRef) {
  const vision = ref.vision;
  return [
    ref.google_photo_reference,
    ref.width || '',
    ref.height || '',
    vision?.interior_visible ? 'interior' : '',
    vision?.seating_visible ? 'seating' : '',
    vision?.product_only ? 'product' : '',
    vision?.storefront_only ? 'storefront' : '',
    normalizeName(`${ref.venue_name}-${ref.source}`),
  ].join('|');
}

function dedupeCandidates(candidates: SelectionCandidate[]) {
  const byRef = new Map<string, SelectionCandidate>();
  const byIdentity = new Set<string>();
  const duplicates: Array<{ venue_name: string; reason: string; google_photo_reference: string }> = [];

  for (const candidate of candidates.sort((a, b) => b.selection_score - a.selection_score)) {
    const refKey = `${candidate.venue_id}|${candidate.google_photo_reference}`;
    const identityKey = `${candidate.venue_id}|${normalizedImageIdentity(candidate)}`;

    if (byRef.has(refKey) || byIdentity.has(identityKey)) {
      duplicates.push({
        venue_name: candidate.venue_name,
        reason: byRef.has(refKey) ? 'duplicate venue_id + google_photo_reference' : 'duplicate normalized image identity',
        google_photo_reference: candidate.google_photo_reference,
      });
      continue;
    }

    byRef.set(refKey, candidate);
    byIdentity.add(identityKey);
  }

  return {
    candidates: Array.from(byRef.values()).sort((a, b) => b.selection_score - a.selection_score),
    duplicates,
  };
}

function nextAvailableSortOrders(existingSortOrders: Set<number>, count: number) {
  const orders: number[] = [];
  let cursor = 0;
  while (orders.length < count) {
    if (!existingSortOrders.has(cursor)) {
      orders.push(cursor);
      existingSortOrders.add(cursor);
    }
    cursor++;
  }
  return orders;
}

function markdown(
  selected: SelectedGalleryAsset[],
  skipped: Array<{ venue_name: string; reason: string }>,
  duplicateRowsRemoved: number,
  selectedBeforeDedupe: number,
) {
  return [
    '# Gallery Enrichment Selection',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Eligible before dedupe: ${selectedBeforeDedupe}`,
    `- Duplicate rows removed: ${duplicateRowsRemoved}`,
    `- Selected assets: ${selected.length}`,
    `- Target venues selected: ${new Set(selected.map((item) => item.venue_id)).size}`,
    `- Skipped candidates: ${skipped.length}`,
    '',
    '| Venue | Sort | Score | Reason | Interior | Seating | Atmosphere | Ref |',
    '|---|---:|---:|---|---:|---:|---:|---|',
    ...selected.map((asset) => `| ${escapeMd(asset.venue_name)} | ${asset.sort_order} | ${asset.selection_score} | ${asset.selection_reason || ''} | ${asset.vision?.interior_visible ? 'yes' : 'no'} | ${asset.vision?.seating_visible ? 'yes' : 'no'} | ${asset.vision?.atmosphere_score ?? ''} | ${escapeMd(asset.google_photo_reference.slice(0, 80))}... |`),
    '',
    '## Skipped',
    '',
    skipped.length ? skipped.map((item) => `- ${item.venue_name}: ${item.reason}`).join('\n') : '- none',
  ].join('\n');
}

async function main() {
  const audit = readJson<{ venues: GalleryAuditVenue[] }>('data/public_gallery_quality_audit.json', { venues: [] });
  const vision = readJson<{ refs: VisionRef[] }>('data/gallery_enrichment_photo_vision.json', { refs: [] });
  const { imagesByVenue } = await loadPublicImageState();
  const selected: SelectedGalleryAsset[] = [];
  const skipped: Array<{ venue_name: string; reason: string }> = [];
  const duplicateRows: Array<{ venue_name: string; reason: string; google_photo_reference: string }> = [];
  const refsByVenue = new Map<string, VisionRef[]>();
  let eligibleBeforeDedupe = 0;
  const selectedGlobalKeys = new Set<string>();

  for (const ref of vision.refs) {
    const current = refsByVenue.get(ref.venue_id) || [];
    current.push(ref);
    refsByVenue.set(ref.venue_id, current);
  }

  const duplicateVenueNames = new Set<string>();
  const uniqueVenues = new Map<string, typeof audit.venues[number]>();
  for (const venue of [...audit.venues].sort((a, b) => Number(b.venue_id.startsWith('ChIJ')) - Number(a.venue_id.startsWith('ChIJ')))) {
    const key = normalizeName(venue.venue_name);
    if (uniqueVenues.has(key)) {
      duplicateVenueNames.add(key);
      skipped.push({ venue_name: venue.venue_name, reason: `duplicate public venue name skipped for enrichment: ${venue.venue_id}` });
      continue;
    }
    uniqueVenues.set(key, venue);
  }

  for (const venue of uniqueVenues.values()) {
    const existingGalleryImages = (imagesByVenue.get(venue.venue_id) || []).filter((image) => image.role === 'gallery');
    const currentGalleryCount = existingGalleryImages.length;
    const existingSortOrders = new Set(existingGalleryImages.map((image) => Number(image.sort_order || 0)));
    const availableSlots = Math.max(0, 8 - currentGalleryCount);
    if (availableSlots === 0) {
      skipped.push({ venue_name: venue.venue_name, reason: 'already has 8 or more gallery images' });
      continue;
    }

    const rawRefs = refsByVenue.get(venue.venue_id) || [];
    const preferred = rawRefs
      .map(preferredCandidate)
      .filter((candidate): candidate is SelectionCandidate => candidate !== null);
    const fallback = rawRefs
      .map(fallbackSpatialCandidate)
      .filter((candidate): candidate is SelectionCandidate => candidate !== null);
    const candidatePool = preferred.length > 0 ? preferred : fallback.slice(0, 1);
    eligibleBeforeDedupe += candidatePool.length;
    const deduped = dedupeCandidates(candidatePool);
    duplicateRows.push(...deduped.duplicates);
    const candidates = deduped.candidates;

    if (candidates.length === 0) {
      skipped.push({ venue_name: venue.venue_name, reason: 'no usable evaluated enrichment candidates' });
      continue;
    }

    const selectedCandidates = candidates.slice(0, availableSlots);
    const sortOrders = nextAvailableSortOrders(existingSortOrders, selectedCandidates.length);
    selectedCandidates.forEach((candidate, index) => {
      const sortOrder = sortOrders[index];
      const globalKeys = [
        `${candidate.venue_id}|${candidate.google_photo_reference}`,
        `${normalizeName(candidate.venue_name)}|gallery|${sortOrder}`,
      ];
      if (globalKeys.some((key) => selectedGlobalKeys.has(key))) {
        duplicateRows.push({
          venue_name: candidate.venue_name,
          reason: 'duplicate final selected row',
          google_photo_reference: candidate.google_photo_reference,
        });
        return;
      }

      selected.push({
        ...candidate,
        selected_role: 'gallery',
        sort_order: sortOrder,
        selection_score: candidate.selection_score,
        selection_reason: candidate.selection_reason,
      });
      for (const key of globalKeys) selectedGlobalKeys.add(key);
    });
  }

  const output = {
    generated_at: new Date().toISOString(),
    max_gallery_per_venue: 8,
    selected_before_dedupe: eligibleBeforeDedupe,
    duplicate_rows_removed: duplicateRows.length,
    duplicate_public_venue_names_skipped: duplicateVenueNames.size,
    selected_count: selected.length,
    target_venues: new Set(selected.map((item) => item.venue_id)).size,
    quality_threshold_exceptions: selected.filter((item) => item.selection_reason === 'low_score_but_unique_spatial_evidence').length,
    duplicate_rows: duplicateRows,
    skipped,
    selected,
  };

  writeJsonMd('gallery_enrichment_selection.json', 'gallery_enrichment_selection.md', output, markdown(selected, skipped, duplicateRows.length, eligibleBeforeDedupe));
  console.log(JSON.stringify({
    selected_before_dedupe: output.selected_before_dedupe,
    duplicate_rows_removed: output.duplicate_rows_removed,
    selected: output.selected_count,
    target_venues: output.target_venues,
    quality_threshold_exceptions: output.quality_threshold_exceptions,
    skipped: skipped.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
