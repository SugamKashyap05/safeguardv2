import { supabase } from '../config/supabase';

/**
 * Cleanup script to remove old test devices
 * Run this to clear device limit issues during development
 */

async function cleanupDevices() {
    try {
        console.log('Starting device cleanup...');

        // Get count before
        const { count: beforeCount } = await supabase
            .from('devices')
            .select('id', { count: 'exact', head: true });

        console.log(`Found ${beforeCount} total devices`);

        // Option 1: Delete all inactive devices
        const { error: error1, data: inactive } = await supabase
            .from('devices')
            .delete()
            .eq('is_active', false)
            .select();

        if (error1) throw error1;
        console.log(`Deleted ${inactive?.length || 0} inactive devices`);

        // Option 2: Keep only the most recent 3 devices per child
        const { data: children } = await supabase
            .from('children')
            .select('id');

        if (children) {
            for (const child of children) {
                // Get all devices for this child, ordered by last_active
                const { data: devices } = await supabase
                    .from('devices')
                    .select('id')
                    .eq('child_id', child.id)
                    .order('last_active', { ascending: false });

                if (devices && devices.length > 3) {
                    // Keep first 3, delete rest
                    const toDelete = devices.slice(3).map(d => d.id);
                    const { error: deleteError } = await supabase
                        .from('devices')
                        .delete()
                        .in('id', toDelete);

                    if (deleteError) {
                        console.error(`Error deleting devices for child ${child.id}:`, deleteError);
                    } else {
                        console.log(`Cleaned up ${toDelete.length} old devices for child ${child.id}`);
                    }
                }
            }
        }

        // Get count after
        const { count: afterCount } = await supabase
            .from('devices')
            .select('id', { count: 'exact', head: true });

        console.log(`\n✅ Cleanup complete!`);
        console.log(`   Before: ${beforeCount} devices`);
        console.log(`   After: ${afterCount} devices`);
        console.log(`   Deleted: ${(beforeCount || 0) - (afterCount || 0)} devices`);

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

cleanupDevices()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
