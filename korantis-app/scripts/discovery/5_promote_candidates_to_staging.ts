import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';
import type { ScoredCandidateVenue } from './types';
import { DISCOVERY_DATA_DIR, hasFlag, readJsonFile } from './utils';

type CandidateVenuesFile = {
  candidates: ScoredCandidateVenue[];
};

async function main() {
  const candidatesFile = readJsonFile<CandidateVenuesFile>(path.join(DISCOVERY_DATA_DIR, 'candidate_venues.json'));
  const approved = candidatesFile.candidates.filter((candidate) => candidate.status === 'approved_for_enrichment');

  console.log(`Approved candidates eligible for staging: ${approved.length}`);

  if (approved.length === 0) {
    console.log('No approved_for_enrichment candidates. Nothing to promote.');
    return;
  }

  if (!hasFlag('apply')) {
    console.log('Dry run only. Pass --apply to insert approved candidates into staging_venues.');
    for (const candidate of approved) {
      console.log(`Would stage: ${candidate.venue_name} (${candidate.district}, ${candidate.category})`);
    }
    return;
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase environment variables.');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  for (const candidate of approved) {
    const { error } = await supabase.from('staging_venues').insert({
      id: candidate.candidate_id,
      name: candidate.venue_name,
      city: 'buenos_aires',
      category_seed: candidate.category,
      status: 'pending',
      canonical_data: {
        source: 'curated_discovery_engine',
        candidate_id: candidate.candidate_id,
        district: candidate.district,
        canonical_name: candidate.canonical_name,
        aliases: candidate.aliases,
        source_count: candidate.source_count,
        consensus_score: candidate.consensus_score,
        discovery_score: candidate.discovery_score,
        sources: candidate.sources,
        requires_google_enrichment: true,
      },
    });

    if (error) throw new Error(`Unable to stage ${candidate.venue_name}: ${error.message}`);
    console.log(`Staged approved candidate: ${candidate.venue_name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
