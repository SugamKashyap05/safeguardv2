import { supabaseAdmin } from '../src/config/supabase';

const tables = [
    'parents',
    'children',
    'watch_history',
    'approved_channels',
    'blocked_content',
    'screen_time_rules',
    'notifications',
    'approval_requests',
    'child_sessions',
    'activity_logs'
];

async function verifyTables() {
    console.log('🔍 Verifying Supabase Database Tables...');
    let hasError = false;

    for (const table of tables) {
        try {
            // Try to select just one column from one row to minimize load
            // We use limit(0) just to check if the table allows the query syntax (exists)
            // Note: limit(0) might still return empty array if table exists.
            // If table doesn't exist, Supabase API usually returns a 404 or distinct error code.
            const { error } = await supabaseAdmin.from(table).select('id').limit(1);

            if (error) {
                // PostgREST returns 404/PGRST204? or "relation ... does not exist" code
                console.error(`❌ Table '${table}' check FAILED:`, error.message);
                hasError = true;
            } else {
                console.log(`✅ Table '${table}' exists.`);
            }
        } catch (err: any) {
            console.error(`❌ Table '${table}' check THREW Error:`, err.message);
            hasError = true;
        }
    }

    if (hasError) {
        console.error('\n⚠️  Some tables are missing or not accessible. Did you run the schema.sql script?');
        process.exit(1);
    } else {
        console.log('\n🎉 All tables verified successfully!');
        process.exit(0);
    }
}

verifyTables();
