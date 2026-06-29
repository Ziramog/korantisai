import { z } from 'zod';

const EnvSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z.string().url(),
  EXPO_PUBLIC_ENVIRONMENT: z.enum(['development', 'preview', 'production']),
  EXPO_PUBLIC_WEB_API_PROXY_URL: z.string().url().optional(),
  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),
  EXPO_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
}).superRefine((value, context) => {
  if (Boolean(value.EXPO_PUBLIC_SUPABASE_URL) !== Boolean(value.EXPO_PUBLIC_SUPABASE_ANON_KEY)) {
    context.addIssue({ code: 'custom', path: ['EXPO_PUBLIC_SUPABASE_URL'], message: 'Supabase URL and anon key must be configured together' });
  }
});

const parsed = EnvSchema.safeParse({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT,
  EXPO_PUBLIC_WEB_API_PROXY_URL: process.env.EXPO_PUBLIC_WEB_API_PROXY_URL,
  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  throw new Error(`Invalid public environment: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
}

export const env = {
  apiBaseUrl: parsed.data.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, ''),
  environment: parsed.data.EXPO_PUBLIC_ENVIRONMENT,
  webApiProxyUrl: parsed.data.EXPO_PUBLIC_WEB_API_PROXY_URL?.replace(/\/$/, '') ?? null,
  mapboxAccessToken: parsed.data.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? null,
  supabaseUrl: parsed.data.EXPO_PUBLIC_SUPABASE_URL ?? null,
  supabaseAnonKey: parsed.data.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null,
} as const;
