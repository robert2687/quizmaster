import { createClient } from '@supabase/supabase-js';

// These variables are expected to be set in the environment.
// In a local development setup, this could be a .env file.
// In a deployed environment, these are configured as environment variables.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let effectiveSupabaseUrl = supabaseUrl;
let effectiveSupabaseAnonKey = supabaseAnonKey;

// FIX: To prevent the application from crashing when environment variables are not set
// (e.g., in a sandboxed environment), this check provides non-functional placeholders.
// This allows the app UI to load, although online features will fail gracefully
// with error messages instead of causing a startup crash.
if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set. ' +
    'Online features like authentication and leaderboards will not work.'
  );
  effectiveSupabaseUrl = 'https://placeholder.supabase.co';
  effectiveSupabaseAnonKey = 'placeholder.anon.key';
}

export const supabase = createClient(effectiveSupabaseUrl, effectiveSupabaseAnonKey);