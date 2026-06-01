import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { APPROVED_PUBLISH_BATCH } from './publishing_utils';
import { escapeMd, normalizeName } from '../enrichment/enrichment_utils';

type CardSnapshot = {
  name: string;
  rank: number;
  top: number;
  heroSrc: string | null;
  heroCurrentSrc: string | null;
  cloudinary: boolean;
  fallback: boolean;
  legacyProxy: boolean;
};

type UiCheckOutput = {
  generated_at: string;
  url: string;
  total_cards_in_dom: number;
  initial_visible_card_names: string[];
  discovered_visible_f8_names: string[];
  approved_cards: Array<CardSnapshot & { found: boolean }>;
  image_failures: Array<{ url: string; failure: string }>;
  bad_image_responses: Array<{ url: string; status: number }>;
  screenshot_path: string;
  conclusion: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const SCREENSHOT_PATH = path.join(DATA_DIR, 'f8_production_ui_check.png');

function imageIsCloudinary(src: string | null) {
  if (!src) return false;
  try {
    const url = new URL(src, 'https://korantis-app.vercel.app');
    const direct = url.hostname === 'res.cloudinary.com';
    const nested = url.searchParams.get('url') || '';
    return direct || nested.includes('res.cloudinary.com');
  } catch {
    return src.includes('res.cloudinary.com');
  }
}

function markdown(output: UiCheckOutput) {
  return [
    '# F.8 Production UI Check',
    '',
    `Generated: ${output.generated_at}`,
    `URL: ${output.url}`,
    `Screenshot: ${output.screenshot_path}`,
    '',
    '## Summary',
    '',
    `- Total cards in DOM: ${output.total_cards_in_dom}`,
    `- Initial visible cards: ${output.initial_visible_card_names.join(', ') || 'none'}`,
    `- F.8 venues visible after scroll: ${output.discovered_visible_f8_names.length}/${APPROVED_PUBLISH_BATCH.length}`,
    `- Image request failures: ${output.image_failures.length}`,
    `- Bad image responses: ${output.bad_image_responses.length}`,
    '',
    '## F.8 Card Positions',
    '',
    '| Venue | Found | Rank | Cloudinary Image | Fallback | Legacy Proxy |',
    '|---|---:|---:|---:|---:|---:|',
    ...output.approved_cards.map((card) => `| ${escapeMd(card.name)} | ${card.found ? 'yes' : 'no'} | ${card.rank || ''} | ${card.cloudinary ? 'yes' : 'no'} | ${card.fallback ? 'yes' : 'no'} | ${card.legacyProxy ? 'yes' : 'no'} |`),
    '',
    '## Initial Visible Cards',
    '',
    output.initial_visible_card_names.length ? output.initial_visible_card_names.map((name) => `- ${name}`).join('\n') : '- none',
    '',
    '## Image Failures',
    '',
    output.image_failures.length
      ? output.image_failures.map((failure) => `- ${failure.url}: ${failure.failure}`).join('\n')
      : '- none',
    '',
    '## Bad Image Responses',
    '',
    output.bad_image_responses.length
      ? output.bad_image_responses.map((failure) => `- ${failure.status}: ${failure.url}`).join('\n')
      : '- none',
    '',
    '## Conclusion',
    '',
    output.conclusion,
  ].join('\n');
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const url = process.env.UI_URL || 'https://korantis-app.vercel.app';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 1 });
  const imageFailures: UiCheckOutput['image_failures'] = [];
  const badImageResponses: UiCheckOutput['bad_image_responses'] = [];

  page.on('requestfailed', (request) => {
    if (request.resourceType() === 'image') {
      imageFailures.push({
        url: request.url(),
        failure: request.failure()?.errorText || 'unknown',
      });
    }
  });

  page.on('response', (response) => {
    const request = response.request();
    if (request.resourceType() === 'image' && response.status() >= 400) {
      badImageResponses.push({
        url: response.url(),
        status: response.status(),
      });
    }
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.k-card__name', { timeout: 30000 });

  const initialVisibleCardNames = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLElement>('.k-card__name'))
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.bottom >= 0 && rect.top <= window.innerHeight;
      })
      .map((node) => node.textContent?.trim() || '')
      .filter(Boolean);
  });

  const discovered = new Set<string>();
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= pageHeight + 1600; y += 900) {
    await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
    await page.waitForTimeout(250);
    const visibleNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLElement>('.k-card__name'))
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.bottom >= 0 && rect.top <= window.innerHeight;
        })
        .map((node) => node.textContent?.trim() || '')
        .filter(Boolean);
    });
    for (const name of visibleNames) {
      if (APPROVED_PUBLISH_BATCH.some((approved) => normalizeName(approved) === normalizeName(name))) {
        discovered.add(name);
      }
    }
  }

  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });

  const cardSnapshots = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLElement>('.k-card')).map((card, index) => {
      const name = card.querySelector<HTMLElement>('.k-card__name')?.textContent?.trim() || '';
      const image = card.querySelector<HTMLImageElement>('img');
      const rect = card.getBoundingClientRect();
      return {
        name,
        rank: index + 1,
        top: rect.top + window.scrollY,
        heroSrc: image?.getAttribute('src') || null,
        heroCurrentSrc: image?.currentSrc || null,
      };
    });
  }) as CardSnapshot[];

  const byName = new Map(cardSnapshots.map((card) => [normalizeName(card.name), card]));
  const approvedCards = APPROVED_PUBLISH_BATCH.map((name) => {
    const card = byName.get(normalizeName(name));
    const src = card?.heroCurrentSrc || card?.heroSrc || null;
    return {
      name,
      found: Boolean(card),
      rank: card?.rank || 0,
      top: card?.top || 0,
      heroSrc: card?.heroSrc || null,
      heroCurrentSrc: card?.heroCurrentSrc || null,
      cloudinary: imageIsCloudinary(src),
      fallback: Boolean(src?.includes('/venue_invernadero.png')),
      legacyProxy: Boolean(src?.includes('/api/venue-images/')),
    };
  });

  const missing = approvedCards.filter((card) => !card.found);
  const nonCloudinary = approvedCards.filter((card) => card.found && !card.cloudinary);
  const firstRank = Math.min(...approvedCards.filter((card) => card.found).map((card) => card.rank));
  const conclusion = missing.length > 0
    ? `Some F.8 venues are missing from DOM: ${missing.map((card) => card.name).join(', ')}.`
    : nonCloudinary.length > 0
      ? `Some F.8 cards render without Cloudinary images: ${nonCloudinary.map((card) => card.name).join(', ')}.`
      : `All F.8 venues are in the DOM with Cloudinary images. First F.8 card rank is ${firstRank}; if the top of the feed looks unchanged, ranking/order is placing new venues below initial visible cards.`;

  const output: UiCheckOutput = {
    generated_at: new Date().toISOString(),
    url,
    total_cards_in_dom: cardSnapshots.length,
    initial_visible_card_names: initialVisibleCardNames,
    discovered_visible_f8_names: Array.from(discovered),
    approved_cards: approvedCards,
    image_failures: imageFailures,
    bad_image_responses: badImageResponses,
    screenshot_path: SCREENSHOT_PATH,
    conclusion,
  };

  await writeFile(path.join(DATA_DIR, 'f8_production_ui_check.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  await writeFile(path.join(DATA_DIR, 'f8_production_ui_check.md'), `${markdown(output)}\n`, 'utf8');

  await browser.close();
  console.log(JSON.stringify({
    totalCards: output.total_cards_in_dom,
    f8Found: output.approved_cards.filter((card) => card.found).length,
    f8Cloudinary: output.approved_cards.filter((card) => card.cloudinary).length,
    firstF8Rank: Math.min(...output.approved_cards.filter((card) => card.found).map((card) => card.rank)),
    imageFailures: output.image_failures.length,
    badImageResponses: output.bad_image_responses.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
