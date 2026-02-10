
import type { AdminLog } from './types';
import { mockAdminLogs, simulateDelay } from './db';

export const logApi = {
    getAdminLogs: async (): Promise<AdminLog[]> => {
        await simulateDelay(200);
        return [...mockAdminLogs];
    },
};
