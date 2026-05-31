import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

async function hasColumn(table: string, column: string) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

async function main() {
  const apply = hasFlag('apply');
  const publicReady = await hasColumn('venues', 'curation_status');
  const stagingReady = await hasColumn('staging_venues', 'curation_status');

  const { data: publicVenues, error: publicError } = await supabase
    .from('venues')
    .select('id, name, city');
  if (publicError) throw new Error(`Unable to read venues: ${publicError.message}`);

  const { data: stagingVenues, error: stagingError } = await supabase
    .from('staging_venues')
    .select('id, name, city, status');
  if (stagingError) throw new Error(`Unable to read staging_venues: ${stagingError.message}`);

  const generatedPublic = (publicVenues || []).filter((venue) => !/^ChIJ/.test(venue.id));
  const generatedStaging = (stagingVenues || []).filter((venue) => venue.status === 'ready_for_review');

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    schema: {
      venuesCurationStatus: publicReady,
      stagingCurationStatus: stagingReady,
    },
    targets: {
      publicLegacyGeneratedToQuarantine: generatedPublic.length,
      stagingGeneratedToNeedsReprocess: generatedStaging.length,
    },
  }, null, 2));

  if (!apply) return;

  if (!publicReady || !stagingReady) {
    throw new Error('Curation schema is not applied. Run supabase/06_venue_curation_reset_schema.sql first.');
  }

  if (generatedPublic.length > 0) {
    const { error } = await supabase
      .from('venues')
      .update({
        curation_status: 'quarantined',
        curation_notes: 'Quarantined during venue curation reset; retained for admin comparison.',
      })
      .in('id', generatedPublic.map((venue) => venue.id));
    if (error) throw new Error(`Unable to quarantine public venues: ${error.message}`);
  }

  if (generatedStaging.length > 0) {
    const { error } = await supabase
      .from('staging_venues')
      .update({
        curation_status: 'needs_reprocess',
        curation_notes: 'Needs curation reset reprocessing from source evidence.',
      })
      .in('id', generatedStaging.map((venue) => venue.id));
    if (error) throw new Error(`Unable to mark staging venues: ${error.message}`);
  }

  console.log('Quarantine markers applied.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

