
import { supabaseAdmin } from '../config/supabase';

const inspectHistory = async () => {
    // 1. Get the first child of the first parent (or just any child)
    // To be precise, we'd need the user's email, but let's just grab the most recently active child
    const { data: child } = await supabaseAdmin
        .from('children')
        .select('id, name, created_at, parent_id')
        .order('created_at', { ascending: false }) // Newest child
        .limit(1)
        .single();

    if (!child) return console.log('No child found');

    console.log(`Child: ${child.name} (Created: ${child.created_at})`);

    // 2. Query History before creation date? Or just all history
    const { data: history } = await supabaseAdmin
        .from('watch_history')
        .select('*')
        .eq('child_id', child.id)
        .order('watched_at', { ascending: true }); // Oldest first

    if (!history || history.length === 0) {
        console.log('✅ No history found.');
        return;
    }

    console.log(`Found ${history.length} history items.`);

    // Check for items before creation
    const creation = new Date(child.created_at).getTime();
    const ghosts = history.filter(h => new Date(h.watched_at).getTime() < creation);

    if (ghosts.length > 0) {
        console.log(`❌ FOUND ${ghosts.length} GHOST RECORDS (before creation)!`);
        console.log('Sample:', ghosts[0]);
    } else {
        console.log('✅ All history is after creation date.');
        console.log('Oldest record:', history[0].watched_at);
    }

    // Check distribution
    const counts: Record<string, number> = {};
    history.forEach(h => {
        const d = h.watched_at.split('T')[0];
        counts[d] = (counts[d] || 0) + 1;
    });
    console.log('Daily Counts:', counts);
};

inspectHistory();
