
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
    console.log('Starting Daily Quests migration...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const migrationPath = path.join(__dirname, '../src/db/migrations/09_daily_quests.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log(`Applying migration from ${migrationPath}...`);
        await client.query(sql);

        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Error applying migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
