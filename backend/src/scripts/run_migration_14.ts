
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!dbUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

async function run() {
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const sqlPath = path.resolve(__dirname, '../db/migrations/14_add_device_paused.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await client.query(sql);
        console.log('Success!');
    } catch (err: any) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}
run();
