
import { Request, Response } from 'express';
import { DeviceService } from '../services/device.service';
import { SyncService } from '../services/sync.service';

const deviceService = new DeviceService();
const syncService = new SyncService();

export class DeviceController {

    // Register Device
    static async register(req: Request, res: Response) {
        // Child ID from token (requireChild middleware) or body if parent registering? 
        // Spec says "Device Registration Flow (Child)", so assuming child token.
        // But also supports parent managing.
        // Let's assume req.user.id is child_id if role is child.

        const childId = req.params.childId || (req.user as any)?.childId || (req.user as any)?.id;
        // If parent is calling, they must provide childId in body or params

        const device = await deviceService.registerDevice(childId, req.body);
        res.status(201).json({ status: 'success', data: device });
    }

    // List Devices
    static async list(req: Request, res: Response) {
        const childId = req.params.childId;
        const devices = await deviceService.getDevices(childId);
        res.json({ status: 'success', data: devices });
    }

    // Remove Device
    static async remove(req: Request, res: Response) {
        const { deviceId } = req.params;
        const { childId } = req.query as any; // or from body

        await deviceService.removeDevice(childId, deviceId);
        res.json({ status: 'success', message: 'Device removed' });
    }

    // Check Status (Sync)
    static async getActiveSession(req: Request, res: Response) {
        const { childId } = req.params;
        const session = await syncService.getActiveSession(childId);
        res.json({ status: 'success', data: session });
    }
}
