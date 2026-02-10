
import type { VersionInfo, SystemSettings, InstructionContent, InstructionVersion } from './types';
import { currentVersion, systemSettings, instructionContent, simulateDelay, logAdminAction } from './db';

export const settingsApi = {
    getAppVersion: async (): Promise<VersionInfo> => {
        await simulateDelay(100);
        return currentVersion;
    },
    updateAppVersion: async (adminId: string, versionInfo: VersionInfo): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        Object.assign(currentVersion, versionInfo);
        logAdminAction(adminId, `Updated app version to ${versionInfo.version}`, 'System', 'version');
        return { success: true, message: 'App version updated successfully!' };
    },
    getSystemSettings: async (): Promise<SystemSettings> => {
        await simulateDelay(100);
        return systemSettings;
    },
    updateSystemSettings: async (adminId: string, settings: SystemSettings): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        Object.assign(systemSettings, settings);
        logAdminAction(adminId, 'Updated system settings', 'System', 'settings');
        return { success: true, message: 'System settings updated.' };
    },
    getInstructionContent: async (): Promise<InstructionContent> => {
        await simulateDelay(100);
        return instructionContent;
    },
    updateInstructionContent: async (adminId: string, content: Omit<InstructionContent, 'lastUpdatedAt'>): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(800);
        
        const oldVersion: InstructionVersion = {
            version: instructionContent.version,
            editedAt: instructionContent.lastUpdatedAt,
            editedBy: adminId, // Assuming the last editor was an admin, ideally this should be stored
            content: {
                title: instructionContent.title,
                content: instructionContent.content,
            }
        };

        const newHistory = [...(instructionContent.history || []), oldVersion];

        Object.assign(instructionContent, {
            ...content,
            lastUpdatedAt: new Date(),
            history: newHistory,
        });

        logAdminAction(adminId, `Updated instruction content to v${content.version}`, 'System', 'instructions');
        return { success: true, message: 'Instruction content updated.' };
    },
};
