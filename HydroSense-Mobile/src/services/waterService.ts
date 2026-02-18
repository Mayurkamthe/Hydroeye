import api from '../api/config';

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
    status: string;
}

export interface CitizenStatus {
    safetyStatus: 'SAFE' | 'WARNING' | 'DANGER';
    message: string;
    lastUpdated: string;
}

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
                params: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching history:', error);
            return [];
        }
    },
};

export default WaterService;
