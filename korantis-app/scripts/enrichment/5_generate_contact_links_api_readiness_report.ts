import { readFile } from 'node:fs/promises';
import { loadPublicVenues, readJson, writeJsonAndMarkdown } from './enrichment_utils';

type GoogleContactFile = {
  records?: Array<{
    scope: string;
    links?: Array<{ type: string }>;
  }>;
};

function hasRouteField(routeSource: string, field: string) {
  return routeSource.includes(field);
}

async function main() {
  const [{ venues }, routeSource, contact] = await Promise.all([
    loadPublicVenues(),
    readFile('src/app/api/venues/route.ts', 'utf8'),
    readJson<GoogleContactFile>('data/google_contact_enrichment.json', { records: [] }),
  ]);

  const sample = venues[0] || {};
  const currentFields = Object.keys(sample);
  const routeContactFields = {
    phone: hasRouteField(routeSource, 'phone'),
    website: hasRouteField(routeSource, 'website'),
    googleMapsUrl: hasRouteField(routeSource, 'googleMaps'),
    contact: hasRouteField(routeSource, 'contact'),
    instagram: hasRouteField(routeSource, 'instagram'),
    whatsapp: hasRouteField(routeSource, 'whatsapp'),
    reservationUrl: hasRouteField(routeSource, 'reservation'),
  };
  const sourceAvailability = {
    phone: contact.records?.filter((record) => record.links?.some((link) => link.type === 'phone')).length || 0,
    website: contact.records?.filter((record) => record.links?.some((link) => link.type === 'website')).length || 0,
    google_maps: contact.records?.filter((record) => record.links?.some((link) => link.type === 'google_maps')).length || 0,
  };

  const markdown = [
    '# Contact Links API Readiness Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Current /api/venues Contact Fields',
    '',
    `- Response fields present on sample venue: ${currentFields.join(', ')}`,
    `- Nested contact object present: ${routeContactFields.contact ? 'yes' : 'no'}`,
    `- Phone field present: ${routeContactFields.phone ? 'yes' : 'no'}`,
    `- Website field present: ${routeContactFields.website ? 'yes' : 'no'}`,
    `- Google Maps field present: ${routeContactFields.googleMapsUrl ? 'yes' : 'no'}`,
    `- Instagram field present: ${routeContactFields.instagram ? 'yes' : 'no'}`,
    `- WhatsApp field present: ${routeContactFields.whatsapp ? 'yes' : 'no'}`,
    `- Reservation field present: ${routeContactFields.reservationUrl ? 'yes' : 'no'}`,
    '',
    '## Source Data Availability',
    '',
    `- Phone links from Google enrichment: ${sourceAvailability.phone}`,
    `- Website links from Google enrichment: ${sourceAvailability.website}`,
    `- Google Maps links from Google enrichment: ${sourceAvailability.google_maps}`,
    '',
    '## Recommended Future Shape',
    '',
    '```json',
    JSON.stringify({
      contact: {
        phone: null,
        website: null,
        instagram: null,
        whatsapp: null,
        reservationUrl: null,
        googleMapsUrl: null,
      },
    }, null, 2),
    '```',
    '',
    '## Recommendation',
    '',
    '- Add `venue_contact_links` first, then expose a normalized `contact` object through `/api/venues` after data has been verified.',
    '- Do not add UI consumption until source confidence and explicit-link rules are stable.',
  ].join('\n');

  const payload = {
    generated_at: new Date().toISOString(),
    current_fields: currentFields,
    route_contact_fields: routeContactFields,
    source_availability: sourceAvailability,
    recommended_shape: {
      contact: {
        phone: null,
        website: null,
        instagram: null,
        whatsapp: null,
        reservationUrl: null,
        googleMapsUrl: null,
      },
    },
  };

  await writeJsonAndMarkdown('contact_links_api_readiness_report.json', 'contact_links_api_readiness_report.md', payload, markdown);
  console.log('Contact links API readiness report written.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

