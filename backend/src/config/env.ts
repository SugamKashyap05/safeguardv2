import { cleanEnv, str, port, num } from 'envalid';
import dotenv from 'dotenv';
dotenv.config();

export const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    PORT: port({ default: 5000 }),

    // Supabase
    SUPABASE_URL: str({ desc: 'Your Supabase Project URL' }),
    SUPABASE_ANON_KEY: str({ desc: 'Supabase Anon Key' }),
    SUPABASE_SERVICE_ROLE_KEY: str({ desc: 'Supabase Service Role Key (Admin)' }),
    SUPABASE_JWT_SECRET: str({ desc: 'Supabase JWT Secret' }),
    DATABASE_URL: str({ desc: 'PostgreSQL Connection String' }),

    // External Services
    CORS_ORIGIN: str({ default: 'http://localhost:5173' }),
    YOUTUBE_API_KEY: str({ desc: 'Google Cloud API Key for YouTube Data API v3' }),
    YOUTUBE_API_QUOTA_LIMIT: num({ default: 10000, desc: 'Daily quota limit for YouTube API' }),

    // Security
    SESSION_SECRET: str({ desc: 'Secret for session cookies' }),
    JWT_SECRET: str({ desc: 'Secret for Child Tokens' }),

    // Email (Optional for now but good to have)
    EMAIL_SERVICE: str({ default: 'gmail' }),
    EMAIL_USER: str({ default: '' }),
    EMAIL_PASS: str({ default: '' }),
});
