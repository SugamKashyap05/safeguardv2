
import { ActivityTrackingService } from '../src/services/activity-tracking.service';
import prisma from '../src/config/prisma';

async function testLogging() {
    console.log('--- Testing Watch History Logging System ---');
    
    const service = new ActivityTrackingService();
    
    // 1. Get a test child
    const child = await prisma.child.findFirst();
    if (!child) {
        console.error('❌ No child found in database. Please create a child first.');
        process.exit(1);
    }
    
    console.log(`Using Child: ${child.name} (${child.id})`);

    const testData = {
        childId: child.id,
        videoId: 'test_video_123',
        videoTitle: 'Test Video Architecture',
        channelId: 'test_channel_456',
        channelName: 'Test Channel Name',
        channelThumbnail: 'https://via.placeholder.com/150',
        thumbnail: 'https://via.placeholder.com/300',
        duration: 600,
        watchedDuration: 120,
        completedWatch: false
    };

    try {
        console.log('Attempting to create watch history record...');
        const result = await service.recordWatchHistory(testData);
        console.log('✅ SUCCESS: Record created with ID:', result.id);
        
        // Clean up
        await prisma.watchHistory.delete({ where: { id: result.id } });
        console.log('🧹 Cleanup: Test record deleted.');
        
    } catch (error: any) {
        console.error('❌ FAILED: Error recording watch history:');
        console.error(error.message || error);
        
        if (error.message?.includes('channel_thumbnail')) {
            console.log('\n--- DIAGNOSIS ---');
            console.log('The column "channel_thumbnail" is indeed missing from the database.');
            console.log('Fix: Run "npx prisma db push" or "npx prisma migrate dev".');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testLogging();
