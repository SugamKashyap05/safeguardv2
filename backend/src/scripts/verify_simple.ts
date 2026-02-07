
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { console.error('Missing env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        console.log('Starting...');

        // 1. Get a child
        const { data: children } = await supabase.from('children').select('id').limit(1);
        if (!children || !children.length) { console.log('No child'); return; }
        const childId = children[0].id;
        console.log('Child:', childId);

        // 2. Insert PL
        const { data: pl, error: err } = await supabase.from('playlists').insert({
            child_id: childId, name: 'Crash Course Kids', type: 'custom', is_default: false
        }).select();

        if (err) console.error('Insert ERR:', err.message);
        else console.log('Inserted:', pl[0].name);

        // 3. Check Not Filtering first (dummy ID)
        const res1 = await fetch(`http://localhost:5000/api/v1/playlists/discover`);
        const json1 = await response.json();
        // Wait, fetch is not defined in node 14/16 without flag or package. 
        // using axios or node-fetch? Backend has 'axios'? No, backend uses express.
        // Frontend has axios. Backend might not have axios installed in standard deps?
        // Ah, `fetch` global is available in Node 18+. I am on windows, likely Node 18 or 20.
        // If not, it fails.
        // I'll use `http` module or just rely on console log.
        // But wait, `fetch` worked in previous run (it got a response structure).

        // 3. Fetch with childId
        console.log('Fetching API...');
        const res = await fetch(`http://localhost:5000/api/v1/playlists/discover?childId=${childId}`);
        const json = await res.json();

        const found = json.data.education.find((p: any) => p.title === 'Crash Course Kids');
        console.log('Found in discovery?', !!found);

        if (found) console.error('FAIL: Should be filtered');
        else console.log('PASS: Filtered successfully');

        // Cleanup
        if (!err) {
            await supabase.from('playlists').delete().eq('id', pl[0].id);
            console.log('Cleanup done');
        }

    } catch (e) {
        console.error('Exception:', e);
    }
}
test();
