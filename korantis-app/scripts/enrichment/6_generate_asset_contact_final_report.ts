import {
  readJson,
  writeJsonAndMarkdown,
  type CategoryProposal,
} from './enrichment_utils';

type AssetReadiness = {
  candidates?: Array<{
    venue: string;
    already_public: boolean;
    match_status: string;
    eligibility_status: string;
    normalized_category_confidence: number;
    has_cloudinary_hero: boolean;
    has_cloudinary_card: boolean;
    gallery_count: number;
    acceptable_hero_from_vision: boolean;
    reason_not_publish_ready: string[];
  }>;
};

type ContactEnrichment = {
  records?: Array<{
    scope: string;
    links?: Array<{ type: string }>;
    opening_hours_available?: boolean;
    address?: string;
  }>;
};

type PhotoRefs = {
  venues?: Array<{ venue_name: string; selected_photos?: unknown[] }>;
  skipped?: Array<{ venue_name: string; skipped_reason?: string }>;
};

type Materialization = {
  mode?: string;
  images_uploaded?: number;
  images_dry_run?: number;
  images?: Array<{ venue_name: string; status: string }>;
};

type CategoryMapping = {
  mappings?: Array<{ write_safe: boolean; scope: string }>;
};

function countBy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate).length;
}

function fieldCompleteness(records: NonNullable<ContactEnrichment['records']>, type: string) {
  return records.filter((record) => record.links?.some((link) => link.type === type)).length;
}

function markdown(params: {
  assets: AssetReadiness;
  contacts: ContactEnrichment;
  photoRefs: PhotoRefs;
  materialization: Materialization;
  categoryMapping: CategoryMapping;
  proposals: CategoryProposal[];
}) {
  const candidates = params.assets.candidates || [];
  const nonPublic = candidates.filter((candidate) => !candidate.already_public);
  const contacts = params.contacts.records || [];
  const publicContacts = contacts.filter((record) => record.scope === 'public');
  const candidateContacts = contacts.filter((record) => record.scope === 'candidate');
  const imageReady = nonPublic.filter((candidate) => candidate.has_cloudinary_hero && candidate.has_cloudinary_card && candidate.gallery_count > 0);
  const imageBlocked = nonPublic.filter((candidate) => !candidate.has_cloudinary_hero || !candidate.has_cloudinary_card);
  const eligibilityBlocked = nonPublic.filter((candidate) => candidate.eligibility_status !== 'active');
  const categoryBlocked = nonPublic.filter((candidate) => candidate.normalized_category_confidence < 75);
  const materializedCandidates = new Set((params.materialization.images || []).filter((image) => image.status === 'uploaded').map((image) => image.venue_name));
  const candidateRefs = params.photoRefs.venues || [];
  const writeSafeCategoryMappings = (params.categoryMapping.mappings || []).filter((mapping) => mapping.write_safe).length;
  const categoryMediumOrHigh = params.proposals.filter((proposal) => proposal.confidence < 75 || proposal.warnings.length > 0).length;
  const recommendation = categoryMediumOrHigh > 0
    ? 'D) repair category normalization'
    : imageBlocked.length > 0
      ? 'B) materialize more candidate images'
      : fieldCompleteness(contacts, 'website') < contacts.length / 2
        ? 'C) repair contact data'
        : 'A) publish 20-30';

  return [
    '# Venue Asset & Contact Enrichment Final Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Existing public venue contact records: ${publicContacts.length}`,
    `- Publish candidate contact records: ${candidateContacts.length}`,
    `- Non-public candidates audited: ${nonPublic.length}`,
    `- Candidates with selected photo refs: ${candidateRefs.length}`,
    `- Candidates image-ready now: ${imageReady.length}`,
    `- Candidates materialized in this run: ${materializedCandidates.size}`,
    `- Candidates still blocked by images: ${imageBlocked.length}`,
    `- Candidates still blocked by eligibility: ${eligibilityBlocked.length}`,
    `- Candidates still blocked by category confidence: ${categoryBlocked.length}`,
    `- Write-safe category mappings: ${writeSafeCategoryMappings}/${(params.categoryMapping.mappings || []).length}`,
    `- Recommendation: ${recommendation}`,
    '',
    '## Existing Public Venue Contact Completeness',
    '',
    `- Phone: ${fieldCompleteness(publicContacts, 'phone')}/${publicContacts.length}`,
    `- Website: ${fieldCompleteness(publicContacts, 'website')}/${publicContacts.length}`,
    `- Google Maps: ${fieldCompleteness(publicContacts, 'google_maps')}/${publicContacts.length}`,
    `- Opening hours: ${countBy(publicContacts, (record) => Boolean(record.opening_hours_available))}/${publicContacts.length}`,
    `- Address: ${countBy(publicContacts, (record) => Boolean(record.address))}/${publicContacts.length}`,
    '',
    '## Publish Candidate Asset Completeness',
    '',
    `- Cloudinary hero: ${countBy(nonPublic, (candidate) => candidate.has_cloudinary_hero)}/${nonPublic.length}`,
    `- Cloudinary card: ${countBy(nonPublic, (candidate) => candidate.has_cloudinary_card)}/${nonPublic.length}`,
    `- Gallery present: ${countBy(nonPublic, (candidate) => candidate.gallery_count > 0)}/${nonPublic.length}`,
    `- Acceptable vision hero: ${countBy(nonPublic, (candidate) => candidate.acceptable_hero_from_vision)}/${nonPublic.length}`,
    '',
    '## Candidates Still Blocked By Images',
    '',
    ...(imageBlocked.length ? imageBlocked.slice(0, 80).map((candidate) => `- ${candidate.venue}: ${candidate.reason_not_publish_ready.join('; ')}`) : ['- None']),
    '',
    '## Candidates Still Blocked By Eligibility',
    '',
    ...(eligibilityBlocked.length ? eligibilityBlocked.map((candidate) => `- ${candidate.venue}: ${candidate.eligibility_status}`) : ['- None']),
    '',
    '## Contact Completeness By Field',
    '',
    `- Phone: ${fieldCompleteness(contacts, 'phone')}/${contacts.length}`,
    `- Website: ${fieldCompleteness(contacts, 'website')}/${contacts.length}`,
    `- Google Maps: ${fieldCompleteness(contacts, 'google_maps')}/${contacts.length}`,
    `- Instagram: ${fieldCompleteness(contacts, 'instagram')}/${contacts.length}`,
    `- WhatsApp: ${fieldCompleteness(contacts, 'whatsapp')}/${contacts.length}`,
    `- Reservation: ${fieldCompleteness(contacts, 'reservation')}/${contacts.length}`,
    '',
    '## Reservation / Contact Monetization Opportunities',
    '',
    '- Google Maps and official website links can support low-risk outbound action paths once exposed by API.',
    '- Reservation, WhatsApp, Instagram, menu, and booking links should only be activated after official-site extraction or manual verification.',
    '- Candidate image materialization should happen before another publish wave; contact links can be additive and non-blocking.',
    '',
    '## Final Recommendation',
    '',
    recommendation,
  ].join('\n');
}

async function main() {
  const [assets, contacts, photoRefs, materialization, categoryMapping, proposalsFile] = await Promise.all([
    readJson<AssetReadiness>('data/publish_candidate_asset_readiness.json', { candidates: [] }),
    readJson<ContactEnrichment>('data/google_contact_enrichment.json', { records: [] }),
    readJson<PhotoRefs>('data/publish_candidate_photo_refs.json', { venues: [], skipped: [] }),
    readJson<Materialization>('data/publish_candidate_cloudinary_materialization.json', { images: [] }),
    readJson<CategoryMapping>('data/category_normalization_publish_mapping.json', { mappings: [] }),
    readJson<{ proposals: CategoryProposal[] }>('data/category_normalization_proposals.json', { proposals: [] }),
  ]);
  const report = markdown({ assets, contacts, photoRefs, materialization, categoryMapping, proposals: proposalsFile.proposals });
  const payload = {
    generated_at: new Date().toISOString(),
    recommendation: report.split('## Final Recommendation')[1]?.trim() || '',
    source_reports: [
      'category_normalization_publish_mapping.json',
      'publish_candidate_asset_readiness.json',
      'publish_candidate_photo_refs.json',
      'publish_candidate_cloudinary_materialization.json',
      'google_contact_enrichment.json',
      'official_contact_links.json',
    ],
  };

  await writeJsonAndMarkdown('venue_asset_contact_enrichment_final_report.json', 'venue_asset_contact_enrichment_final_report.md', payload, report);
  console.log('Venue asset/contact final report written.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
