import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';
import type { District } from './types';
import { DISCOVERY_DATA_DIR, hasFlag, readJsonFile, writeJsonFile } from './utils';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const districts = readJsonFile<District[]>(path.join(DISCOVERY_DATA_DIR, 'buenos_aires_districts.json'));

async function main() {
  writeJsonFile(path.join(DISCOVERY_DATA_DIR, 'city_districts.seed.json'), districts);
  console.log(`Prepared ${districts.length} Buenos Aires districts.`);

  if (!hasFlag('apply')) {
    console.log('Dry run only. Pass --apply after applying supabase/07_curated_discovery_schema.sql to write city_districts.');
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase environment variables.');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.from('city_districts').upsert(
    districts.map((district) => ({
      city: district.city,
      district: district.district,
      subdistrict: district.subdistrict || null,
      priority: district.priority,
      venue_target: district.venue_target,
      district_identity_tags: district.district_identity_tags,
    })),
    { onConflict: 'city,district,subdistrict' }
  );

  if (error) throw new Error(`Unable to upsert city_districts: ${error.message}`);
  console.log('city_districts upsert complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
