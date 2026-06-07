import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { findBestGooglePlace } from '../utils/google_places';
import type { BatchInput, VenueInput, VenueRaw } from '../types';

export interface Stage01ExtractionResult {
  batch_id?: string;
  city: string;
  api_key_present: boolean;
  venues_requested: number;
  venues_found: number;
  venues_failed: number;
  raw_venues: VenueRaw[];
  report_markdown: string;
}

export async function extractVenueData(
  venues: VenueInput[],
  city: string,
  options: { batchId?: string; apiKey?: string } = {},
): Promise<Stage01ExtractionResult> {
  const apiKey = options.apiKey ?? process.env.GOOGLE_PLACES_API_KEY;
  const apiKeyPresent = Boolean(apiKey?.trim());
  const rawVenues: VenueRaw[] = [];

  for (const venue of venues) {
    const result = await findBestGooglePlace(venue, {
      apiKey,
      city,
      languageCode: 'en',
      regionCode: 'AR',
    });
    rawVenues.push(result.venue);
  }

  const venuesFound = rawVenues.filter((venue) => !venue.extraction_error && venue.place_id).length;
  const venuesFailed = rawVenues.length - venuesFound;
  const report = buildStage01Report({
    batchId: options.batchId,
    city,
    apiKeyPresent,
    rawVenues,
    venuesRequested: venues.length,
    venuesFound,
    venuesFailed,
  });

  return {
    batch_id: options.batchId,
    city,
    api_key_present: apiKeyPresent,
    venues_requested: venues.length,
    venues_found: venuesFound,
    venues_failed: venuesFailed,
    raw_venues: rawVenues,
    report_markdown: report,
  };
}

export async function runStage01Cli(batchName: string): Promise<Stage01ExtractionResult> {
  loadLocalEnv();

  const inputPath = path.join(process.cwd(), 'pipeline', 'input', `${batchName}.json`);
  const input = readBatchInput(inputPath);
  const venues = input.venues || [];
  const result = await extractVenueData(venues, input.city, {
    batchId: input.batch_id,
    apiKey: process.env.GOOGLE_PLACES_API_KEY,
  });

  const outputDir = path.join(process.cwd(), 'data', 'batches', input.batch_id);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'stage_01_raw_venues.json'), `${JSON.stringify(result.raw_venues, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_01_report.md'), result.report_markdown, 'utf8');

  console.log(`Stage 01 raw venues written to ${path.join(outputDir, 'stage_01_raw_venues.json')}`);
  console.log(`Stage 01 report written to ${path.join(outputDir, 'stage_01_report.md')}`);
  console.log(
    `Stage 01 summary: requested=${result.venues_requested}, found=${result.venues_found}, failed=${result.venues_failed}, google_places_key_present=${result.api_key_present}`,
  );

  return result;
}

export function loadLocalEnv(): void {
  dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });
  dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true, quiet: true });
}

function readBatchInput(filePath: string): BatchInput {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as BatchInput;
  if (!parsed.batch_id) throw new Error('Invalid batch input: batch_id is required');
  if (!parsed.city) throw new Error('Invalid batch input: city is required');
  if (!Array.isArray(parsed.venues) || parsed.venues.length === 0) {
    throw new Error('Invalid batch input: venues must be a non-empty array for Stage 01');
  }
  for (const [index, venue] of parsed.venues.entries()) {
    if (!venue.name) throw new Error(`Invalid batch input: venues[${index}].name is required`);
  }
  return parsed;
}

function buildStage01Report(input: {
  batchId?: string;
  city: string;
  apiKeyPresent: boolean;
  rawVenues: VenueRaw[];
  venuesRequested: number;
  venuesFound: number;
  venuesFailed: number;
}): string {
  const lines = [
    `# Stage 01 Raw Venue Extraction Report`,
    '',
    `- Batch: ${input.batchId || 'unknown'}`,
    `- City: ${input.city}`,
    `- Google Places key present: ${input.apiKeyPresent ? 'yes' : 'no'}`,
    `- Venues requested: ${input.venuesRequested}`,
    `- Venues found: ${input.venuesFound}`,
    `- Venues failed: ${input.venuesFailed}`,
    '',
    `## Venue Results`,
    '',
    `| Venue | Found | Confidence | Business Status | Missing Fields | Warnings | Error |`,
    `| --- | --- | ---: | --- | --- | --- | --- |`,
  ];

  for (const venue of input.rawVenues) {
    const missingFields = getMissingFields(venue);
    lines.push(
      `| ${[
        escapeTableCell(venue.input.name),
        venue.extraction_error ? 'no' : 'yes',
        typeof venue.extraction_confidence === 'number' ? venue.extraction_confidence.toFixed(2) : 'n/a',
        escapeTableCell(venue.business_status || venue.operational_status || 'unknown'),
        escapeTableCell(missingFields.join(', ') || 'none'),
        escapeTableCell((venue.extraction_warnings || []).join(', ') || 'none'),
        escapeTableCell(venue.extraction_error || 'none'),
      ].join(' | ')} |`,
    );
  }

  lines.push('', `## Warnings`);
  if (!input.apiKeyPresent) {
    lines.push('', '- Missing `GOOGLE_PLACES_API_KEY`; Stage 01 emitted per-venue extraction errors without external calls.');
  }

  const allWarnings = input.rawVenues.flatMap((venue) => venue.extraction_warnings || []);
  const uniqueWarnings = Array.from(new Set(allWarnings));
  if (uniqueWarnings.length === 0) {
    lines.push('', '- none');
  } else {
    for (const warning of uniqueWarnings) {
      lines.push(`- ${warning}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function getMissingFields(venue: VenueRaw): string[] {
  const missing: string[] = [];
  if (!venue.place_id) missing.push('place_id');
  if (!venue.address) missing.push('address');
  if (!venue.coordinates) missing.push('coordinates');
  if (!venue.google_maps_url) missing.push('google_maps_url');
  if (!venue.type || venue.type === 'unknown') missing.push('type');
  if (typeof venue.rating !== 'number') missing.push('rating');
  if (typeof venue.user_ratings_total !== 'number') missing.push('user_ratings_total');
  if (!venue.website_url) missing.push('website_url');
  if (!venue.hours) missing.push('hours');
  return missing;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/01_extract_data.ts <batch_name>');
    process.exitCode = 1;
  } else {
    runStage01Cli(batchName).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Stage 01 failed: ${message}`);
      process.exitCode = 1;
    });
  }
}
