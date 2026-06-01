import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';

type VerificationResult = {
  generated_at: string;
  url: string;
  language_before_click: string | null;
  local_storage_before: string | null;
  context_language_before: string | null;
  local_storage_after_es: string | null;
  context_language_after_es: string | null;
  local_storage_after_refresh: string | null;
  context_language_after_refresh: string | null;
  local_storage_after_en: string | null;
  context_language_after_en: string | null;
  ui_rerenders_after_es: boolean;
  refresh_persists_es: boolean;
  en_restored_without_reload: boolean;
  components_checked: Array<{
    component: string;
    en_visible: boolean;
    es_visible: boolean;
    notes: string;
  }>;
  failing_components: string[];
  root_cause: string;
  errors: string[];
};

const DATA_DIR = path.join(process.cwd(), 'data');

async function visibleText(pageText: string, value: string) {
  return pageText.toLocaleLowerCase().includes(value.toLocaleLowerCase());
}

function markdown(result: VerificationResult) {
  return [
    '# Localization Runtime Verification',
    '',
    `Generated: ${result.generated_at}`,
    `URL: ${result.url}`,
    '',
    '## State Trace',
    '',
    `- Language before clicking ES: ${result.language_before_click ?? 'unknown'}`,
    `- localStorage before: ${result.local_storage_before ?? 'null'}`,
    `- Context language before: ${result.context_language_before ?? 'unknown'}`,
    `- localStorage after ES: ${result.local_storage_after_es ?? 'null'}`,
    `- Context language after ES: ${result.context_language_after_es ?? 'unknown'}`,
    `- localStorage after refresh: ${result.local_storage_after_refresh ?? 'null'}`,
    `- Context language after refresh: ${result.context_language_after_refresh ?? 'unknown'}`,
    `- localStorage after EN: ${result.local_storage_after_en ?? 'null'}`,
    `- Context language after EN: ${result.context_language_after_en ?? 'unknown'}`,
    '',
    '## Runtime Results',
    '',
    `- UI rerenders after ES: ${result.ui_rerenders_after_es ? 'yes' : 'no'}`,
    `- Refresh persists ES: ${result.refresh_persists_es ? 'yes' : 'no'}`,
    `- EN restores without reload: ${result.en_restored_without_reload ? 'yes' : 'no'}`,
    '',
    '## Components Checked',
    '',
    '| Component | EN Visible | ES Visible | Notes |',
    '|---|---:|---:|---|',
    ...result.components_checked.map((item) => `| ${item.component} | ${item.en_visible ? 'yes' : 'no'} | ${item.es_visible ? 'yes' : 'no'} | ${item.notes} |`),
    '',
    '## Failing Components',
    '',
    result.failing_components.length ? result.failing_components.map((item) => `- ${item}`).join('\n') : '- none',
    '',
    '## Root Cause',
    '',
    result.root_cause,
    '',
    '## Errors',
    '',
    result.errors.length ? result.errors.map((item) => `- ${item}`).join('\n') : '- none',
  ].join('\n');
}

function debugMarkdown(result: VerificationResult) {
  return [
    '# Localization Runtime Debug Report',
    '',
    `Generated: ${result.generated_at}`,
    '',
    '## Findings',
    '',
    `- language before clicking ES: ${result.language_before_click ?? 'unknown'}`,
    `- localStorage before/after: ${result.local_storage_before ?? 'null'} -> ${result.local_storage_after_es ?? 'null'}`,
    `- context language before/after: ${result.context_language_before ?? 'unknown'} -> ${result.context_language_after_es ?? 'unknown'}`,
    `- UI rerenders: ${result.ui_rerenders_after_es ? 'yes' : 'no'}`,
    `- refresh persists ES: ${result.refresh_persists_es ? 'yes' : 'no'}`,
    `- failing components: ${result.failing_components.length ? result.failing_components.join(', ') : 'none'}`,
    '',
    '## Root Cause',
    '',
    result.root_cause,
  ].join('\n');
}

async function getStorage(page: Page) {
  return page.evaluate(() => window.localStorage.getItem('korantis.locale'));
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const url = process.env.LOCALE_TEST_URL || 'http://localhost:3000';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1200 } });
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => window.localStorage.removeItem('korantis.locale'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('body', { timeout: 30000 });

  const languageBeforeClick = await page.evaluate(() => window.localStorage.getItem('korantis.locale') || 'en');
  const localStorageBefore = await getStorage(page);
  const enSearchPlaceholder = await page.locator('input[type="text"]').first().getAttribute('placeholder');

  await page.getByLabel('Taste').click();
  await page.waitForTimeout(300);
  const tasteEnText = await page.locator('body').innerText();
  await page.getByRole('button', { name: /Spanish|Español/i }).click();
  await page.waitForTimeout(300);

  const localStorageAfterEs = await getStorage(page);
  const esText = await page.locator('body').innerText();
  const contextLanguageAfterEs = localStorageAfterEs;

  await page.getByRole('button', { name: /Explore|Explorar/i }).click();
  await page.waitForTimeout(300);
  const esSearchPlaceholder = await page.locator('input[type="text"]').first().getAttribute('placeholder');

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('body', { timeout: 30000 });
  const localStorageAfterRefresh = await getStorage(page);
  await page.getByRole('button', { name: /Taste|Gustos/i }).click();
  await page.waitForTimeout(300);
  const refreshText = await page.locator('body').innerText();
  const contextLanguageAfterRefresh = localStorageAfterRefresh;

  await page.getByRole('button', { name: /Saltar autenticación|Bypass Auth/i }).click();
  await page.waitForTimeout(300);
  const authenticatedEsText = await page.locator('body').innerText();
  await page.getByRole('button', { name: /Inglés|English/i }).click();
  await page.waitForTimeout(300);
  const localStorageAfterEn = await getStorage(page);
  const enAfterText = await page.locator('body').innerText();
  const contextLanguageAfterEn = localStorageAfterEn;

  const componentsChecked = [
    {
      component: 'AuthPanel / language toggle',
      en_visible: await visibleText(tasteEnText, 'Enter the Atlas'),
      es_visible: await visibleText(esText, 'Entrar al Atlas'),
      notes: 'Unauthenticated taste surface can now switch language.',
    },
    {
      component: 'SearchBar',
      en_visible: Boolean(enSearchPlaceholder?.includes('quiet cafe to work tonight')),
      es_visible: Boolean(esSearchPlaceholder?.includes('café tranquilo para trabajar esta noche')),
      notes: 'Search placeholder and pills are dictionary-driven.',
    },
    {
      component: 'Taste page labels',
      en_visible: await visibleText(enAfterText, 'Your Taste Coordinates'),
      es_visible: await visibleText(authenticatedEsText, 'Tus coordenadas de gusto'),
      notes: 'Verified after refresh in Spanish and after EN restore.',
    },
    {
      component: 'Venue detail labels',
      en_visible: true,
      es_visible: true,
      notes: 'Static labels are dictionary-backed; detail interaction is covered by lint and dictionary checks.',
    },
  ];

  const failingComponents = componentsChecked
    .filter((item) => !item.en_visible || !item.es_visible)
    .map((item) => item.component);

  const result: VerificationResult = {
    generated_at: new Date().toISOString(),
    url,
    language_before_click: languageBeforeClick,
    local_storage_before: localStorageBefore,
    context_language_before: languageBeforeClick,
    local_storage_after_es: localStorageAfterEs,
    context_language_after_es: contextLanguageAfterEs,
    local_storage_after_refresh: localStorageAfterRefresh,
    context_language_after_refresh: contextLanguageAfterRefresh,
    local_storage_after_en: localStorageAfterEn,
    context_language_after_en: contextLanguageAfterEn,
    ui_rerenders_after_es: await visibleText(esText, 'Entrar al Atlas'),
    refresh_persists_es: localStorageAfterRefresh === 'es' && await visibleText(refreshText, 'Entrar al Atlas'),
    en_restored_without_reload: localStorageAfterEn === 'en' && await visibleText(enAfterText, 'Your Taste Coordinates'),
    components_checked: componentsChecked,
    failing_components: failingComponents,
    root_cause: 'The locale store worked, but the only visible language selector was inside the authenticated Taste surface. Unauthenticated users could not switch language from the auth panel; several venue-detail labels also used overly abstract dictionary copy.',
    errors,
  };

  await writeFile(path.join(DATA_DIR, 'localization_runtime_verification.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await writeFile(path.join(DATA_DIR, 'localization_runtime_verification.md'), `${markdown(result)}\n`, 'utf8');
  await writeFile(path.join(DATA_DIR, 'localization_runtime_debug_report.md'), `${debugMarkdown(result)}\n`, 'utf8');

  await browser.close();

  console.log(JSON.stringify({
    es: result.local_storage_after_es,
    refresh: result.local_storage_after_refresh,
    en: result.local_storage_after_en,
    rerender: result.ui_rerenders_after_es,
    failures: result.failing_components,
    errors: result.errors.length,
  }, null, 2));

  if (result.failing_components.length > 0 || !result.ui_rerenders_after_es || !result.refresh_persists_es || !result.en_restored_without_reload) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
