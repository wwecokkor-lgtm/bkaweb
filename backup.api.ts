
import type { Backup } from './types';
import { mockBackups, getDatabaseState, setDatabaseState, simulateDelay, logAdminAction } from './db';

export const backupApi = {
    getBackups: async (): Promise<Backup[]> => {
        await simulateDelay(200);
        return [...mockBackups].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    createBackup: async (adminId: string): Promise<{ success: boolean; message: string; backup?: Backup }> => {
        await simulateDelay(2000); // Simulating a longer process for backup
        try {
            const currentState = getDatabaseState();
            const newBackup: Backup = {
                id: `backup-${Date.now()}`,
                timestamp: new Date(),
                data: JSON.stringify(currentState),
            };
            mockBackups.push(newBackup);
            logAdminAction(adminId, 'Created a new system backup', 'System', newBackup.id);
            return { success: true, message: 'System backup created successfully!', backup: newBackup };
        } catch (e) {
            console.error('Backup failed:', e);
            return { success: false, message: 'Failed to create backup.' };
        }
    },
    restoreBackup: async (adminId: string, backupId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(3000); // Simulating a longer restore process
        const backup = mockBackups.find(b => b.id === backupId);
        if (!backup) {
            return { success: false, message: 'Backup not found.' };
        }
        try {
            const restoredState = JSON.parse(backup.data);
            setDatabaseState(restoredState);
            logAdminAction(adminId, `Restored system from backup ${backupId}`, 'System', backupId);
            return { success: true, message: 'System has been restored from the backup.' };
        } catch (e) {
            console.error('Restore failed:', e);
            return { success: false, message: 'Failed to restore from backup. The backup file may be corrupt.' };
        }
    },
    deleteBackup: async (adminId: string, backupId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const backupIndex = mockBackups.findIndex(b => b.id === backupId);
        if (backupIndex === -1) {
            return { success: false, message: 'Backup not found.' };
        }
        mockBackups.splice(backupIndex, 1);
        logAdminAction(adminId, `Deleted backup ${backupId}`, 'System', backupId);
        return { success: true, message: 'Backup deleted successfully.' };
    }
};
