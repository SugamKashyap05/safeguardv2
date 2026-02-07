import { supabaseAdmin as supabase } from '../config/supabase';

async function seed() {
    console.log('🌱 Seeding dashboard data...');

    // 0. CHECK FOR ORPHANED AUTH USERS (Fix for Database Reset)
    // We cannot query auth.users directly via JS client usually, but we can try listUsers if using the admin auth client
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
        console.error('⚠️ Could not list auth users:', usersError.message);
    } else if (users && users.length > 0) {
        console.log(`found ${users.length} auth users. Checking for missing parent profiles...`);

        for (const user of users) {
            const { data: existingParent } = await supabase.from('parents').select('id').eq('id', user.id).single();

            if (!existingParent) {
                console.log(`🛠️ Restoring orphaned parent profile for: ${user.email} (${user.id})`);
                const { error: insertError } = await supabase.from('parents').insert({
                    id: user.id,
                    email: user.email || 'unknown@example.com',
                    name: user.user_metadata?.full_name || 'Restored Parent',
                    subscription_tier: 'premium' // Give them premium for testing
                });

                if (insertError) console.error('❌ Failed to restore parent:', insertError.message);
                else console.log('✅ Parent profile restored.');
            }
        }
    }

    // 1. Get a parent
    const { data: parents } = await supabase.from('parents').select('id, email').limit(1);
    if (!parents || parents.length === 0) {
        console.error('❌ No parent found. Please Sign Up in the app first.');
        return;
    }
    const parentId = parents[0].id;
    console.log(`👨 Using Parent: ${parents[0].email} (${parentId})`);

    // 2. Get or Create Child
    let { data: children } = await supabase.from('children').select('id, name').eq('parent_id', parentId);
    let childId: string;

    if (!children || children.length === 0) {
        console.log('👶 Creating demo child...');
        const { data: newChild, error } = await supabase.from('children').insert({
            parent_id: parentId,
            name: 'Timmy',
            age: 8,
            pin_hash: '1234',
            age_appropriate_level: 'elementary',
            total_stars_earned: 50,
            stars: 10
        }).select().single();
        if (error) throw error;
        childId = newChild.id;
        console.log('✅ Created child Timmy');
    } else {
        childId = children[0].id;
        console.log(`👶 Using Child: ${children[0].name} (${childId})`);
    }

    // 3. Insert 7 Days of History
    const historyPayload = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Random minutes between 20 and 120
        const minutes = Math.floor(Math.random() * 100) + 20;
        const entries = Math.ceil(minutes / 10); // split into 10 min chunks

        for (let j = 0; j < entries; j++) {
            historyPayload.push({
                child_id: childId,
                video_id: `v${i}-${j}`,
                video_title: `Educational Video ${i}-${j}`,
                channel_id: 'c1',
                channel_name: 'Science Channel',
                duration: 600,
                watched_duration: 600, // 10 mins in seconds
                watched_at: date.toISOString()
            });
        }
    }

    const { error: historyError } = await supabase.from('watch_history').insert(historyPayload);
    if (historyError) console.error('History Error:', historyError);
    else console.log(`✅ Inserted ${historyPayload.length} history entries for charts.`);

    // 4. Insert Badges
    const badges = [
        { id: 'math-whiz', name: 'Math Master', icon: 'https://cdn-icons-png.flaticon.com/512/2936/2936725.png' },
        { id: 'early-bird', name: 'Early Bird', icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' },
        { id: 'explorer', name: 'Explorer', icon: 'https://cdn-icons-png.flaticon.com/512/2583/2583321.png' }
    ];

    const badgePayload = badges.map(b => ({
        child_id: childId,
        badge_id: b.id,
        metadata: { icon: b.icon, name: b.name },
        earned_at: new Date(new Date().getTime() - Math.random() * 100000000).toISOString()
    }));

    // Use upsert to avoid unique constraint if re-running
    const { error: badgeError } = await supabase.from('child_badges').upsert(badgePayload, { onConflict: 'child_id,badge_id' });
    if (badgeError) console.error('Badge Error:', badgeError);
    else console.log('✅ Inserted Badges');

    // 5. Create Active Session (Online Status)
    const { error: sessionError } = await supabase.from('child_sessions').insert({
        child_id: childId,
        token_hash: 'dummy-token-' + Date.now(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        is_active: true
    });
    if (sessionError) console.error('Session Error:', sessionError);
    else console.log('✅ Created Active Session (Child is Online)');

    console.log('🌱 Seeding Complete!');
}

seed();
