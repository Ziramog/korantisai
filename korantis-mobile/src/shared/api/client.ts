import { env } from '@/shared/config/env';
import { Platform } from 'react-native';

import { ApiError } from './api-error';

const REQUEST_TIMEOUT_MS = 12_000;

export function resolveApiUrl(path: string): string {
  const baseUrl = Platform.OS === 'web' && env.environment === 'development' && env.webApiProxyUrl
    ? env.webApiProxyUrl
    : env.apiBaseUrl;

  return new URL(path, `${baseUrl}/`).toString();
}

export async function getJson(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(resolveApiUrl(path), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError('API request failed', `HTTP_${response.status}`, response.status, response.status >= 500);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('API request timed out', 'TIMEOUT', null, true);
    }
    throw new ApiError('Network request failed', 'NETWORK', null, true);
  } finally {
    clearTimeout(timeout);
  }
}
