import prisma from '../src/config/prisma';
import { ActivityTrackingService } from '../src/services/activity-tracking.service';
import { ScreenTimeService } from '../src/services/screen-time.service';

const activityService = new ActivityTrackingService();
const screenService = new ScreenTimeService();

async function runVerification() {
    try {
        console.log('--- Verification Started ---');
        
        // 1. Get a test child
        const child = await prisma.child.findFirst();
        if (!child) {
            console.error('No child found in DB.');
            process.exit(1);
        }
        console.log(`Using Child: ${child.name} (${child.id})`);

        // 2. Set/Get limit
        const rules = await screenService.getRules(child.id);
        const limit = rules.dailyLimitMinutes;
        console.log(`Daily Limit: ${limit} mins`);

        // 3. Get Initial Status
        const initialStatus = await screenService.getDetailedStatus(child.id);
        console.log(`Initial Status: used=${initialStatus.used.toFixed(2)}, remaining=${initialStatus.remaining.toFixed(2)}`);

        // 4. Record 1 minute 30 seconds (90s) of watch time
        console.log('Recording 90 seconds of watch time...');
        await prisma.watchHistory.create({
            data: {
                childId: child.id,
                videoId: 'test_vid',
                videoTitle: 'Test Video',
                channelId: 'test_chan',
                channelName: 'Test Channel',
                watchedDuration: 90,
                duration: 600,
                watchedAt: new Date()
            }
        });

        // 5. Get Updated Status
        const updatedStatus = await screenService.getDetailedStatus(child.id);
        console.log(`Updated Status: used=${updatedStatus.used.toFixed(2)}, remaining=${updatedStatus.remaining.toFixed(2)}`);

        // 6. Verify Correctness
        // used should have increased by exactly 1.5
        const diff = updatedStatus.used - initialStatus.used;
        console.log(`Difference: ${diff.toFixed(2)} mins`);

        if (Math.abs(diff - 1.5) < 0.01) {
            console.log('✅ PASS: Usage tracked with second-precision!');
        } else {
            console.error('❌ FAIL: Usage logic incorrect or rounding still applied.');
        }

        // Cleanup
        await prisma.watchHistory.deleteMany({
            where: { videoId: 'test_vid', childId: child.id }
        });

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runVerification();
