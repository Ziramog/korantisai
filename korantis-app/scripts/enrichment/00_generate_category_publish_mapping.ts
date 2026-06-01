import {
  escapeMd,
  fallbackCategoryProposal,
  loadControlledBatch,
  loadPublicVenues,
  mapProposalsByName,
  normalizeName,
  writeJsonAndMarkdown,
  type CategoryProposal,
} from './enrichment_utils';

type MappingRow = {
  venue: string;
  scope: 'public' | 'candidate';
  current_category: string;
  normalized_category: string;
  display_category_en: string;
  display_category_es: string;
  confidence: number;
  reasons: string[];
  write_safe: boolean;
};

function toMapping(scope: MappingRow['scope'], venue: string, category: string, proposal: CategoryProposal): MappingRow {
  return {
    venue,
    scope,
    current_category: category,
    normalized_category: proposal.proposed_normalized_category,
    display_category_en: proposal.proposed_display_category_en,
    display_category_es: proposal.proposed_display_category_es,
    confidence: proposal.confidence,
    reasons: [...proposal.reasons, ...proposal.warnings],
    write_safe: proposal.confidence >= 75 && proposal.warnings.length === 0,
  };
}

function markdown(rows: MappingRow[]) {
  const writeSafe = rows.filter((row) => row.write_safe).length;
  return [
    '# Category Normalization Publish Mapping',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total mappings: ${rows.length}`,
    `- Write-safe mappings: ${writeSafe}`,
    `- Needs review: ${rows.length - writeSafe}`,
    '',
    '| Venue | Scope | Current | Normalized | Display EN | Display ES | Confidence | Write safe | Reasons |',
    '| --- | --- | --- | --- | --- | --- | ---: | --- | --- |',
    ...rows.map((row) => `| ${escapeMd(row.venue)} | ${row.scope} | ${escapeMd(row.current_category)} | ${row.normalized_category} | ${escapeMd(row.display_category_en)} | ${escapeMd(row.display_category_es)} | ${row.confidence} | ${row.write_safe ? 'yes' : 'no'} | ${escapeMd(row.reasons.join('; '))} |`),
  ].join('\n');
}

async function main() {
  const [{ venues }, batch] = await Promise.all([loadPublicVenues(), loadControlledBatch()]);
  const proposalsByName = mapProposalsByName(batch.proposals);
  const rows: MappingRow[] = [];

  for (const venue of venues) {
    const proposal = proposalsByName.get(normalizeName(venue.name)) || fallbackCategoryProposal(venue.name, venue.category);
    rows.push(toMapping('public', venue.name, venue.category, proposal));
  }

  for (const output of batch.intelligence) {
    const proposal = proposalsByName.get(normalizeName(output.venue_name)) || fallbackCategoryProposal(output.venue_name, output.category);
    rows.push(toMapping('candidate', output.venue_name, output.category, proposal));
  }

  const payload = {
    generated_at: new Date().toISOString(),
    summary: {
      total: rows.length,
      write_safe: rows.filter((row) => row.write_safe).length,
      needs_review: rows.filter((row) => !row.write_safe).length,
    },
    mappings: rows.sort((a, b) => a.scope.localeCompare(b.scope) || a.venue.localeCompare(b.venue)),
  };

  await writeJsonAndMarkdown(
    'category_normalization_publish_mapping.json',
    'category_normalization_publish_mapping.md',
    payload,
    markdown(payload.mappings),
  );
  console.log(`Category publish mappings: ${payload.summary.total}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
