import { supabaseAdmin as supabase } from '../config/supabase';

async function clearData() {
    console.log('🧹 Clearing Seeded Data...');

    // 1. Delete "Timmy"
    // This will CASCADE delete: watch_history, child_badges, child_sessions, screen_time_rules
    const { data: deleted, error } = await supabase
        .from('children')
        .delete()
        .eq('name', 'Timmy')
        .select();

    if (error) {
        console.error('❌ Error deleting Timmy:', error.message);
    } else if (deleted && deleted.length > 0) {
        console.log(`✅ Deleted ${deleted.length} child profile(s) named "Timmy".`);
        console.log('   (Cascaded deletes removed history, badges, and sessions.)');
    } else {
        console.log('ℹ️ No child named "Timmy" found to delete.');
    }

    // 2. Verify Connection
    console.log('\n🔌 Verifying Backend <-> Supabase Connection...');
    const { count, error: countError } = await supabase
        .from('parents')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Connection Failed:', countError.message);
    } else {
        console.log(`✅ Connection Successful! Found ${count} parent record(s) in database.`);
    }
}

clearData();
