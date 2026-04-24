import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
    earlyAccess: true,
    schema: 'prisma/schema.prisma',
    datasource: {
        url: process.env['DATABASE_URL'],
    },
    adapter: async () => {
        const { PrismaPg } = await import('@prisma/adapter-pg');
        const { Pool } = await import('pg');

        const pool = new Pool({
            connectionString: process.env['DATABASE_URL'],
        });

        return new PrismaPg(pool);
    },
    migrate: {
        adapter: async () => {
            const { PrismaPg } = await import('@prisma/adapter-pg');
            const { Pool } = await import('pg');

            const pool = new Pool({
                connectionString: (process.env['DIRECT_URL'] ?? process.env['DATABASE_URL']) + (process.env['DIRECT_URL']?.includes('?') ? '&' : '?') + 'statement_cache_size=0',
                max: 1 // Only one connection for migrations
            });

            return new PrismaPg(pool);
        },
    },
});
