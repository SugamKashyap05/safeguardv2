
import { supabaseAdmin } from '../config/supabase';

const debugUsage = async () => {
    // 1. Get Child
    const { data: child } = await supabaseAdmin.from('children').select('id, name').limit(1).single();
    if (!child) return console.log('No child found');
    console.log(`Checking state for: ${child.name}`);

    // 2. Get Rules (Usage vs Limit)
    const { data: rules } = await supabaseAdmin
        .from('screen_time_rules')
        .select('*')
        .eq('child_id', child.id)
        .single();

    console.log('--- RULES ---');
    console.log(`Daily Limit: ${rules.daily_limit_minutes}m`);
    console.log(`Today Usage (DB): ${rules.today_usage_minutes}m`);
    console.log(`Last Reset: ${rules.last_reset_date}`);

    // 3. Calculate Actual Usage from History (Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: history } = await supabaseAdmin
        .from('watch_history')
        .select('video_title, watched_duration, watched_at')
        .eq('child_id', child.id)
        .gte('watched_at', today.toISOString());

    console.log('--- REAL HISTORY (Today) ---');
    let totalSeconds = 0;
    if (history) {
        history.forEach(h => {
            console.log(`- ${h.video_title}: ${h.watched_duration}s`);
            totalSeconds += (h.watched_duration || 0);
        });
    }
    const realMinutes = Math.ceil(totalSeconds / 60);
    console.log(`Calculated Total: ${realMinutes}m`);

    // 4. Discrepancy?
    if (Math.abs(realMinutes - (rules.today_usage_minutes || 0)) > 1) {
        console.log('❌ CRITICAL DISCREPANCY: DB Usage does not match History!');
    } else {
        console.log('✅ DB Usage matches History.');
    }
};

debugUsage();
