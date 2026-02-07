
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Starting verification...');

    // 1. Generate random Child ID
    const childId = '00000000-0000-0000-0000-000000000000'; // Using a dummy UUID, assuming it doesn't violate FK for this test (or we might need a real one)
    // Actually, playlists table might require valid child_id FK. 
    // If so, we can't easily insert without a user.
    // Let's check if we can query strictly by what logic is in the service without inserting? 
    // The service queries `playlists` table.

    // Alternative: Just call the API with a childId that DOES have playlists.
    // but I don't know one.

    // Okay, let's try to fetch a real child first.
    const { data: children } = await supabase.from('children').select('id').limit(1);

    if (!children || children.length === 0) {
        console.log('No children found to test with.');
        return;
    }

    const testChildId = children[0].id;
    console.log(`Testing with child: ${testChildId}`);

    // 2. Insert a "Fake" playlist with title "Crash Course Kids"
    // Using upsert or insert
    const { error: insertError } = await supabase.from('playlists').upsert({
        child_id: testChildId,
        name: 'Crash Course Kids',
        type: 'custom',
        is_default: false
    }, { onConflict: 'child_id, name' }); // Assuming unique constraint might exist or we just want to ensure it's there. 
    // Actually playlists constraint is PK. we rely on ID. 
    // Just force insert, if it fails, log it.

    if (insertError) {
        console.error('Insert failed:', insertError);
    } else {
        console.log('Inserted test playlist "Crash Course Kids"');
    }

    // Check if it's actually there
    const { data: check } = await supabase.from('playlists').select('name').eq('child_id', testChildId).eq('name', 'Crash Course Kids');
    console.log('DB Check:', check);

    // 3. Call the API (using fetch locally)
    const url = `http://localhost:5000/api/v1/playlists/discover?childId=${testChildId}`;
    console.log('Fetching:', url);
    const response = await fetch(url);
    const json = await response.json();
    console.log('API Response Success:', json.success);

    // 4. Verify "Crash Course Kids" is NOT in the education list
    const educationList = json.data.education;
    const found = educationList.find((p: any) => p.title === 'Crash Course Kids');

    if (found) {
        console.error('FAILED: "Crash Course Kids" was found in discovery list but should be filtered out!');
    } else {
        console.log('SUCCESS: "Crash Course Kids" was correctly filtered out.');
    }

    // 5. Cleanup
    await supabase.from('playlists').delete().match({ child_id: testChildId, name: 'Crash Course Kids' });
    console.log('Cleanup done.');
}

test();
