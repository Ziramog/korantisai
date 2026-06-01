import {
  escapeMd,
  fallbackCategoryProposal,
  loadControlledBatch,
  loadPublicVenues,
  mapByCandidateId,
  mapProposalsByName,
  mapPublicImagesByName,
  normalizeName,
  writeJsonAndMarkdown,
} from './enrichment_utils';

type AssetAuditRow = {
  venue: string;
  candidate_id: string;
  already_public: boolean;
  match_status: string;
  eligibility_status: string;
  normalized_category: string;
  normalized_category_confidence: number;
  has_cloudinary_hero: boolean;
  has_cloudinary_card: boolean;
  gallery_count: number;
  acceptable_hero_from_vision: boolean;
  photo_quality: number;
  reason_not_publish_ready: string[];
};

function markdown(rows: AssetAuditRow[]) {
  const nonPublic = rows.filter((row) => !row.already_public);
  return [
    '# Publish Candidate Asset Readiness',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total controlled candidates: ${rows.length}`,
    `- Non-public candidates: ${nonPublic.length}`,
    `- Non-public with acceptable vision hero: ${nonPublic.filter((row) => row.acceptable_hero_from_vision).length}`,
    `- Non-public with Cloudinary hero: ${nonPublic.filter((row) => row.has_cloudinary_hero).length}`,
    `- Non-public active/matched missing Cloudinary: ${nonPublic.filter((row) => row.match_status === 'matched' && row.eligibility_status === 'active' && !row.has_cloudinary_hero).length}`,
    '',
    '| Venue | Public | Match | Eligibility | Category | Cat confidence | Cloudinary hero | Cloudinary card | Gallery | Vision hero | Photo quality | Blockers |',
    '| --- | --- | --- | --- | --- | ---: | --- | --- | ---: | --- | ---: | --- |',
    ...rows.map((row) => `| ${escapeMd(row.venue)} | ${row.already_public ? 'yes' : 'no'} | ${row.match_status} | ${row.eligibility_status} | ${row.normalized_category} | ${row.normalized_category_confidence} | ${row.has_cloudinary_hero ? 'yes' : 'no'} | ${row.has_cloudinary_card ? 'yes' : 'no'} | ${row.gallery_count} | ${row.acceptable_hero_from_vision ? 'yes' : 'no'} | ${row.photo_quality} | ${escapeMd(row.reason_not_publish_ready.join('; ') || 'none')} |`),
  ].join('\n');
}

async function main() {
  const [{ venues: publicVenues }, batch] = await Promise.all([loadPublicVenues(), loadControlledBatch()]);
  const publicNames = new Set(publicVenues.map((venue) => normalizeName(venue.name)));
  const imagesByName = mapPublicImagesByName(publicVenues, batch.imageVerification);
  const googleById = mapByCandidateId(batch.googleRecords);
  const proposalsByName = mapProposalsByName(batch.proposals);
  const rows: AssetAuditRow[] = [];

  for (const output of batch.intelligence) {
    const nameKey = normalizeName(output.venue_name);
    const alreadyPublic = publicNames.has(nameKey);
    const google = googleById.get(output.candidate_id);
    const proposal = proposalsByName.get(nameKey) || fallbackCategoryProposal(output.venue_name, output.category);
    const image = imagesByName.get(nameKey);
    const blockers: string[] = [];
    const eligibilityStatus = output.eligibility?.status || 'missing';
    const matchStatus = google?.status || output.match_status || 'missing';
    const categoryConfidence = proposal.confidence;

    if (alreadyPublic) blockers.push('already public');
    if (matchStatus !== 'matched') blockers.push(`match status: ${matchStatus}`);
    if (eligibilityStatus !== 'active') blockers.push(`eligibility: ${eligibilityStatus}`);
    if (categoryConfidence < 75) blockers.push(`category confidence: ${categoryConfidence}`);
    if (!image?.cloudinaryHero) blockers.push('missing Cloudinary hero');
    if (!image?.cloudinaryCard) blockers.push('missing Cloudinary card');
    if (!output.photo_intelligence?.acceptable_hero_photo) blockers.push('vision hero not acceptable');

    rows.push({
      venue: output.venue_name,
      candidate_id: output.candidate_id,
      already_public: alreadyPublic,
      match_status: matchStatus,
      eligibility_status: eligibilityStatus,
      normalized_category: proposal.proposed_normalized_category,
      normalized_category_confidence: categoryConfidence,
      has_cloudinary_hero: Boolean(image?.cloudinaryHero),
      has_cloudinary_card: Boolean(image?.cloudinaryCard),
      gallery_count: image?.galleryCount || 0,
      acceptable_hero_from_vision: Boolean(output.photo_intelligence?.acceptable_hero_photo),
      photo_quality: output.photo_intelligence?.photo_quality_score || 0,
      reason_not_publish_ready: blockers,
    });
  }

  const payload = {
    generated_at: new Date().toISOString(),
    summary: {
      total_candidates: rows.length,
      non_public_candidates: rows.filter((row) => !row.already_public).length,
      active_matched_missing_cloudinary: rows.filter((row) => !row.already_public && row.match_status === 'matched' && row.eligibility_status === 'active' && !row.has_cloudinary_hero).length,
    },
    candidates: rows,
  };

  await writeJsonAndMarkdown('publish_candidate_asset_readiness.json', 'publish_candidate_asset_readiness.md', payload, markdown(rows));
  console.log(`Candidate asset rows: ${rows.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
