import { supabaseAdmin } from '../src/config/supabase';

async function verifyMigration() {
    console.log('🔍 Verifying Migration 01 (Child Lockout)...');

    try {
        // Attempt to select the new columns
        const { data, error } = await supabaseAdmin
            .from('children')
            .select('id, failed_pin_attempts, lockout_until')
            .limit(1);

        if (error) {
            console.error('❌ Migration verification failed:', error.message);
            process.exit(1);
        }

        console.log('✅ Columns "failed_pin_attempts" and "lockout_until" found in "children" table.');
        console.log('🎉 Migration 01 verified successfully!');
    } catch (err: any) {
        console.error('❌ Unexpected error:', err.message);
        process.exit(1);
    }
}

verifyMigration();
