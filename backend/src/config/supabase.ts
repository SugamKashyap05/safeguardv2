import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Server-side Supabase client with admin privileges (SERVICE ROLE KEY)
// WARNING: Never expose this client to the frontend or public!
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Regular Supabase client (ANON KEY)
// Used for operations that should respect Row Level Security (RLS) policies as a specific user
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
