import {
  createSupabase,
  escapeMd,
  readJson,
  writeJsonMd,
  type MaterializedGalleryAsset,
  type VenueImage,
} from './gallery_quality_utils';

type Action = {
  venue_name: string;
  venue_id: string;
  action: 'would_insert' | 'inserted' | 'skipped';
  reason?: string;
  public_id?: string;
};

function duplicate(existing: VenueImage[], image: MaterializedGalleryAsset) {
  return existing.some((row) => (
    row.public_id === image.public_id ||
    row.google_photo_reference === image.google_photo_reference ||
    (
      row.venue_id === image.venue_id &&
      row.role === 'gallery' &&
      Number(row.sort_order || 0) === Number(image.sort_order)
    )
  ));
}

function markdown(actions: Action[], mode: string) {
  return [
    '# Gallery Enrichment Upsert',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${mode}`,
    '',
    `- Inserted/would insert: ${actions.filter((action) => action.action === 'inserted' || action.action === 'would_insert').length}`,
    `- Skipped: ${actions.filter((action) => action.action === 'skipped').length}`,
    '',
    '| Venue | Action | Public ID | Reason |',
    '|---|---|---|---|',
    ...actions.map((action) => `| ${escapeMd(action.venue_name)} | ${action.action} | ${escapeMd(action.public_id)} | ${escapeMd(action.reason || '')} |`),
  ].join('\n');
}

async function main() {
  const write = process.argv.includes('--write');
  const payload = readJson<{ images: MaterializedGalleryAsset[] }>('data/gallery_enrichment_materialization.json', { images: [] });
  const images = payload.images.filter((image) => image.status === 'uploaded' || image.status === 'dry_run');
  const supabase = createSupabase();
  const venueIds = Array.from(new Set(images.map((image) => image.venue_id)));
  const { data, error } = await supabase
    .from('venue_images')
    .select('id,venue_id,google_photo_reference,public_id,role,sort_order')
    .in('venue_id', venueIds.length ? venueIds : ['__none__']);
  if (error) throw error;

  const existingByVenue = new Map<string, VenueImage[]>();
  const plannedKeys = new Set<string>();
  for (const row of (data || []) as VenueImage[]) {
    const current = existingByVenue.get(row.venue_id) || [];
    current.push(row);
    existingByVenue.set(row.venue_id, current);
  }

  const actions: Action[] = [];
  for (const image of images) {
    const existing = existingByVenue.get(image.venue_id) || [];
    if (image.selected_role !== 'gallery') {
      actions.push({ venue_name: image.venue_name, venue_id: image.venue_id, action: 'skipped', reason: 'only gallery role is allowed', public_id: image.public_id });
      continue;
    }
    const planKeys = [
      `public_id:${image.public_id || ''}`,
      `ref:${image.venue_id}|${image.google_photo_reference}`,
      `sort:${image.venue_id}|gallery|${image.sort_order}`,
    ];
    const plannedDuplicate = planKeys.some((key) => plannedKeys.has(key));
    if (plannedDuplicate) {
      actions.push({ venue_name: image.venue_name, venue_id: image.venue_id, action: 'skipped', reason: 'duplicate within planned inserts', public_id: image.public_id });
      continue;
    }
    if (duplicate(existing, image)) {
      actions.push({ venue_name: image.venue_name, venue_id: image.venue_id, action: 'skipped', reason: 'duplicate ref/public_id/sort_order', public_id: image.public_id });
      continue;
    }
    if (write && image.status !== 'uploaded') {
      actions.push({ venue_name: image.venue_name, venue_id: image.venue_id, action: 'skipped', reason: 'write requires uploaded Cloudinary asset', public_id: image.public_id });
      continue;
    }

    const row = {
      venue_id: image.venue_id,
      photo_reference: image.google_photo_reference,
      google_photo_reference: image.google_photo_reference,
      role: 'gallery',
      sort_order: image.sort_order,
      source: 'google_places_gallery_enrichment',
      url: image.url || null,
      secure_url: image.secure_url || null,
      public_id: image.public_id || null,
      width: image.width || null,
      height: image.height || null,
      bytes: image.bytes || null,
      format: image.format || null,
      quality_score: image.selection_score,
      hero_suitability_score: image.vision?.hero_suitability_score || null,
      is_cover: false,
      status: write ? 'processed' : 'dry_run',
      updated_at: new Date().toISOString(),
    };

    if (write) {
      const { error: insertError } = await supabase.from('venue_images').insert(row);
      if (insertError) throw new Error(`Unable to insert ${image.venue_name}: ${insertError.message}`);
      existing.push({ ...row, id: image.public_id || image.google_photo_reference });
      existingByVenue.set(image.venue_id, existing);
    }

    actions.push({ venue_name: image.venue_name, venue_id: image.venue_id, action: write ? 'inserted' : 'would_insert', public_id: image.public_id });
    for (const key of planKeys) plannedKeys.add(key);
  }

  const output = {
    generated_at: new Date().toISOString(),
    mode: write ? 'write' : 'dry-run',
    inserted: actions.filter((action) => action.action === 'inserted').length,
    would_insert: actions.filter((action) => action.action === 'would_insert').length,
    skipped: actions.filter((action) => action.action === 'skipped').length,
    actions,
  };

  writeJsonMd('gallery_enrichment_upsert.json', 'gallery_enrichment_upsert.md', output, markdown(actions, output.mode));
  console.log(JSON.stringify({ mode: output.mode, inserted: output.inserted, would_insert: output.would_insert, skipped: output.skipped }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
