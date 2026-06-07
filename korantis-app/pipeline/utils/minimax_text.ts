const DEFAULT_MINIMAX_BASE_URL = 'https://api.minimax.io/anthropic';
const DEFAULT_MINIMAX_TEXT_MODEL = 'MiniMax-M2.7';

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

export interface MinimaxTextConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface MinimaxTextJsonResult {
  model_used: string;
  json: Record<string, unknown> | null;
  raw_text: string;
}

export function minimaxTextConfigFromEnv(): MinimaxTextConfig {
  return {
    apiKey: process.env.MINIMAX_API_KEY || '',
    baseUrl: process.env.MINIMAX_BASE_URL || DEFAULT_MINIMAX_BASE_URL,
    model: process.env.MINIMAX_TEXT_MODEL || DEFAULT_MINIMAX_TEXT_MODEL,
  };
}

export async function callMinimaxTextJson(params: {
  system: string;
  prompt: string;
  config: MinimaxTextConfig;
  maxTokens?: number;
}): Promise<MinimaxTextJsonResult> {
  const apiKey = params.config.apiKey.trim();
  const model = params.config.model.trim();
  if (!apiKey) throw new Error('missing MINIMAX_API_KEY');
  if (!model) throw new Error('missing MINIMAX_TEXT_MODEL');

  const response = await fetch(buildMessagesEndpoint(params.config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: params.maxTokens || 1200,
      temperature: 0.2,
      thinking: { type: 'disabled' },
      system: params.system,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: params.prompt,
            },
          ],
        },
      ],
    }),
  });

  const rawResponse = await response.text();
  const parsed = parseJsonObject<AnthropicMessagesResponse>(rawResponse);
  if (!response.ok) {
    const message = parsed?.error?.message || parsed?.base_resp?.status_msg || rawResponse.slice(0, 300);
    throw new Error(`minimax_text_http_${response.status}: ${redactSecrets(message)}`);
  }

  const text = extractResponseText(parsed);
  return {
    model_used: parsed?.model || model,
    json: extractJsonObject(text),
    raw_text: redactSecrets(text),
  };
}

export function redactSecrets(value: string): string {
  return value
    .replace(/(MINIMAX_API_KEY=)[^\s"'`]+/gi, '$1[REDACTED]')
    .replace(/(X-Api-Key:\s*)[^\s"'`]+/gi, '$1[REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, '[REDACTED_KEY]')
    .replace(/[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g, '[REDACTED_TOKEN]');
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

function parseJsonObject<T>(text: string): T | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed as T : null;
  } catch {
    return null;
  }
}
