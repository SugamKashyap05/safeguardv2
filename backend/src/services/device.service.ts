import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class DeviceService {

    async registerDevice(childId: string, data: {
        deviceId: string;
        deviceName: string;
        deviceType?: string;
        platform?: string;
        pushToken?: string;
    }) {
        // Upsert: update if exists, insert if not
        return prisma.device.upsert({
            where: {
                childId_deviceId: { childId, deviceId: data.deviceId },
            },
            update: {
                deviceName: data.deviceName,
                deviceType: data.deviceType,
                platform: data.platform,
                pushToken: data.pushToken,
                isActive: true,
                lastActive: new Date(),
            },
            create: {
                childId,
                deviceId: data.deviceId,
                deviceName: data.deviceName,
                deviceType: data.deviceType ?? 'unknown',
                platform: data.platform,
                pushToken: data.pushToken,
            },
        });
    }

    async getChildDevices(childId: string) {
        return prisma.device.findMany({
            where: { childId, isActive: true },
            orderBy: { lastActive: 'desc' },
        });
    }

    async removeDevice(childId: string, deviceId: string) {
        const device = await prisma.device.findFirst({
            where: { childId, deviceId },
        });
        if (!device) throw new AppError('Device not found', HTTP_STATUS.NOT_FOUND);

        await prisma.device.update({
            where: { id: device.id },
            data: { isActive: false },
        });
        return { success: true };
    }

    async updateLastActive(childId: string, deviceId: string) {
        const device = await prisma.device.findFirst({
            where: { childId, deviceId },
        });
        if (!device) return;

        await prisma.device.update({
            where: { id: device.id },
            data: { lastActive: new Date() },
        });
    }

    async checkDeviceLimit(childId: string): Promise<boolean> {
        const count = await prisma.device.count({
            where: { childId, isActive: true },
        });
        return count < 5; // Max 5 devices per child
    }
}
