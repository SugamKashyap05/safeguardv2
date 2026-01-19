
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useParams } from 'react-router-dom';
import { Trash2, Smartphone, Monitor, Tablet, Tv } from 'lucide-react';

export const ParentDevicesPage = () => {
    // Ideally this would be a sub-page of ChildManagement or a modal. 
    // For now we assume it's /parent/devices/:childId or implemented inside ChildManagement
    // But per task, let's make it a standalone component and maybe integrate it.
    // Wait, the prompt said "Parent Devices Page". I'll make a component "ChildDevicesList" 
    // that can be embedded in ChildManagementPage.

    // However, if I make a full page:
    return null;
};

// I'll create a component instead for better UX integration
interface Device {
    id: string;
    device_name: string;
    device_type: string;
    platform: string;
    last_active: string;
    is_active: boolean;
}

export const ChildDevicesList = ({ childId }: { childId: string }) => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDevices();
    }, [childId]);

    const loadDevices = async () => {
        try {
            const res = await api.get(`/devices/${childId}`);
            setDevices(res.data.data || []);
        } catch (err) {
            console.error('Failed to load devices', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (deviceId: string) => {
        if (!confirm('Are you sure you want to remove this device? The child will need to re-register.')) return;
        try {
            await api.delete(`/devices/${deviceId}`, { params: { childId } });
            setDevices(devices.filter(d => d.id !== deviceId));
        } catch (err) {
            console.error('Failed to remove device', err);
        }
    };

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'mobile': return <Smartphone size={20} />;
            case 'tablet': return <Tablet size={20} />;
            case 'desktop': return <Monitor size={20} />;
            case 'tv': return <Tv size={20} />;
            default: return <Monitor size={20} />;
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-400">Loading devices...</div>;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-700">Connected Devices</h3>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {devices.filter(d => d.is_active).length} Active
                </span>
            </div>

            <div className="divide-y divide-gray-50">
                {devices.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No devices registered yet.</div>
                ) : (
                    devices.map(device => (
                        <div key={device.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-100 text-gray-500 rounded-xl">
                                    {getIcon(device.device_type)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{device.device_name}</h4>
                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                        {device.platform} •
                                        <span className={device.is_active ? 'text-green-500' : 'text-gray-400'}>
                                            {device.is_active ? ' Active Now' : ` Last seen ${new Date(device.last_active).toLocaleDateString()}`}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemove(device.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Device"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
