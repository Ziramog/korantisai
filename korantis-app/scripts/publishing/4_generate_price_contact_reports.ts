import { escapeMd } from '../enrichment/enrichment_utils';
import { loadPublishingInputs, writeReport } from './publishing_utils';

type AvailabilityRow = {
  venue: string;
  candidate_id: string;
  google_place_id: string | null;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: string | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  nationalPhoneNumber: string | null;
  internationalPhoneNumber: string | null;
};

type AvailabilityOutput = {
  generated_at: string;
  scope: string;
  total: number;
  price_level_available: number;
  website_available: number;
  google_maps_available: number;
  phone_available: number;
  rows: AvailabilityRow[];
  schema_note: string;
};

function priceMarkdown(output: AvailabilityOutput) {
  return [
    '# Price Data Availability',
    '',
    `Generated: ${output.generated_at}`,
    `Scope: ${output.scope}`,
    `Total venues: ${output.total}`,
    `Price level available: ${output.price_level_available}/${output.total}`,
    '',
    '## Rows',
    '',
    '| Venue | Google Place ID | Rating | Reviews | Price Level |',
    '|---|---|---:|---:|---|',
    ...output.rows.map((row) => `| ${escapeMd(row.venue)} | ${escapeMd(row.google_place_id || '')} | ${escapeMd(row.rating ?? 'null')} | ${escapeMd(row.userRatingCount ?? 'null')} | ${escapeMd(row.priceLevel ?? 'null')} |`),
    '',
    '## Schema Note',
    '',
    output.schema_note,
  ].join('\n');
}

function contactMarkdown(output: AvailabilityOutput) {
  return [
    '# Contact Data Availability',
    '',
    `Generated: ${output.generated_at}`,
    `Scope: ${output.scope}`,
    `Total venues: ${output.total}`,
    `Website available: ${output.website_available}/${output.total}`,
    `Google Maps available: ${output.google_maps_available}/${output.total}`,
    `Phone available: ${output.phone_available}/${output.total}`,
    '',
    '## Rows',
    '',
    '| Venue | Website | Google Maps | National Phone | International Phone |',
    '|---|---|---|---|---|',
    ...output.rows.map((row) => `| ${escapeMd(row.venue)} | ${escapeMd(row.websiteUri || 'null')} | ${escapeMd(row.googleMapsUri || 'null')} | ${escapeMd(row.nationalPhoneNumber || 'null')} | ${escapeMd(row.internationalPhoneNumber || 'null')} |`),
    '',
    '## Schema Note',
    '',
    output.schema_note,
  ].join('\n');
}

async function main() {
  const inputs = await loadPublishingInputs();
  const readyCandidates = inputs.ready.filter((item) => item.publish_ready);
  const googleByCandidateId = new Map(inputs.googleRecords.map((record) => [record.candidate_id, record]));
  const rows: AvailabilityRow[] = readyCandidates.map((candidate) => {
    const google = googleByCandidateId.get(candidate.candidate_id);
    return {
      venue: candidate.venue,
      candidate_id: candidate.candidate_id,
      google_place_id: google?.google_place_id || google?.google_data?.id || null,
      rating: google?.google_data?.rating ?? null,
      userRatingCount: google?.google_data?.userRatingCount ?? null,
      priceLevel: google?.google_data?.priceLevel ?? null,
      websiteUri: google?.google_data?.websiteUri ?? null,
      googleMapsUri: google?.google_data?.googleMapsUri ?? null,
      nationalPhoneNumber: google?.google_data?.nationalPhoneNumber ?? null,
      internationalPhoneNumber: google?.google_data?.internationalPhoneNumber ?? null,
    };
  });

  const output: AvailabilityOutput = {
    generated_at: new Date().toISOString(),
    scope: 'publish_ready_candidates_after_candidate_assets',
    total: rows.length,
    price_level_available: rows.filter((row) => row.priceLevel).length,
    website_available: rows.filter((row) => row.websiteUri).length,
    google_maps_available: rows.filter((row) => row.googleMapsUri).length,
    phone_available: rows.filter((row) => row.nationalPhoneNumber || row.internationalPhoneNumber).length,
    rows,
    schema_note: 'Google price/contact data is preserved in enrichment/report files. The current public.venues schema has no dedicated price/contact columns, so this pass does not write those fields into public.venues.',
  };

  await writeReport('price_data_availability_report.json', 'price_data_availability_report.md', output, priceMarkdown(output));
  await writeReport('contact_data_availability_report.json', 'contact_data_availability_report.md', output, contactMarkdown(output));

  console.log(`Generated price/contact availability reports for ${rows.length} publish-ready candidates`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

