import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function applySchema() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL is not defined in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: databaseUrl,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database.');

        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Running schema migration...');
        console.log(`📂 Source: ${schemaPath}`);

        // Execute the schema SQL
        await client.query(schemaSql);

        console.log('✅ Schema successfully applied!');
    } catch (err) {
        console.error('❌ Error executing schema:', err);
    } finally {
        await client.end();
        console.log('🔌 Disconnected.');
    }
}

applySchema();
