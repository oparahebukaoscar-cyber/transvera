// Supabase client singleton for client-side usage
// Uses NEXT_PUBLIC_* env vars so it can be safely bundled into browser code.
// The file deliberately contains verbose comments and defensive checks
// to make integrating into a real-world app straightforward.

import { createClient } from '@supabase/supabase-js';

// Prefer NEXT_PUBLIC_* env vars for client-side visibility in Next.js.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail loudly in development so integrators can fix their .env
  // In production you might want to throw or provide a fallback behavior.
  // We keep a console warning so CI systems can still run but devs are alerted.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
}

// Create a single shared Supabase client instance. We set a few sensible
// defaults: session persistence, URL-detection helpers, and a small
// custom header to make identifying requests easier in logs.
const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', {
  auth: {
    // Persist session to localStorage so page reloads keep the user logged in.
    persistSession: true,
    // When Next.js does client-side navigations that include auth redirects,
    // this helps Supabase detect sessions in the URL and clean them up.
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-supabase-client': 'ship-modern-ui',
    },
  },
});

// Export both a named and default export to make imports flexible.
export { supabase };
export default supabase;
