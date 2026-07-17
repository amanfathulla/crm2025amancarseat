
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ywjblrnqygowfixxmigw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3amJscm5xeWdvd2ZpeHhtaWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODkyNDEsImV4cCI6MjA1NjU2NTI0MX0.-H1zLrSd1eB1zFqknQePspLAmvi6TkISr020jahYpn0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Cache authenticated clients by session token so we don't create a new
// SupabaseClient instance on every render (which would trigger useEffect
// dependencies and cause infinite re-fetches).
const clientCache = new Map<string, ReturnType<typeof createClient<Database>>>();

/**
 * Returns a Supabase client that includes the admin session token
 * in the request headers so RLS policies can validate the session.
 * Cached by token — same token always returns the same client instance.
 */
export function getAuthenticatedClient(sessionToken: string) {
  let cached = clientCache.get(sessionToken);
  if (!cached) {
    cached = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: {
          'x-admin-session': sessionToken,
        },
      },
    });
    clientCache.set(sessionToken, cached);
  }
  return cached;
}

/** Clear the client cache (call on logout so old tokens don't linger). */
export function clearAuthenticatedClientCache() {
  clientCache.clear();
}
