import {
  classifyAuditVenue,
  escapeMd,
  loadPublicImageState,
  loadVisionMetadata,
  writeJsonMd,
} from './gallery_quality_utils';

function markdown(output: {
  total_public_venues: number;
  venues_with_4_gallery_images: number;
  venues_with_interior_coverage: number;
  venues_with_seating_coverage: number;
  venues_still_product_heavy: string[];
  venues_still_fallback: string[];
  venues_requiring_manual_image_sourcing: string[];
}) {
  return [
    '# Gallery Quality After Enrichment',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Total public venues: ${output.total_public_venues}`,
    `- Venues with >= 4 gallery images: ${output.venues_with_4_gallery_images}`,
    `- Venues with interior coverage: ${output.venues_with_interior_coverage}`,
    `- Venues with seating coverage: ${output.venues_with_seating_coverage}`,
    `- Venues still product-heavy: ${output.venues_still_product_heavy.length}`,
    `- Venues still fallback: ${output.venues_still_fallback.length}`,
    `- Venues requiring manual image sourcing: ${output.venues_requiring_manual_image_sourcing.length}`,
    '',
    '## Product Heavy',
    '',
    output.venues_still_product_heavy.length ? output.venues_still_product_heavy.map((name) => `- ${escapeMd(name)}`).join('\n') : '- none',
    '',
    '## Fallback',
    '',
    output.venues_still_fallback.length ? output.venues_still_fallback.map((name) => `- ${escapeMd(name)}`).join('\n') : '- none',
    '',
    '## Manual Image Sourcing Needed',
    '',
    output.venues_requiring_manual_image_sourcing.length ? output.venues_requiring_manual_image_sourcing.map((name) => `- ${escapeMd(name)}`).join('\n') : '- none',
  ].join('\n');
}

async function main() {
  const { venues, imagesByVenue } = await loadPublicImageState();
  const vision = loadVisionMetadata();
  const audit = venues.map((venue) => classifyAuditVenue(venue, imagesByVenue.get(venue.id) || [], vision.byRef));
  const output = {
    generated_at: new Date().toISOString(),
    total_public_venues: audit.length,
    venues_with_4_gallery_images: audit.filter((venue) => venue.gallery_count >= 4).length,
    venues_with_interior_coverage: audit.filter((venue) => venue.interior_visible_count > 0).length,
    venues_with_seating_coverage: audit.filter((venue) => venue.seating_visible_count > 0).length,
    venues_still_product_heavy: audit.filter((venue) => venue.statuses.includes('product_heavy')).map((venue) => venue.venue_name),
    venues_still_fallback: audit.filter((venue) => venue.statuses.includes('fallback_unresolved')).map((venue) => venue.venue_name),
    venues_requiring_manual_image_sourcing: audit.filter((venue) => venue.statuses.includes('manual_image_needed') || venue.statuses.includes('alternative_photo_source_needed')).map((venue) => venue.venue_name),
    venues: audit,
  };

  writeJsonMd('gallery_quality_after_enrichment.json', 'gallery_quality_after_enrichment.md', output, markdown(output));
  console.log(JSON.stringify({
    total_public_venues: output.total_public_venues,
    venues_with_4_gallery_images: output.venues_with_4_gallery_images,
    venues_with_interior_coverage: output.venues_with_interior_coverage,
    venues_with_seating_coverage: output.venues_with_seating_coverage,
    venues_still_fallback: output.venues_still_fallback.length,
    manual_image_needed: output.venues_requiring_manual_image_sourcing.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

