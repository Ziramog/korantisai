import { createServiceSupabaseClient } from '../enrichment/supabase_enrichment_utils';
import { escapeMd, normalizeName, readJson } from '../enrichment/enrichment_utils';
import {
  loadPublicVenueLookup,
  publicVenueFromValidation,
  writeReport,
  type PublicVenueRow,
  type ValidationOutput,
} from './publishing_utils';

type PublishResult = {
  generated_at: string;
  mode: 'dry-run' | 'write';
  write_blocked: boolean;
  public_venues_before: number;
  public_venues_after: number | null;
  candidates_requested: number;
  rows_to_insert: PublicVenueRow[];
  inserted: Array<{ id: string; name: string; category: string }>;
  skipped: Array<{ name: string; reason: string }>;
  errors: string[];
};

function markdown(result: PublishResult) {
  return [
    '# Publish Batch 16 Candidates',
    '',
    `Generated: ${result.generated_at}`,
    `Mode: ${result.mode}`,
    `Write blocked: ${result.write_blocked ? 'yes' : 'no'}`,
    `Public venues before: ${result.public_venues_before}`,
    `Public venues after: ${result.public_venues_after ?? 'not written'}`,
    `Candidates requested: ${result.candidates_requested}`,
    `Rows to insert: ${result.rows_to_insert.length}`,
    `Inserted: ${result.inserted.length}`,
    `Skipped: ${result.skipped.length}`,
    '',
    '## Inserted / Planned',
    '',
    '| Venue | ID | Category |',
    '|---|---|---|',
    ...(result.mode === 'write' ? result.inserted : result.rows_to_insert).map((row) => {
      const id = 'id' in row ? row.id : '';
      const name = 'name' in row ? row.name : '';
      const category = 'category' in row ? row.category : '';
      return `| ${escapeMd(name)} | ${escapeMd(id)} | ${escapeMd(category)} |`;
    }),
    '',
    '## Skipped',
    '',
    result.skipped.length ? result.skipped.map((item) => `- ${item.name}: ${item.reason}`).join('\n') : '- none',
    '',
    '## Errors',
    '',
    result.errors.length ? result.errors.map((error) => `- ${error}`).join('\n') : '- none',
  ].join('\n');
}

async function main() {
  const writeMode = process.argv.includes('--write');
  const validation = await readJson<ValidationOutput>('data/publish_batch_16_validation.json');
  const publicVenues = await loadPublicVenueLookup();
  const publicById = new Map(publicVenues.map((venue) => [venue.id, venue]));
  const publicByName = new Map(publicVenues.map((venue) => [normalizeName(venue.name), venue]));
  const skipped: PublishResult['skipped'] = [];
  const errors: string[] = [];
  const rowsToInsert: PublicVenueRow[] = [];

  if (validation.blocked_count > 0 || validation.valid_count !== validation.approved_count) {
    errors.push('validation output is not fully clear; rerun validation and resolve blockers');
  }

  for (const venue of validation.venues) {
    if (publicById.has(venue.public_venue_id)) {
      skipped.push({ name: venue.name, reason: 'public venue id already exists' });
      continue;
    }
    if (publicByName.has(normalizeName(venue.name))) {
      skipped.push({ name: venue.name, reason: 'public venue name already exists' });
      continue;
    }
    rowsToInsert.push(publicVenueFromValidation(venue));
  }

  const result: PublishResult = {
    generated_at: new Date().toISOString(),
    mode: writeMode ? 'write' : 'dry-run',
    write_blocked: errors.length > 0 || skipped.length > 0,
    public_venues_before: publicVenues.length,
    public_venues_after: null,
    candidates_requested: validation.approved_count,
    rows_to_insert: rowsToInsert,
    inserted: [],
    skipped,
    errors,
  };

  if (writeMode && !result.write_blocked) {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('venues')
      .insert(rowsToInsert)
      .select('id,name,category');

    if (error) {
      result.errors.push(error.message);
      result.write_blocked = true;
    } else {
      result.inserted = (data || []) as PublishResult['inserted'];
      const after = await loadPublicVenueLookup();
      result.public_venues_after = after.length;
    }
  }

  await writeReport('publish_batch_16_publish.json', 'publish_batch_16_publish.md', result, markdown(result));

  console.log(`${writeMode ? 'Write' : 'Dry-run'} publish: ${rowsToInsert.length} rows planned, ${result.inserted.length} inserted`);
  if (result.write_blocked || result.errors.length > 0) {
    console.error('Publish blocked');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

