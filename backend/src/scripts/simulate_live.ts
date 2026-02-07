
import { supabaseAdmin } from '../config/supabase';

const simulate = async () => {
    // 1. Get Child
    const { data: child } = await supabaseAdmin.from('children').select('id, name').limit(1).single();
    if (!child) return console.log('No child found');

    console.log(`Found child: ${child.name} (${child.id})`);

    // 2. Get a Video from History (to have valid metadata) or just make one up if we inserted metadata before
    // We need a video_id that EXISTS in watch_history if we want the dashboard to fetch title/thumb.
    // Let's grab the most recent history item.
    const { data: history } = await supabaseAdmin
        .from('watch_history')
        .select('*')
        .eq('child_id', child.id)
        .order('watched_at', { ascending: false })
        .limit(1)
        .single();

    // If no history, we can't show metadata easily unless we fake history too.
    // Let's assume history exists (we verified it recently).
    const videoId = history ? history.video_id : 'demo_vid_123';
    const videoTitle = history ? history.video_title : 'Live Test Video';

    console.log(`Simulating watching: ${videoTitle}`);

    // 3. Upsert Session Sync
    const { error } = await supabaseAdmin
        .from('session_sync')
        .upsert({
            child_id: child.id,
            video_id: videoId,
            position: 120, // 2 mins in
            device_id: 'simulated_device',
            started_at: new Date(Date.now() - 120000), // started 2 mins ago
            last_synced_at: new Date() // Just now
        });

    if (error) console.error('Sim failed', error);
    else console.log('✅ Simulation Active! Refresh Dashboard now.');
};

simulate();
