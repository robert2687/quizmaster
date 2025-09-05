import { createClient } from '@supabase/supabase-js';

// These variables are expected to be set in the environment.
// In a local development setup, this could be a .env file.
// In a deployed environment, these are configured as environment variables.
// FIX: Added placeholder values to prevent a crash if env vars are not set.
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

// The original code threw an error if these were not set.
// We now log a warning instead, allowing the app to run in a degraded mode.
if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
  console.warn(
    'Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set. ' +
    'Using placeholder values. Online features like authentication and leaderboards will not work until properly configured.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
