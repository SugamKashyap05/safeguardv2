import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import https from 'https';
import fetch from 'node-fetch';

// Custom fetch for development to ignore self-signed certificates
const customFetch = (url: string, options: any) => {
    if (env.NODE_ENV === 'development') {
        const agent = new https.Agent({
            rejectUnauthorized: false
        });
        return fetch(url, { ...options, agent });
    }
    return fetch(url, options);
};

// Server-side Supabase client with admin privileges (SERVICE ROLE KEY)
// WARNING: Never expose this client to the frontend or public!
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    global: {
        fetch: customFetch as any
    }
});

// Regular Supabase client (ANON KEY)
// Used for operations that should respect Row Level Security (RLS) policies as a specific user
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
        fetch: customFetch as any
    }
});
