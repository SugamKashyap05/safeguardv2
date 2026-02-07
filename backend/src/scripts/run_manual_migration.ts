
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL; // Try common names

if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
}

async function run() {
    console.log('Connecting to DB...');
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false } // Required for Supabase usually
    });

    try {
        await client.connect();
        console.log('Connected.');

        const sqlPath = path.resolve(__dirname, '../db/migrations/13_create_playlists.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration: 13_create_playlists.sql');
        await client.query(sql);
        console.log('Migration successful!');

    } catch (err: any) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

run();
