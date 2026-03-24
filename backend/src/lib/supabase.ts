// ── Supabase clients ─────────────────────────────────────────
// Two clients:
//   • supabase      — anon key, respects RLS
//   • adminSupabase — service-role key, bypasses RLS (admin ops only)
//
// We use untyped SupabaseClient here because the @supabase/supabase-js v2.100
// PostgrestVersion:"12" generic requires a generated schema that exactly matches
// the client's internal type contract.  Instead, we type our queries explicitly
// at the call site using TypeScript's `as` casts backed by our own Database types.
//
// NEVER expose the service-role key to the browser.

import { createClient } from '@supabase/supabase-js';

const url  = process.env.SUPABASE_URL  ?? '';
const anon = process.env.SUPABASE_ANON_KEY ?? '';
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const isConfigured = url.startsWith('https://') && anon.length > 20 && svc.length > 20;

if (!isConfigured) {
  console.warn(
    '⚠️  Supabase env vars not configured (or still placeholders).\n' +
    '   The server will start but auth/db routes will fail.\n' +
    '   Copy .env.example → .env and fill in real values.',
  );
}

// Even with placeholder values, createClient won't crash — it just won't
// connect to anything real.  Routes will return errors on actual DB calls.
const safeUrl  = isConfigured ? url  : 'https://placeholder.supabase.co';
const safeAnon = isConfigured ? anon : 'placeholder-anon-key-000000000000000000000';
const safeSvc  = isConfigured ? svc  : 'placeholder-svc-key-0000000000000000000000';

/** Anon client — respects Row-Level Security */
export const supabase = createClient(safeUrl, safeAnon, {
  auth: { persistSession: false },
});

/** Admin client — bypasses RLS. Use with care. */
export const adminSupabase = createClient(safeUrl, safeSvc, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** True when real Supabase credentials are provided */
export { isConfigured as supabaseConfigured };
