import api from '../api/config';

export interface Device {
    id: number;
    deviceId: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    status: 'ACTIVE' | 'INACTIVE' | 'WARNING';
    lastReading?: string;
    createdAt: string;
}

export interface CreateDeviceDTO {
    deviceId: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
}

export const DeviceService = {
    getDevices: async (): Promise<Device[]> => {
        try {
            const response = await api.get('/devices');
            return response.data;
        } catch (error) {
            console.error('Error fetching devices:', error);
            return [];
        }
    },

    addDevice: async (device: CreateDeviceDTO): Promise<Device> => {
        try {
            const response = await api.post('/devices', device);
            return response.data;
        } catch (error) {
            console.error('Error adding device:', error);
            throw error;
        }
    },

    updateDevice: async (id: number, device: Partial<CreateDeviceDTO>): Promise<Device> => {
        try {
            const response = await api.put(`/devices/${id}`, device);
            return response.data;
        } catch (error) {
            console.error('Error updating device:', error);
            throw error;
        }
    },

    deleteDevice: async (id: number): Promise<void> => {
        try {
            await api.delete(`/devices/${id}`);
        } catch (error) {
            console.error('Error deleting device:', error);
            throw error;
        }
    },
};

export default DeviceService;
