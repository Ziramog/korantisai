import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';

type GooglePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
};

type EnrichmentRecord = {
  candidate_id: string;
  candidate_name: string;
  google_place_id: string | null;
  status: string;
  google_data: {
    photos?: GooglePhoto[];
  } | null;
};

type EnrichmentFile = {
  records: EnrichmentRecord[];
};

type PhotoInput = {
  candidate_id: string;
  google_place_id: string;
  venue_name: string;
  photo_reference: string;
  width: number | null;
  height: number | null;
  order: number;
  source: 'google';
  vision_status: 'not_evaluated';
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function photoInputsFor(record: EnrichmentRecord): PhotoInput[] {
  if (!record.google_place_id) return [];
  return (record.google_data?.photos || [])
    .filter((photo) => typeof photo.name === 'string' && photo.name.length > 0)
    .slice(0, 10)
    .map((photo, index) => ({
      candidate_id: record.candidate_id,
      google_place_id: record.google_place_id as string,
      venue_name: record.candidate_name,
      photo_reference: photo.name as string,
      width: typeof photo.widthPx === 'number' ? photo.widthPx : null,
      height: typeof photo.heightPx === 'number' ? photo.heightPx : null,
      order: index + 1,
      source: 'google',
      vision_status: 'not_evaluated',
    }));
}

function main() {
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment.json'));
  const byVenue = enrichment.records.map((record) => {
    const photos = photoInputsFor(record);
    return {
      candidate_id: record.candidate_id,
      google_place_id: record.google_place_id,
      venue_name: record.candidate_name,
      status: record.status,
      photo_count: photos.length,
      enough_photo_material_for_vision: photos.length >= 3,
      photos,
    };
  });
  const photoInputs = byVenue.flatMap((venue) => venue.photos);
  const withPhotos = byVenue.filter((venue) => venue.photo_count > 0);
  const noPhotos = byVenue.filter((venue) => venue.photo_count === 0);
  const enough = byVenue.filter((venue) => venue.enough_photo_material_for_vision);

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_photo_inputs.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: photoInputs.length,
    venues: byVenue,
    photo_inputs: photoInputs,
  }, null, 2));

  const report = [
    '# Venue Intelligence Photo Precheck Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '',
    '- Reads Google photo references from the 16-candidate pilot enrichment output.',
    '- Does not download images.',
    '- Does not call a vision model.',
    '',
    '## Summary',
    '',
    `- Venues with photo references: ${withPhotos.length}`,
    `- Venues with no photo references: ${noPhotos.length}`,
    `- Total photo references selected: ${photoInputs.length}`,
    `- Venues with enough photo material for vision analysis: ${enough.length}`,
    '',
    '## Photo Counts',
    '',
    ...byVenue.map((venue) => `- ${venue.venue_name}: ${venue.photo_count} photos, enough for vision: ${venue.enough_photo_material_for_vision ? 'yes' : 'no'}`),
    '',
    '## Venues Without Photo References',
    '',
    ...(noPhotos.length ? noPhotos.map((venue) => `- ${venue.venue_name}`) : ['- None']),
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_photo_precheck_report.md'), report);
  console.log(report);
}

main();
