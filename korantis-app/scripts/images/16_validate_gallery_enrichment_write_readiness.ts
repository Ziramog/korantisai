import {
  escapeMd,
  readJson,
  writeJsonMd,
  type GalleryAuditVenue,
  type MaterializedGalleryAsset,
  type SelectedGalleryAsset,
} from './gallery_quality_utils';

type UpsertAction = {
  venue_name: string;
  venue_id: string;
  action: 'would_insert' | 'inserted' | 'skipped';
  reason?: string;
  public_id?: string;
};

function duplicateKeys<T>(items: T[], keyFn: (item: T) => string) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return Array.from(duplicates).filter(Boolean);
}

function markdown(output: {
  write_ready: boolean;
  blockers: string[];
  warnings: string[];
  selected_count: number;
  would_insert_count: number;
  duplicate_counts: Record<string, number>;
  venues_receiving_assets: string[];
  quality_threshold_exceptions: Array<{ venue_name: string; google_photo_reference: string; score: number }>;
}) {
  return [
    '# Gallery Enrichment Write Readiness',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Write ready: ${output.write_ready ? 'yes' : 'no'}`,
    `- Selected assets: ${output.selected_count}`,
    `- Would insert: ${output.would_insert_count}`,
    `- Venues receiving assets: ${output.venues_receiving_assets.length}`,
    `- Quality threshold exceptions: ${output.quality_threshold_exceptions.length}`,
    '',
    '## Duplicate Counts',
    '',
    ...Object.entries(output.duplicate_counts).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Venues Receiving Assets',
    '',
    output.venues_receiving_assets.length ? output.venues_receiving_assets.map((name) => `- ${escapeMd(name)}`).join('\n') : '- none',
    '',
    '## Quality Threshold Exceptions',
    '',
    output.quality_threshold_exceptions.length
      ? output.quality_threshold_exceptions.map((item) => `- ${escapeMd(item.venue_name)}: score ${item.score}, ${escapeMd(item.google_photo_reference.slice(0, 90))}...`).join('\n')
      : '- none',
    '',
    '## Blockers',
    '',
    output.blockers.length ? output.blockers.map((blocker) => `- ${escapeMd(blocker)}`).join('\n') : '- none',
    '',
    '## Warnings',
    '',
    output.warnings.length ? output.warnings.map((warning) => `- ${escapeMd(warning)}`).join('\n') : '- none',
  ].join('\n');
}

async function main() {
  const selection = readJson<{
    selected?: SelectedGalleryAsset[];
    selected_count?: number;
    duplicate_rows_removed?: number;
    quality_threshold_exceptions?: number;
  }>('data/gallery_enrichment_selection.json', { selected: [] });
  const materialization = readJson<{ images?: MaterializedGalleryAsset[]; mode?: string }>('data/gallery_enrichment_materialization.json', { images: [] });
  const upsert = readJson<{ actions?: UpsertAction[]; would_insert?: number; skipped?: number; mode?: string }>('data/gallery_enrichment_upsert.json', { actions: [] });
  const audit = readJson<{ venues?: GalleryAuditVenue[] }>('data/public_gallery_quality_audit.json', { venues: [] });

  const selected = selection.selected || [];
  const materialized = materialization.images || [];
  const wouldInsertActions = (upsert.actions || []).filter((action) => action.action === 'would_insert');
  const fallbackVenueIds = new Set((audit.venues || [])
    .filter((venue) => venue.statuses.includes('fallback_unresolved'))
    .map((venue) => venue.venue_id));
  const blockers: string[] = [];
  const warnings: string[] = [];

  const selectedDupRef = duplicateKeys(selected, (item) => `${item.venue_id}|${item.google_photo_reference}`);
  const selectedDupSort = duplicateKeys(selected, (item) => `${item.venue_id}|${item.selected_role}|${item.sort_order}`);
  const selectedDupPublicId = duplicateKeys(materialized, (item) => `${item.venue_id}|${item.public_id || ''}`);
  const wouldInsertDupPublicId = duplicateKeys(wouldInsertActions, (item) => item.public_id || '');
  const wouldInsertDupSort = duplicateKeys(wouldInsertActions, (item) => `${item.venue_id}|gallery|${materialized.find((image) => image.public_id === item.public_id)?.sort_order ?? ''}`);

  if (selectedDupRef.length) blockers.push(`duplicate selected venue_id + google_photo_reference: ${selectedDupRef.length}`);
  if (selectedDupSort.length) blockers.push(`duplicate selected venue_id + role + sort_order: ${selectedDupSort.length}`);
  if (selectedDupPublicId.length) blockers.push(`duplicate materialized public_id: ${selectedDupPublicId.length}`);
  if (wouldInsertDupPublicId.length) blockers.push(`duplicate would_insert public_id: ${wouldInsertDupPublicId.length}`);
  if (wouldInsertDupSort.length) blockers.push(`duplicate would_insert venue_id + role + sort_order: ${wouldInsertDupSort.length}`);

  for (const item of selected) {
    if (item.selection_score <= 0) blockers.push(`${item.venue_name}: score 0 selected`);
    if (item.vision?.product_only) blockers.push(`${item.venue_name}: product-only selected`);
    if (item.vision?.storefront_only) blockers.push(`${item.venue_name}: storefront-only selected`);
    if (item.vision?.menu_only) blockers.push(`${item.venue_name}: menu-only selected`);
    if (fallbackVenueIds.has(item.venue_id)) blockers.push(`${item.venue_name}: fallback unresolved venue selected`);
    if (item.selected_role !== 'gallery') blockers.push(`${item.venue_name}: non-gallery selected role ${item.selected_role}`);
    if (item.selection_reason === 'low_score_but_unique_spatial_evidence') {
      warnings.push(`${item.venue_name}: low score allowed because it is unique spatial evidence`);
    }
  }

  for (const image of materialized) {
    if (image.selected_role !== 'gallery' || image.role === 'hero' || image.role === 'card') {
      blockers.push(`${image.venue_name}: materialization includes non-gallery role`);
    }
  }

  const venuesReceivingAssets = Array.from(new Set(wouldInsertActions.map((action) => action.venue_name))).sort();
  const qualityThresholdExceptions = selected
    .filter((item) => item.selection_reason === 'low_score_but_unique_spatial_evidence')
    .map((item) => ({
      venue_name: item.venue_name,
      google_photo_reference: item.google_photo_reference,
      score: item.selection_score,
    }));

  const output = {
    generated_at: new Date().toISOString(),
    write_ready: blockers.length === 0,
    selected_count: selected.length,
    would_insert_count: wouldInsertActions.length,
    skipped_count: (upsert.actions || []).filter((action) => action.action === 'skipped').length,
    duplicate_counts: {
      selected_venue_ref: selectedDupRef.length,
      selected_venue_role_sort: selectedDupSort.length,
      materialized_public_id: selectedDupPublicId.length,
      would_insert_public_id: wouldInsertDupPublicId.length,
      would_insert_venue_role_sort: wouldInsertDupSort.length,
    },
    venues_receiving_assets: venuesReceivingAssets,
    quality_threshold_exceptions: qualityThresholdExceptions,
    blockers,
    warnings,
    source_modes: {
      materialization: materialization.mode || 'unknown',
      upsert: upsert.mode || 'unknown',
    },
  };

  writeJsonMd('gallery_enrichment_write_readiness.json', 'gallery_enrichment_write_readiness.md', output, markdown(output));
  console.log(JSON.stringify({
    write_ready: output.write_ready,
    selected_count: output.selected_count,
    would_insert_count: output.would_insert_count,
    duplicate_counts: output.duplicate_counts,
    blockers: output.blockers.length,
    warnings: output.warnings.length,
  }, null, 2));

  if (!output.write_ready) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

