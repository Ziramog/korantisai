import { createHash } from 'crypto';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

export const DISCOVERY_DATA_DIR = join(process.cwd(), 'data', 'discovery');

export function ensureDiscoveryDataDir() {
  if (!existsSync(DISCOVERY_DATA_DIR)) mkdirSync(DISCOVERY_DATA_DIR, { recursive: true });
}

export function readJsonFile<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

export function writeJsonFile(file: string, value: unknown) {
  const targetDir = dirname(file);
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
}

export function writeMarkdownFile(file: string, value: string) {
  const targetDir = dirname(file);
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  writeFileSync(file, value);
}

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’'`´.]/g, '')
    .replace(/[^a-z0-9ñ\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalVenueName(value: string) {
  return normalizeText(value)
    .replace(/\b(el|la|los|las|de|del|cafe|coffee|cafeteria|restaurant|restaurante|bar|bistro|palermo|recoleta|san telmo|belgrano|chacarita|colegiales|villa crespo|retiro|microcentro|buenos aires|ba|sucursal)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim() || normalizeText(value);
}

export function stableId(parts: string[]) {
  return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 16);
}

export function scoreCap(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

export function readSourceWeights() {
  const file = join(DISCOVERY_DATA_DIR, 'source_weights.json');
  if (!existsSync(file)) return {};
  return readJsonFile<Record<string, number>>(file);
}
