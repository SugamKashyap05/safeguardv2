
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const migrationQuery = `
-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'unknown',
    platform VARCHAR(50),
    push_token TEXT,
    is_active BOOLEAN DEFAULT true,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(child_id, device_id)
);

-- Session Sync Table
CREATE TABLE IF NOT EXISTS session_sync (
    child_id UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
    video_id VARCHAR(255),
    position INTEGER DEFAULT 0,
    device_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_queue TEXT[] DEFAULT '{}',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

async function runMigration() {
    try {
        console.log('Running migration...');
        await pool.query(migrationQuery);
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
