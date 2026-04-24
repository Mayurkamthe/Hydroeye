import api from '../api/config';

export type WaterQualityStatus = 'SAFE' | 'UNSAFE';

export interface WaterQualityData {
    id?: number;
    ph: number;
    temperature: number;
    turbidity: number;
    tds: number;
    dissolvedOxygen: number;
    latitude?: number;
    longitude?: number;
    recordedAt: string;
    status: WaterQualityStatus;
    deviceId?: string;
    approachingUnsafe?: boolean;
    statusMessage?: string;
}

export interface CitizenStatus {
    status: 'SAFE' | 'UNSAFE';
    message: string;
    lastUpdated: string;
    recommendation?: string;
    approachingUnsafe?: boolean;
}

// Map of deviceId → latest WaterQualityData
export type DeviceStatusMap = Record<string, WaterQualityData>;

export const WaterService = {
    getCurrentStatus: async (): Promise<WaterQualityData | null> => {
        try {
            const response = await api.get('/water/current');
            return response.data;
        } catch (error) {
            console.error('Error fetching current status:', error);
            return null;
        }
    },

    getCitizenStatus: async (): Promise<CitizenStatus | null> => {
        try {
            const response = await api.get('/water/citizen-status');
            return response.data;
        } catch (error) {
            console.error('Error fetching citizen status:', error);
            return null;
        }
    },

    getHistory: async (days: number = 7): Promise<WaterQualityData[]> => {
        try {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - days);
            const response = await api.get('/water/history', {
                params: { start: start.toISOString(), end: end.toISOString() },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching history:', error);
            return [];
        }
    },

    // All devices current status (device-wise overview)
    getAllDevicesStatus: async (): Promise<DeviceStatusMap> => {
        try {
            const response = await api.get('/water/devices/status/all');
            return response.data;
        } catch (error) {
            console.error('Error fetching all devices status:', error);
            return {};
        }
    },

    // Latest reading for a specific device
    getDeviceCurrentStatus: async (deviceId: string): Promise<WaterQualityData | null> => {
        try {
            const response = await api.get(`/water/devices/${deviceId}/current`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching status for device ${deviceId}:`, error);
            return null;
        }
    },

    // History for a specific device
    getDeviceHistory: async (deviceId: string): Promise<WaterQualityData[]> => {
        try {
            const response = await api.get(`/water/devices/${deviceId}/history`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching history for device ${deviceId}:`, error);
            return [];
        }
    },

    // Filter a device's readings by SAFE or UNSAFE
    getDeviceReadingsByStatus: async (deviceId: string, status: WaterQualityStatus): Promise<WaterQualityData[]> => {
        try {
            const response = await api.get(`/water/devices/${deviceId}/status/${status}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${status} readings for device ${deviceId}:`, error);
            return [];
        }
    },

    // All registered device IDs
    getAllDeviceIds: async (): Promise<string[]> => {
        try {
            const response = await api.get('/water/devices');
            return response.data;
        } catch (error) {
            console.error('Error fetching device IDs:', error);
            return [];
        }
    },
};

export default WaterService;
