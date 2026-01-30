import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { env } from '../src/config/env';

async function runMigration() {
    console.log('Running Migration 03_content_filters...');

    if (!env.DATABASE_URL) {
        console.error('DATABASE_URL not found in env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    try {
        await client.connect();
        const sqlPath = path.join(__dirname, '../src/db/migrations/03_content_filters.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('Successfully applied migration 03_content_filters');
    } catch (err) {
        console.error('Migration failed', err);
    } finally {
        await client.end();
    }
}

runMigration();
