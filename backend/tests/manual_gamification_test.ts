
import { gamificationService } from '../src/services/gamification.service';
import { supabaseAdmin } from '../src/config/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function testGamification() {
    console.log('🧪 Starting Gamification Verification...');

    // 1. Get a test child (or first child found)
    const { data: child } = await supabaseAdmin.from('children').select('id, name, stars').limit(1).single();

    if (!child) {
        console.error('❌ No child found to test with.');
        return;
    }

    console.log(`👶 Testing with child: ${child.name} (Current Stars: ${child.stars})`);

    // 2. Award Stars
    console.log('✨ Awarding 5 stars...');
    const result = await gamificationService.awardStars(child.id, 5, 'Test Award');
    console.log('✅ Result:', result);

    if (result && result.stars === (child.stars || 0) + 5) {
        console.log('✅ Star count correct.');
    } else {
        console.error('❌ Star count mismatch.');
    }

    // 3. Check Badges
    console.log('🏅 Checking Badges...');
    const badges = await gamificationService.getBadges(child.id);
    const earned = badges.filter(b => b.is_earned);
    console.log(`✅ Child has ${earned.length} badges earned.`);
    if (earned.length > 0) {
        console.log('Sample Badge:', earned[0].name);
    }

    // 4. Clean up (Optional - deduct stars back)
    console.log('🧹 Cleaning up (deducting 5 stars)...');
    await gamificationService.spendStars(child.id, 5, 'Test Cleanup');
    console.log('✅ Cleanup done.');
}

testGamification().catch(console.error);
