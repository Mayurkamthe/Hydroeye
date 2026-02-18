import api from '../api/config';

export interface Alert {
    id: number;
    message: string;
    technicalDetails?: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    targetRole: 'CITIZEN' | 'AUTHORITY';
    latitude?: number;
    longitude?: number;
    createdAt: string;
    acknowledged: boolean;
    acknowledgedAt?: string;
    acknowledgedByName?: string;
}

export const AlertService = {
    getCitizenAlerts: async (): Promise<Alert[]> => {
        try {
            const response = await api.get('/alerts/citizen');
            return response.data;
        } catch (error) {
            console.warn('Failed to fetch citizen alerts:', error);
            return [];
        }
    },

    getAuthorityAlerts: async (): Promise<Alert[]> => {
        try {
            const response = await api.get('/alerts/authority');
            return response.data;
        } catch (error) {
            console.warn('Failed to fetch authority alerts:', error);
            return [];
        }
    },

    getUnacknowledgedAlerts: async (): Promise<Alert[]> => {
        try {
            const response = await api.get('/alerts/authority/unacknowledged');
            return response.data;
        } catch (error) {
            console.warn('Failed to fetch unacknowledged alerts:', error);
            return [];
        }
    },

    acknowledgeAlert: async (id: number): Promise<Alert> => {
        const response = await api.put(`/alerts/${id}/acknowledge`);
        return response.data;
    },

    getAlertCount: async (): Promise<number> => {
        try {
            const response = await api.get('/alerts/authority/count');
            return response.data.count || 0;
        } catch (error) {
            return 0;
        }
    },
};

export default AlertService;
