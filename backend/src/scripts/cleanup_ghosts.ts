
import { supabaseAdmin } from '../config/supabase';

const cleanupGhosts = async () => {
    // 1. Get Child
    const { data: child } = await supabaseAdmin.from('children').select('id, name, created_at').limit(1).single();
    if (!child) return console.log('No child found');

    console.log(`Cleaning ghosts for: ${child.name} (Created: ${child.created_at})`);

    // 2. Delete
    const { error, count } = await supabaseAdmin
        .from('watch_history')
        .delete({ count: 'exact' })
        .eq('child_id', child.id)
        .lt('watched_at', child.created_at);

    if (error) console.error('Delete failed', error);
    else console.log(`✅ Deleted ${count} ghost records.`);
};

cleanupGhosts();
