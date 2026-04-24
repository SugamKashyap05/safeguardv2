
import { Pool } from 'pg';
import 'dotenv/config';

async function fixSchema() {
    console.log('--- Database Manual Sync Script ---');
    
    const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!directUrl) {
        console.error('❌ No DATABASE_URL or DIRECT_URL found.');
        return;
    }

    console.log('Connecting to:', directUrl.split('@')[1]); // Log host only for safety

    const pool = new Pool({
        connectionString: directUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Check if column exists
        console.log('Checking for "channel_thumbnail" column in "watch_history"...');
        const checkRes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'watch_history' AND column_name = 'channel_thumbnail';
        `);

        if (checkRes.rows.length === 0) {
            console.log('Column not found. Adding it now...');
            await pool.query('ALTER TABLE "public"."watch_history" ADD COLUMN "channel_thumbnail" TEXT;');
            console.log('✅ Column "channel_thumbnail" added successfully.');
        } else {
            console.log('✅ Column "channel_thumbnail" already exists.');
        }

        // 2. Also check "approved_channels" as it's in the schema but might be missing in DB
        console.log('Checking "approved_channels" table...');
        const checkApproved = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'approved_channels' AND column_name = 'channel_thumbnail';
        `);
        if (checkApproved.rows.length === 0) {
            console.log('Adding "channel_thumbnail" to "approved_channels"...');
            await pool.query('ALTER TABLE "public"."approved_channels" ADD COLUMN "channel_thumbnail" TEXT;');
            console.log('✅ Column added to "approved_channels".');
        }

    } catch (error) {
        console.error('❌ SQL Error:', error);
    } finally {
        await pool.end();
        console.log('Disconnected.');
    }
}

fixSchema();
