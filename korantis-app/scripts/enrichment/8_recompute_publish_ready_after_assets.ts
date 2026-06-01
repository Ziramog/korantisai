import {
  escapeMd,
  loadControlledBatch,
  mapByCandidateId,
  normalizeName,
  readJson,
  writeJsonAndMarkdown,
} from './enrichment_utils';

type UpsertOutput = {
  rows?: Array<{
    venue_name: string;
    role: string;
    status: 'dry_run' | 'upserted' | 'skipped' | 'error';
  }>;
};

type CategoryMappingFile = {
  mappings?: Array<{
    venue: string;
    scope: string;
    normalized_category: string;
    write_safe: boolean;
  }>;
};

type CandidateStatus = {
  venue: string;
  candidate_id: string;
  district: string;
  normalized_category: string;
  eligibility_status: string;
  match_status: string;
  has_hero: boolean;
  has_card: boolean;
  gallery_count: number;
  category_write_safe: boolean;
  publish_ready: boolean;
  reasons: string[];
};

function hasRole(rows: NonNullable<UpsertOutput['rows']>, venue: string, role: string) {
  return rows.some((row) => normalizeName(row.venue_name) === normalizeName(venue) && row.role === role && (row.status === 'upserted' || row.status === 'dry_run'));
}

function galleryCount(rows: NonNullable<UpsertOutput['rows']>, venue: string) {
  return rows.filter((row) => normalizeName(row.venue_name) === normalizeName(venue) && row.role === 'gallery' && (row.status === 'upserted' || row.status === 'dry_run')).length;
}

function countBy(items: CandidateStatus[], key: keyof CandidateStatus) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] || 'unknown');
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function formatCounts(counts: Record<string, number>) {
  return Object.entries(counts).sort(([, a], [, b]) => b - a).map(([key, count]) => `- ${key}: ${count}`);
}

function markdown(rows: CandidateStatus[]) {
  const ready = rows.filter((row) => row.publish_ready);
  const blocked = rows.filter((row) => !row.publish_ready);
  const suggested = ready.slice(0, 20);
  const recommendation = ready.length >= 10 ? 'A) Publish 10-20 candidates'
    : rows.some((row) => !row.has_hero || !row.has_card || row.gallery_count === 0) ? 'B) Materialize more candidate images'
      : rows.some((row) => row.eligibility_status !== 'active') ? 'C) Repair candidate eligibility'
        : rows.some((row) => !row.category_write_safe) ? 'E) Repair category normalization'
          : 'D) Improve contact data';

  return [
    '# Publish-Ready After Candidate Assets',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Candidates now publish-ready: ${ready.length}`,
    `- Candidates still blocked: ${blocked.length}`,
    `- Suggested first publish batch: ${suggested.length}`,
    `- Recommendation: ${recommendation}`,
    '',
    '## Category Distribution',
    '',
    ...formatCounts(countBy(ready, 'normalized_category')),
    '',
    '## District Distribution',
    '',
    ...formatCounts(countBy(ready, 'district')),
    '',
    '## Suggested First Publish Batch',
    '',
    ...(suggested.length ? suggested.map((row, index) => `${index + 1}. ${row.venue} - ${row.normalized_category} - ${row.district}`) : ['- None']),
    '',
    '## Candidate Readiness',
    '',
    '| Venue | Ready | Match | Eligibility | Category | Hero | Card | Gallery | Reasons |',
    '| --- | --- | --- | --- | --- | --- | --- | ---: | --- |',
    ...rows.map((row) => `| ${escapeMd(row.venue)} | ${row.publish_ready ? 'yes' : 'no'} | ${row.match_status} | ${row.eligibility_status} | ${row.normalized_category} | ${row.has_hero ? 'yes' : 'no'} | ${row.has_card ? 'yes' : 'no'} | ${row.gallery_count} | ${escapeMd(row.reasons.join('; '))} |`),
  ].join('\n');
}

async function main() {
  const [batch, upsert] = await Promise.all([
    loadControlledBatch(),
    readJson<UpsertOutput>('data/candidate_image_assets_upsert_output.json', { rows: [] }),
  ]);
  const categoryMapping = await readJson<CategoryMappingFile>('data/category_normalization_publish_mapping.json', { mappings: [] });
  const googleById = mapByCandidateId(batch.googleRecords);
  const categoryByName = new Map((categoryMapping.mappings || [])
    .filter((mapping) => mapping.scope === 'candidate')
    .map((mapping) => [normalizeName(mapping.venue), mapping]));
  const upsertRows = upsert.rows || [];
  const statuses: CandidateStatus[] = [];

  for (const output of batch.intelligence) {
    const google = googleById.get(output.candidate_id);
    const categoryMappingRow = categoryByName.get(normalizeName(output.venue_name));
    const hasHero = hasRole(upsertRows, output.venue_name, 'hero');
    const hasCard = hasRole(upsertRows, output.venue_name, 'card');
    const galleries = galleryCount(upsertRows, output.venue_name);
    const matchStatus = google?.status || output.match_status || 'missing';
    const eligibilityStatus = output.eligibility?.status || 'missing';
    const categoryWriteSafe = Boolean(categoryMappingRow?.write_safe);
    const reasons = [
      matchStatus !== 'matched' ? `match status ${matchStatus}` : '',
      eligibilityStatus !== 'active' ? `eligibility ${eligibilityStatus}` : '',
      !hasHero ? 'missing Cloudinary hero' : '',
      !hasCard ? 'missing Cloudinary card' : '',
      galleries === 0 ? 'missing gallery' : '',
      !categoryWriteSafe ? 'category not write-safe' : '',
      output.eligibility?.status === 'rejected' ? `hard rejection: ${(output.eligibility.reasons || []).join('; ')}` : '',
    ].filter(Boolean);

    statuses.push({
      venue: output.venue_name,
      candidate_id: output.candidate_id,
      district: output.district,
      normalized_category: categoryMappingRow?.normalized_category || output.category,
      eligibility_status: eligibilityStatus,
      match_status: matchStatus,
      has_hero: hasHero,
      has_card: hasCard,
      gallery_count: galleries,
      category_write_safe: categoryWriteSafe,
      publish_ready: reasons.length === 0,
      reasons,
    });
  }

  const payload = {
    generated_at: new Date().toISOString(),
    summary: {
      publish_ready: statuses.filter((row) => row.publish_ready).length,
      blocked: statuses.filter((row) => !row.publish_ready).length,
    },
    candidates: statuses,
  };

  await writeJsonAndMarkdown('publish_ready_after_candidate_assets.json', 'publish_ready_after_candidate_assets.md', payload, markdown(statuses));
  console.log(`Publish-ready after assets: ${payload.summary.publish_ready}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
