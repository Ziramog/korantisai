import { createHash } from 'crypto';
import { extractImageDimensions } from './image_downloader';
import type { ImageCandidate, RiskFlag } from '../types';

const DEFAULT_MINIMAX_BASE_URL = 'https://api.minimax.io/anthropic';
const DEFAULT_MINIMAX_M3_MODEL = 'MiniMax-M3';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type SceneType =
  | 'hero_interior'
  | 'gallery_atmosphere'
  | 'hero_exterior'
  | 'product_food'
  | 'logo'
  | 'menu'
  | 'crowd'
  | 'decorative'
  | 'unusable';

export type VisionQuality = 'high' | 'acceptable' | 'low';

export type AtmosphereSignal =
  | 'dark_intimate'
  | 'warm_cozy'
  | 'bright_airy'
  | 'energetic'
  | 'minimal'
  | 'lush'
  | 'industrial'
  | 'none';

export interface VisionPayload {
  scene_type: SceneType;
  shows_space: boolean;
  is_hero_usable: boolean;
  is_product_only: boolean;
  has_identifiable_faces: boolean;
  quality: VisionQuality;
  atmosphere_signal: AtmosphereSignal;
  visual_reason: string;
}

export interface M3VisionResult {
  venue_name: string;
  resolved_image_url: string;
  source_url: string;
  source_type: string;
  width: number;
  height: number;
  ok_photo: boolean;
  skip_reason: string | null;
  model_used: string;
  vision: VisionPayload;
  risk_flags: RiskFlag[];
}

export interface M3VisionClientConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface ImageBytesForVision {
  bytes: Buffer;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  sha256: string;
}

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicMessagesResponse {
  content?: AnthropicTextBlock[];
  model?: string;
  error?: {
    message?: string;
    type?: string;
  };
  base_resp?: {
    status_code?: number;
    status_msg?: string;
  };
}

export async function downloadImageBytesForVision(candidate: ImageCandidate): Promise<ImageBytesForVision> {
  let response: Response;
  try {
    response = await fetch(candidate.resolved_image_url, {
      headers: {
        Accept: 'image/jpeg,image/png,image/webp;q=0.9',
        'User-Agent': 'KorantisStage04Vision/1.0',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    throw new Error(`image_download_failed: ${formatUnknownError(error)}`);
  }

  if (!response.ok) {
    throw new Error(`image_download_http_${response.status}`);
  }

  const declaredType = normalizeContentType(response.headers.get('content-type') || candidate.content_type || '');
  const contentLength = Number(response.headers.get('content-length')) || 0;
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error('image_exceeds_m3_inline_limit');
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error('image_exceeds_m3_inline_limit');
  }

  const dimensions = extractImageDimensions(bytes);
  const magicType = mediaTypeFromMagic(dimensions.format);
  if (!magicType) {
    throw new Error(`unsupported_magic_format_${dimensions.format.toLowerCase()}`);
  }
  if (declaredType && declaredType !== magicType) {
    throw new Error(`content_type_magic_mismatch_${declaredType}_vs_${magicType}`);
  }
  if (Math.max(dimensions.width, dimensions.height) < 512) {
    throw new Error('max_dimension_below_512');
  }

  return {
    bytes,
    mediaType: magicType,
    width: dimensions.width || candidate.width,
    height: dimensions.height || candidate.height,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

export async function classifyImageWithM3(
  candidate: ImageCandidate,
  image: ImageBytesForVision,
  config: M3VisionClientConfig,
): Promise<M3VisionResult> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new Error('missing MINIMAX_API_KEY');
  }

  const model = config.model || DEFAULT_MINIMAX_M3_MODEL;
  const endpoint = buildMessagesEndpoint(config.baseUrl || DEFAULT_MINIMAX_BASE_URL);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      temperature: 0,
      thinking: { type: 'disabled' },
      system: 'You classify venue images from pixels only. Return strict JSON only. Do not infer the scene from URL text, venue name, or metadata.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.bytes.toString('base64'),
              },
            },
            {
              type: 'text',
              text: buildVisionPrompt(),
            },
          ],
        },
      ],
    }),
  });

  const rawText = await response.text();
  const parsed = parseJsonObject<AnthropicMessagesResponse>(rawText);
  if (!response.ok) {
    const message = parsed?.error?.message || parsed?.base_resp?.status_msg || rawText.slice(0, 300);
    throw new Error(`m3_http_${response.status}: ${redactSecrets(message)}`);
  }

  const contentText = extractResponseText(parsed);
  const json = extractJsonObject(contentText);
  if (!json) {
    throw new Error('m3_invalid_json');
  }

  const vision = normalizeVisionPayload(json);
  return {
    venue_name: candidate.venue_name,
    resolved_image_url: candidate.resolved_image_url,
    source_url: candidate.source_url,
    source_type: candidate.source_type,
    width: image.width,
    height: image.height,
    ok_photo: vision.is_hero_usable && vision.shows_space && !vision.is_product_only,
    skip_reason: vision.is_hero_usable ? null : `not_hero_usable_${vision.scene_type}`,
    model_used: model,
    vision,
    risk_flags: candidate.risk_flags || [],
  };
}

export function m3ConfigFromEnv(): Required<M3VisionClientConfig> & { apiKey: string } {
  return {
    apiKey: process.env.MINIMAX_API_KEY || '',
    baseUrl: process.env.MINIMAX_BASE_URL || DEFAULT_MINIMAX_BASE_URL,
    model: process.env.MINIMAX_M3_MODEL || DEFAULT_MINIMAX_M3_MODEL,
  };
}

export function redactSecrets(value: string): string {
  return value
    .replace(/(MINIMAX_API_KEY=)[^\s"'`]+/gi, '$1[REDACTED]')
    .replace(/(X-Api-Key:\s*)[^\s"'`]+/gi, '$1[REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, '[REDACTED_KEY]')
    .replace(/[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g, '[REDACTED_TOKEN]');
}

function buildVisionPrompt(): string {
  return [
    'Return exactly one JSON object with this schema:',
    '{',
    '  "scene_type": "hero_interior | gallery_atmosphere | hero_exterior | product_food | logo | menu | crowd | decorative | unusable",',
    '  "shows_space": true,',
    '  "is_hero_usable": true,',
    '  "is_product_only": false,',
    '  "has_identifiable_faces": false,',
    '  "quality": "high | acceptable | low",',
    '  "atmosphere_signal": "dark_intimate | warm_cozy | bright_airy | energetic | minimal | lush | industrial | none",',
    '  "visual_reason": "short pixel-based reason"',
    '}',
    'Classify only from the image pixels.',
    'Use hero_interior for clear venue interiors suitable as a hero.',
    'Also use hero_interior for experiential outdoor spaces where guests actually sit, drink, eat, or experience the venue: rooftop seating, terraces, patios, gardens, courtyards, sidewalk tables, or outdoor bars.',
    'Use gallery_atmosphere for spatial/ambience images that show the venue but are less direct as a hero.',
    'Use hero_exterior only for clear facade, street, storefront, sign, entrance, or building exterior images where the guest experience space is not visible.',
    'Do not classify rooftops, patios, terraces, gardens, outdoor dining, or outdoor bars as hero_exterior when tables, seating, bar service, lighting, or guest atmosphere are visible.',
    'Use product_food for food/drink-only images.',
    'Use crowd when identifiable people dominate the image.',
    'Use decorative for non-spatial decorative/details.',
    'Use unusable for blurry, too dark, cropped, or unclear images.',
  ].join('\n');
}

function buildMessagesEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/v1/messages')) return trimmed;
  if (trimmed.endsWith('/v1')) return `${trimmed}/messages`;
  return `${trimmed}/v1/messages`;
}

function extractResponseText(response: AnthropicMessagesResponse | null): string {
  return (response?.content || [])
    .filter((block): block is AnthropicTextBlock => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const unfenced = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const direct = parseJsonObject<Record<string, unknown>>(unfenced);
  if (direct) return direct;

  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return parseJsonObject<Record<string, unknown>>(unfenced.slice(start, end + 1));
  }
  return null;
}

function normalizeVisionPayload(value: Record<string, unknown>): VisionPayload {
  const sceneType = enumValue(value.scene_type, [
    'hero_interior',
    'gallery_atmosphere',
    'hero_exterior',
    'product_food',
    'logo',
    'menu',
    'crowd',
    'decorative',
    'unusable',
  ], 'unusable');
  const quality = enumValue(value.quality, ['high', 'acceptable', 'low'], 'low');
  const atmosphere = enumValue(value.atmosphere_signal, [
    'dark_intimate',
    'warm_cozy',
    'bright_airy',
    'energetic',
    'minimal',
    'lush',
    'industrial',
    'none',
  ], 'none');

  return {
    scene_type: sceneType,
    shows_space: Boolean(value.shows_space),
    is_hero_usable: Boolean(value.is_hero_usable),
    is_product_only: Boolean(value.is_product_only),
    has_identifiable_faces: Boolean(value.has_identifiable_faces),
    quality,
    atmosphere_signal: atmosphere,
    visual_reason: typeof value.visual_reason === 'string' ? value.visual_reason.slice(0, 500) : '',
  };
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

function parseJsonObject<T>(text: string): T | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed as T : null;
  } catch {
    return null;
  }
}

function mediaTypeFromMagic(format: string): ImageBytesForVision['mediaType'] | null {
  if (format === 'JPEG') return 'image/jpeg';
  if (format === 'PNG') return 'image/png';
  if (format === 'WEBP') return 'image/webp';
  return null;
}

function normalizeContentType(value: string): string {
  return value.split(';')[0].trim().toLowerCase();
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
