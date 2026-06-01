import {
  classifyAuditVenue,
  escapeMd,
  loadPublicImageState,
  loadVisionMetadata,
  writeJsonMd,
  type GalleryAuditVenue,
} from './gallery_quality_utils';

function markdown(venues: GalleryAuditVenue[]) {
  const statusCounts = venues.reduce<Record<string, number>>((acc, venue) => {
    for (const status of venue.statuses) acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return [
    '# Public Gallery Quality Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Public venues audited: ${venues.length}`,
    `- Gallery good: ${statusCounts.gallery_good || 0}`,
    `- Gallery acceptable: ${statusCounts.gallery_acceptable || 0}`,
    `- Interior weak: ${statusCounts.interior_weak || 0}`,
    `- Seating weak: ${statusCounts.seating_weak || 0}`,
    `- Product heavy: ${statusCounts.product_heavy || 0}`,
    `- Storefront heavy: ${statusCounts.storefront_heavy || 0}`,
    `- Metadata missing: ${statusCounts.metadata_missing || 0}`,
    `- Fallback unresolved: ${statusCounts.fallback_unresolved || 0}`,
    `- Manual image needed: ${statusCounts.manual_image_needed || 0}`,
    '',
    '## Venue Audit',
    '',
    '| Venue | Category | Gallery | Hero | Card | Interior | Seating | Atmosphere HQ | Product/Menu | Storefront | Metadata Missing | Duplicate Risk | Fallback | Statuses |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|',
    ...venues.map((venue) => `| ${escapeMd(venue.venue_name)} | ${escapeMd(venue.category)} | ${venue.gallery_count} | ${venue.hero_exists ? 'yes' : 'no'} | ${venue.card_exists ? 'yes' : 'no'} | ${venue.interior_visible_count} | ${venue.seating_visible_count} | ${venue.atmosphere_high_quality_count} | ${venue.product_menu_only_count} | ${venue.storefront_only_count} | ${venue.metadata_missing_count} | ${venue.duplicate_risk ? 'yes' : 'no'} | ${venue.fallback_status} | ${venue.statuses.join(', ')} |`),
  ].join('\n');
}

async function main() {
  const { venues, imagesByVenue } = await loadPublicImageState();
  const vision = loadVisionMetadata();
  const auditVenues = venues.map((venue) => classifyAuditVenue(
    venue,
    imagesByVenue.get(venue.id) || [],
    vision.byRef,
  ));

  const output = {
    generated_at: new Date().toISOString(),
    summary: {
      total_public_venues: auditVenues.length,
      by_status: auditVenues.reduce<Record<string, number>>((acc, venue) => {
        for (const status of venue.statuses) acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
    },
    venues: auditVenues,
  };

  writeJsonMd('public_gallery_quality_audit.json', 'public_gallery_quality_audit.md', output, markdown(auditVenues));
  console.log(JSON.stringify(output.summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

