import {
  escapeMd,
  loadControlledBatch,
  loadPublicVenues,
  mapByCandidateId,
  normalizeName,
  writeJsonAndMarkdown,
  type GoogleData,
  type GoogleRecord,
} from './enrichment_utils';

type ContactLink = {
  type: 'website' | 'phone' | 'google_maps';
  label: string;
  url?: string;
  phone_number?: string;
  source: 'google_places';
  confidence: number;
};

type ContactRecord = {
  venue: string;
  scope: 'public' | 'candidate';
  candidate_id?: string;
  google_place_id?: string | null;
  match_status: string;
  address?: string;
  price_level?: string | null;
  rating?: number | null;
  user_rating_count?: number | null;
  opening_hours_available: boolean;
  links: ContactLink[];
  missing_fields: string[];
};

function contactLinks(google: GoogleData | null | undefined): ContactLink[] {
  const links: ContactLink[] = [];
  if (!google) return links;

  if (google.websiteUri) {
    links.push({
      type: 'website',
      label: 'Website',
      url: google.websiteUri,
      source: 'google_places',
      confidence: 90,
    });
  }

  if (google.nationalPhoneNumber || google.internationalPhoneNumber) {
    links.push({
      type: 'phone',
      label: 'Phone',
      phone_number: google.internationalPhoneNumber || google.nationalPhoneNumber,
      source: 'google_places',
      confidence: 90,
    });
  }

  if (google.googleMapsUri) {
    links.push({
      type: 'google_maps',
      label: 'Google Maps',
      url: google.googleMapsUri,
      source: 'google_places',
      confidence: 95,
    });
  }

  return links;
}

function missingFields(google: GoogleData | null | undefined, links: ContactLink[]) {
  const missing: string[] = [];
  if (!links.some((link) => link.type === 'phone')) missing.push('phone');
  if (!links.some((link) => link.type === 'website')) missing.push('website');
  if (!links.some((link) => link.type === 'google_maps')) missing.push('google_maps');
  if (!google?.regularOpeningHours) missing.push('opening_hours');
  if (!google?.formattedAddress) missing.push('address');
  if (!google?.priceLevel) missing.push('price_level');
  return missing;
}

function recordFor(scope: ContactRecord['scope'], venue: string, googleRecord: GoogleRecord | undefined, candidateId?: string): ContactRecord {
  const google = googleRecord?.google_data;
  const links = contactLinks(google);
  return {
    venue,
    scope,
    candidate_id: candidateId,
    google_place_id: google?.id || googleRecord?.google_place_id || null,
    match_status: googleRecord?.status || 'missing',
    address: google?.formattedAddress,
    price_level: google?.priceLevel,
    rating: google?.rating,
    user_rating_count: google?.userRatingCount,
    opening_hours_available: Boolean(google?.regularOpeningHours),
    links,
    missing_fields: missingFields(google, links),
  };
}

function markdown(records: ContactRecord[]) {
  const publicRecords = records.filter((record) => record.scope === 'public');
  const candidateRecords = records.filter((record) => record.scope === 'candidate');
  const fieldCounts = {
    phone: records.filter((record) => record.links.some((link) => link.type === 'phone')).length,
    website: records.filter((record) => record.links.some((link) => link.type === 'website')).length,
    google_maps: records.filter((record) => record.links.some((link) => link.type === 'google_maps')).length,
    opening_hours: records.filter((record) => record.opening_hours_available).length,
    address: records.filter((record) => record.address).length,
  };

  return [
    '# Google Contact Enrichment',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Public venues checked: ${publicRecords.length}`,
    `- Active/matched publish candidates checked: ${candidateRecords.length}`,
    `- Phone available: ${fieldCounts.phone}/${records.length}`,
    `- Website available: ${fieldCounts.website}/${records.length}`,
    `- Google Maps available: ${fieldCounts.google_maps}/${records.length}`,
    `- Opening hours available: ${fieldCounts.opening_hours}/${records.length}`,
    `- Address available: ${fieldCounts.address}/${records.length}`,
    '',
    '| Venue | Scope | Match | Phone | Website | Google Maps | Opening hours | Missing |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...records.map((record) => `| ${escapeMd(record.venue)} | ${record.scope} | ${record.match_status} | ${record.links.some((link) => link.type === 'phone') ? 'yes' : 'no'} | ${record.links.some((link) => link.type === 'website') ? 'yes' : 'no'} | ${record.links.some((link) => link.type === 'google_maps') ? 'yes' : 'no'} | ${record.opening_hours_available ? 'yes' : 'no'} | ${escapeMd(record.missing_fields.join(', '))} |`),
  ].join('\n');
}

async function main() {
  const [{ venues: publicVenues }, batch] = await Promise.all([loadPublicVenues(), loadControlledBatch()]);
  const googleById = mapByCandidateId(batch.googleRecords);
  const googleByName = new Map(batch.googleRecords.map((record) => [normalizeName(record.candidate_name), record]));
  const records: ContactRecord[] = [];

  for (const venue of publicVenues) {
    records.push(recordFor('public', venue.name, googleByName.get(normalizeName(venue.name))));
  }

  for (const output of batch.intelligence) {
    const google = googleById.get(output.candidate_id);
    if ((google?.status || output.match_status) !== 'matched') continue;
    if (output.eligibility?.status !== 'active') continue;
    records.push(recordFor('candidate', output.venue_name, google, output.candidate_id));
  }

  const payload = {
    generated_at: new Date().toISOString(),
    summary: {
      total_records: records.length,
      public_records: records.filter((record) => record.scope === 'public').length,
      candidate_records: records.filter((record) => record.scope === 'candidate').length,
    },
    records,
  };

  await writeJsonAndMarkdown('google_contact_enrichment.json', 'google_contact_enrichment.md', payload, markdown(records));
  console.log(`Google contact records: ${records.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

