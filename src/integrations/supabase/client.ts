
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ywjblrnqygowfixxmigw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3amJscm5xeWdvd2ZpeHhtaWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODkyNDEsImV4cCI6MjA1NjU2NTI0MX0.-H1zLrSd1eB1zFqknQePspLAmvi6TkISr020jahYpn0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/**
 * Returns a Supabase client that includes the admin session token
 * in the request headers so RLS policies can validate the session.
 */
export function getAuthenticatedClient(sessionToken: string) {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        'x-admin-session': sessionToken,
      },
    },
  });
}
