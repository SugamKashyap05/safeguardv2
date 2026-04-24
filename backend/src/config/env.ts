import { cleanEnv, str, port, num } from 'envalid';
import dotenv from 'dotenv';
dotenv.config();

export const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    PORT: port({ default: 5000 }),

    // Supabase Auth (Google OAuth — kept for auth.service.ts)
    SUPABASE_URL: str({ desc: 'Your Supabase Project URL' }),
    SUPABASE_ANON_KEY: str({ desc: 'Supabase Anon Key' }),
    SUPABASE_SERVICE_ROLE_KEY: str({ desc: 'Supabase Service Role Key (Auth only)' }),
    SUPABASE_JWT_SECRET: str({ desc: 'Supabase JWT Secret for verifying parent tokens' }),

    // Prisma Database Connection (connects directly to Supabase PostgreSQL)
    DATABASE_URL: str({ desc: 'PostgreSQL connection string via pgBouncer (pooled)' }),
    DIRECT_URL: str({ desc: 'Direct PostgreSQL connection string (for Prisma migrations)' }),

    // External Services
    CORS_ORIGIN: str({ default: 'http://localhost:5173' }),
    YOUTUBE_API_KEY: str({ desc: 'Google Cloud API Key for YouTube Data API v3' }),
    YOUTUBE_API_QUOTA_LIMIT: num({ default: 10000, desc: 'Daily quota limit for YouTube API' }),

    // Security
    SESSION_SECRET: str({ desc: 'Secret for session cookies' }),
    JWT_SECRET: str({ desc: 'Secret for Child JWT tokens' }),

    // Email (Optional)
    EMAIL_SERVICE: str({ default: 'gmail' }),
    EMAIL_USER: str({ default: '' }),
    EMAIL_PASS: str({ default: '' }),
});
