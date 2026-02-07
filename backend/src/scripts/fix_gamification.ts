
import { supabaseAdmin } from '../config/supabase';
import { gamificationService } from '../services/gamification.service';
import { questService } from '../services/quest.service';

const fixGamification = async () => {
    // 1. Get Child
    const { data: child } = await supabaseAdmin.from('children').select('id, name').limit(1).single();
    if (!child) return console.log('No child found');

    console.log(`Fixing gamification for: ${child.name}`);

    // 2. Count Total History
    const { count, error } = await supabaseAdmin
        .from('watch_history')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', child.id);

    if (error) return console.error(error);

    console.log(`Found ${count} completed videos.`);

    // 3. Award XP/Badges
    // Let's assume 1 video = 1 star for backfill? Or just update quest?
    // Let's manually trigger quest update for 'videos_watched'

    // We can't easily replay distinct events for quests without date logic.
    // But we can award a "Backfill Bonus" of stars.

    if (count && count > 0) {
        // Award 10 stars per 10 videos?
        const starsToAward = Math.floor(count / 5); // 1 star per 5 videos

        console.log(`Awarding ${starsToAward} stars for past history...`);
        await gamificationService.awardStars(child.id, starsToAward, 'History Backfill');

        // Also force check badges
        await gamificationService.checkStarBadges(child.id, (await gamificationService.getStats(child.id)).total_stars_earned);

        console.log('✅ Backfill complete.');
    } else {
        console.log('No history to backfill.');
    }
};

fixGamification();
