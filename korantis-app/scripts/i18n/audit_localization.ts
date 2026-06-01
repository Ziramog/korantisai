import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src/app/components'];
const SCAN_FILES = ['src/app/page.tsx'];
const REPORT_PATH = path.join(ROOT, 'data', 'localization_audit_report.md');
const SOURCE_EXTENSIONS = new Set(['.tsx']);

const LOCALIZED_FILES = [
  'src/lib/i18n',
  'src/app/contexts/CircadianContext.tsx',
  'src/app/components/SearchBar.tsx',
  'src/app/components/VenueCard.tsx',
  'src/app/components/VenueDetail.tsx',
  'src/app/components/map/SpatialAtlas.tsx',
  'src/app/components/map/VenueDetailMapBlock.tsx',
  'src/app/components/AuthPanel.tsx',
  'src/app/components/GlobalNav.tsx',
  'src/app/components/MapExplorer.tsx',
  'src/app/components/HeaderControls.tsx',
  'src/app/components/AtmosphereDebug.tsx',
  'src/app/page.tsx',
];

const INTENTIONAL_VISIBLE_TERMS = new Set([
  'Korantis',
  'Buenos Aires',
  'New York',
  'Uber',
  'Maps',
]);

const USER_FACING_ATTRIBUTES = ['aria-label', 'title', 'placeholder', 'alt'];
const CLASS_OR_STYLE_HINT = /\b(className|style|transition|animate|initial|exit|layoutId|key|href|rel|target|src|fill|strokeWidth|mapStyle|type|value)\b/;
const CODE_HINT = /\b(import|from|const|let|function|return|if|else|useState|useEffect|useMemo|useRef|onClick|onChange|set[A-Z]|process\.env|window\.|document\.|console\.)\b/;
const TECHNICAL_VALUE = /^(use client|Feature|Point|currentColor|noopener noreferrer|easeOut|easeInOut|spring|smooth|center|bottom|top|button|submit|range|email|password)$/i;
const CSS_VALUE = /^(#|rgba?\(|\/|\.\/|\.\.\/|[a-z-]+:\/\/)/i;
const CODE_FRAGMENT = /[{}();=?:]|\b(status|mode|const|return|className|onClick)\b/;

type Finding = {
  file: string;
  line: number;
  value: string;
  reason: string;
};

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return walk(fullPath);
    return SOURCE_EXTENSIONS.has(path.extname(entry)) ? [fullPath] : [];
  });
}

function cleanValue(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function shouldIgnore(value: string) {
  const trimmed = cleanValue(value);
  if (trimmed.length < 3) return true;
  if (!/[A-Za-z]/.test(trimmed)) return true;
  if (TECHNICAL_VALUE.test(trimmed)) return true;
  if (CSS_VALUE.test(trimmed)) return true;
  if (CODE_FRAGMENT.test(trimmed)) return true;
  if (INTENTIONAL_VISIBLE_TERMS.has(trimmed)) return true;
  if (/^[A-Z0-9_ -]+$/.test(trimmed) && trimmed.length <= 16) return true;
  return false;
}

function lineNumberAt(source: string, index: number) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function extractAttributeFindings(source: string, file: string): Finding[] {
  const attrPattern = new RegExp(
    `(?:${USER_FACING_ATTRIBUTES.join('|')})\\s*=\\s*["']([^"']+)["']`,
    'g',
  );
  return Array.from(source.matchAll(attrPattern))
    .map((match) => ({
      file,
      line: lineNumberAt(source, match.index || 0),
      value: cleanValue(match[1]),
      reason: 'literal user-facing attribute',
    }))
    .filter((finding) => !shouldIgnore(finding.value));
}

function extractJsxTextFindings(source: string, file: string): Finding[] {
  const stripped = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  const textPattern = />\s*([^<>{}\n][^<>{}]*)\s*</g;

  return Array.from(stripped.matchAll(textPattern))
    .map((match) => ({
      file,
      line: lineNumberAt(stripped, match.index || 0),
      value: cleanValue(match[1]),
      reason: 'literal JSX text',
    }))
    .filter((finding) => !shouldIgnore(finding.value))
    .filter((finding) => !CLASS_OR_STYLE_HINT.test(finding.value))
    .filter((finding) => !CODE_HINT.test(finding.value));
}

function extractFindings(filePath: string): Finding[] {
  const source = readFileSync(filePath, 'utf8');
  const relativeFile = path.relative(ROOT, filePath).replaceAll('\\', '/');
  const filteredSource = source
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('import '))
    .join('\n');

  return [
    ...extractAttributeFindings(filteredSource, relativeFile),
    ...extractJsxTextFindings(filteredSource, relativeFile),
  ];
}

const scanTargets = [
  ...SCAN_DIRS.flatMap((scanDir) => walk(path.join(ROOT, scanDir))),
  ...SCAN_FILES.map((filePath) => path.join(ROOT, filePath)),
];

const findingsByFile = new Map<string, Finding[]>();
for (const finding of scanTargets.flatMap(extractFindings)) {
  const findings = findingsByFile.get(finding.file) || [];
  if (!findings.some((existing) => existing.line === finding.line && existing.value === finding.value)) {
    findings.push(finding);
  }
  findingsByFile.set(finding.file, findings);
}

const findingsMarkdown = Array.from(findingsByFile.entries())
  .filter(([, findings]) => findings.length > 0)
  .map(([file, findings]) => [
    `### ${file}`,
    ...findings.map((finding) => `- line ${finding.line}: ${finding.value} (${finding.reason})`),
  ].join('\n'))
  .join('\n\n');

const report = `# Localization Audit Report

Generated: ${new Date().toISOString()}

## Localized Surfaces

${LOCALIZED_FILES.map((file) => `- ${file}`).join('\n')}

## Remaining Hardcoded User-Facing Candidates

${findingsMarkdown || '- No likely hardcoded user-facing English strings found by the lightweight scanner.'}

## Intentional English / Proper Nouns

- Venue names, district names, city names, source names, and proper nouns are intentionally preserved.
- Uber and Maps are treated as product/source labels and are intentionally preserved.
- Unknown tags and intents intentionally fall back to their canonical English value.

## Fields Intentionally Left English

- Canonical venue descriptions remain English unless a safe Spanish variant exists.
- Source evidence and internal intelligence labels remain English.
- Search/ranking values remain canonical English even when displayed labels are Spanish.

## Deferred Description Translation

- Venue-facing narrative copy needs curated Spanish variants or a deterministic translation cache.
- This audit does not recommend destructive translation of database canonical records.

## Next Steps

- Add curated Spanish description fields or a deterministic translation cache for venue-facing copy.
- Expand tag/category mappings as new production tags appear.
- Add an automated UI smoke test that toggles EN/ES and checks persistence.
`;

mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, report);
console.log(`Localization audit written to ${REPORT_PATH}`);
