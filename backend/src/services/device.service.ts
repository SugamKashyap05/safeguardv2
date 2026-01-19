
import { supabase } from '../config/supabase';

interface DeviceInfo {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    platform: string;
    pushToken?: string;
}

export class DeviceService {

    // Register or Update Device
    async registerDevice(childId: string, deviceInfo: DeviceInfo) {
        // Enforce Limits first
        const canAdd = await this.checkDeviceLimit(childId);

        // We need to check if device exists. If it does, update. If not, check limit before insert.
        // Simplified: Direct upsert logic with limit check handled by DB or explicit count.

        // Check if device exists
        const { data: existing } = await supabase
            .from('devices')
            .select('id')
            .eq('child_id', childId)
            .eq('device_id', deviceInfo.deviceId)
            .single();

        if (!existing) {
            if (!canAdd) {
                throw new Error('Device limit reached. Please upgrade to Premium or remove an old device.');
            }
        }

        const { data, error } = await supabase
            .from('devices')
            .upsert({
                child_id: childId,
                device_id: deviceInfo.deviceId,
                device_name: deviceInfo.deviceName,
                device_type: deviceInfo.deviceType,
                platform: deviceInfo.platform,
                push_token: deviceInfo.pushToken,
                is_active: true,
                last_active: new Date()
            }, { onConflict: 'child_id,device_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Check Limit
    async checkDeviceLimit(childId: string): Promise<boolean> {
        // Get Parent sub tier
        const { data: child } = await supabase
            .from('children')
            .select('parent_id')
            .eq('id', childId)
            .single();

        if (!child) return false;

        const { data: parent } = await supabase
            .from('parents')
            .select('subscription_tier')
            .eq('id', child.parent_id)
            .single();

        const tier = parent?.subscription_tier || 'free';
        const limit = tier === 'free' ? 2 : 5; // Family tier might be higher

        const { count } = await supabase
            .from('devices')
            .select('id', { count: 'exact', head: true })
            .eq('child_id', childId)
            .eq('is_active', true);

        return (count || 0) < limit;
    }

    // Remove Device
    async removeDevice(childId: string, deviceId: string) { // deviceId here is the internal UUID or the local ID? 
        // Let's assume ID is the PK UUID
        const { error } = await supabase
            .from('devices')
            .delete()
            .eq('id', deviceId)
            .eq('child_id', childId);

        if (error) throw error;
    }

    // List Devices
    async getDevices(childId: string) {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('child_id', childId)
            .order('last_active', { ascending: false });

        if (error) throw error;
        return data;
    }
}
