
import { supabaseAdmin } from './src/config/supabase';

const fixDb = async () => {
    console.log('Fixing Database...');

    // 1. Devices Table
    const { error: devError } = await supabaseAdmin.rpc('run_sql', {
        sql: `
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
    `});

    // Fallback if RPC not enabled: Try raw query if supported or just warn
    if (devError) console.log('Device Table Error (RPC might get disabled):', devError.message);
    else console.log('Devices table ensured.');

    // 2. Session Sync
    const { error: syncError } = await supabaseAdmin.rpc('run_sql', {
        sql: `
        CREATE TABLE IF NOT EXISTS session_sync (
            child_id UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
            video_id VARCHAR(255),
            position INTEGER DEFAULT 0,
            device_id VARCHAR(255),
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            watch_queue TEXT[] DEFAULT '{}',
            last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `});
    if (syncError) console.log('Sync Table Error:', syncError.message);
    else console.log('Session Sync table ensured.');

    console.log('Done.');
};

// Direct Sql execution isn't always easy with Supabase JS client unless RPC is setup.
// A better way is to rely on the service logic.
// If the table doesn't exist, Supabase insert throws 500/400.
// I will instead create a migration SQL file and ask the user to run it in Supabase Dashboard SQL Editor
// OR I can try to use a node script that uses a raw postgres connection if I had credentials. I only have Supabase Key.
// Supabase JS doesn't support 'CREATE TABLE' directly via client unless using a stored procedure.
