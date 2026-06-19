import { createClient } from '@/utils/supabase/server';

export type AdminAuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: 401 | 403; message: string };

function configuredAdminEmails() {
  return (process.env.KORANTIS_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdminUser(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { ok: false, status: 401, message: 'Authentication required' };
  }

  const email = data.user.email?.toLowerCase();
  const adminEmails = configuredAdminEmails();

  if (!email || adminEmails.length === 0 || !adminEmails.includes(email)) {
    return { ok: false, status: 403, message: 'Admin access required' };
  }

  return { ok: true, userId: data.user.id, email };
}
