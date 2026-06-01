import { escapeMd, readJson, writeJsonAndMarkdown } from './enrichment_utils';

type GoogleContactFile = {
  records?: Array<{
    venue: string;
    scope: string;
    candidate_id?: string;
    google_place_id?: string | null;
    links?: Array<{ type: string; url?: string; phone_number?: string; source: string }>;
  }>;
};

type OfficialLink = {
  venue: string;
  scope: string;
  candidate_id?: string;
  google_place_id?: string | null;
  type: 'instagram' | 'whatsapp' | 'reservation' | 'booking' | 'menu';
  label: string;
  url: string;
  source: 'official_website';
  confidence: number;
};

type DiscoveryPlan = {
  venue: string;
  scope: string;
  website?: string;
  action: 'dry_run_plan' | 'fetched_homepage' | 'skipped';
  reason: string;
};

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function classifyUrl(url: string): OfficialLink['type'] | null {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('wa.me') || lower.includes('whatsapp')) return 'whatsapp';
  if (lower.includes('menu') || lower.includes('carta')) return 'menu';
  if (lower.includes('resy.') || lower.includes('opentable.') || lower.includes('thefork.') || lower.includes('meitre.') || lower.includes('reserv')) return 'reservation';
  if (lower.includes('book') || lower.includes('booking')) return 'booking';
  return null;
}

function extractLinks(html: string, baseUrl: string) {
  const links = new Set<string>();
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    try {
      links.add(new URL(match[1], baseUrl).toString());
    } catch {
      // Ignore invalid href values.
    }
  }

  return [...links];
}

async function fetchHomepage(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html',
      'user-agent': 'Korantis contact discovery audit',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.text();
}

function markdown(plans: DiscoveryPlan[], links: OfficialLink[], fetchMode: boolean) {
  return [
    '# Official Contact Link Discovery',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${fetchMode ? 'homepage fetch' : 'dry-run plan only'}`,
    '',
    '## Summary',
    '',
    `- Planned websites: ${plans.filter((plan) => plan.website).length}`,
    `- Homepages fetched: ${plans.filter((plan) => plan.action === 'fetched_homepage').length}`,
    `- Explicit official links found: ${links.length}`,
    '',
    '## Discovery Plan',
    '',
    '| Venue | Scope | Website | Action | Reason |',
    '| --- | --- | --- | --- | --- |',
    ...plans.map((plan) => `| ${escapeMd(plan.venue)} | ${plan.scope} | ${escapeMd(plan.website)} | ${plan.action} | ${escapeMd(plan.reason)} |`),
    '',
    '## Explicit Links',
    '',
    ...(links.length ? [
      '| Venue | Type | URL |',
      '| --- | --- | --- |',
      ...links.map((link) => `| ${escapeMd(link.venue)} | ${link.type} | ${escapeMd(link.url)} |`),
    ] : ['- None in dry-run mode. Run with `--fetch` to inspect official homepages only.']),
  ].join('\n');
}

async function main() {
  const fetchMode = hasFlag('fetch');
  const contact = await readJson<GoogleContactFile>('data/google_contact_enrichment.json', { records: [] });
  const plans: DiscoveryPlan[] = [];
  const links: OfficialLink[] = [];

  for (const record of contact.records || []) {
    const website = record.links?.find((link) => link.type === 'website')?.url;
    if (!website) {
      plans.push({
        venue: record.venue,
        scope: record.scope,
        action: 'skipped',
        reason: 'no official website from Google Places',
      });
      continue;
    }

    if (!fetchMode) {
      plans.push({
        venue: record.venue,
        scope: record.scope,
        website,
        action: 'dry_run_plan',
        reason: 'homepage fetch not executed in safe default mode',
      });
      continue;
    }

    try {
      const html = await fetchHomepage(website);
      const extracted = extractLinks(html, website)
        .map((url) => ({ url, type: classifyUrl(url) }))
        .filter((item): item is { url: string; type: OfficialLink['type'] } => item.type !== null);

      for (const item of extracted) {
        links.push({
          venue: record.venue,
          scope: record.scope,
          candidate_id: record.candidate_id,
          google_place_id: record.google_place_id,
          type: item.type,
          label: item.type,
          url: item.url,
          source: 'official_website',
          confidence: 85,
        });
      }

      plans.push({
        venue: record.venue,
        scope: record.scope,
        website,
        action: 'fetched_homepage',
        reason: `found ${extracted.length} explicit links`,
      });
    } catch (error) {
      plans.push({
        venue: record.venue,
        scope: record.scope,
        website,
        action: 'skipped',
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const payload = {
    generated_at: new Date().toISOString(),
    mode: fetchMode ? 'fetch' : 'dry-run',
    plans,
    links,
  };

  await writeJsonAndMarkdown('official_contact_links.json', 'official_contact_link_discovery.md', payload, markdown(plans, links, fetchMode));
  console.log(`Official link plans: ${plans.length}; links: ${links.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

