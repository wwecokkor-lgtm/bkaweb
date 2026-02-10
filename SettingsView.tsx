
import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from './commonComponents';
import type { VersionInfo, SystemSettings, Backup } from './types';
import { useAppStore } from './store';
import { api } from './api';
import { NotificationType } from './types';
import BackupPreviewModal from './BackupPreviewModal';

interface SettingsViewProps {
    versionInfo: VersionInfo | null;
    systemSettings: SystemSettings | null;
    backups: Backup[];
    onSave: () => void;
    onEditInstructions: () => void;
    onPreviewBackup: (backup: Backup) => void;
    setConfirmationAction: (action: { title: string; message: string; actionType: 'danger' | 'warning'; onConfirm: () => Promise<any>; } | null) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ versionInfo, systemSettings, backups, onSave, onEditInstructions, onPreviewBackup, setConfirmationAction }) => {
    const { fontPreference, setFontPreference, user, addNotification } = useAppStore();
    const [currentSettings, setCurrentSettings] = useState<SystemSettings | null>(systemSettings);
    const [isBackupLoading, setIsBackupLoading] = useState(false);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    
    useEffect(() => { 
        setCurrentSettings(systemSettings);
        if (systemSettings) {
            setLogoPreview(systemSettings.logoUrl);
        }
    }, [systemSettings]);

    const handleSettingChange = (key: keyof SystemSettings, value: any) => { setCurrentSettings(prev => prev ? { ...prev, [key]: value } : null); };

    const handleSaveSettings = async () => {
        if (user && currentSettings) {
            const res = await api.updateSystemSettings(user.id, currentSettings);
            addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
            if (res.success) onSave();
        }
    };
    
    const handleCreateBackup = async () => {
        if (!user) return;
        setIsBackupLoading(true);
        const res = await api.createBackup(user.id);
        addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
        if(res.success) onSave(); // refetch all data including backups
        setIsBackupLoading(false);
    };

    const handleRestoreBackup = (backup: Backup) => {
        if (!user) return;
        setConfirmationAction({
            title: "Confirm Restore",
            message: `Are you sure you want to restore from the backup created on ${new Date(backup.timestamp).toLocaleString()}? All current data will be overwritten. This action cannot be undone.`,
            actionType: 'danger',
            onConfirm: async () => {
                const res = await api.restoreBackup(user.id, backup.id);
                addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
                if(res.success) onSave();
            }
        });
    };

    const handleDownloadBackup = (backup: Backup) => {
        const blob = new Blob([backup.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bk-academy-backup-${new Date(backup.timestamp).toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDeleteBackup = (backupId: string) => {
        if (!user) return;
        setConfirmationAction({
            title: "Delete Backup?",
            message: "Are you sure you want to permanently delete this backup? This action is irreversible.",
            actionType: 'danger',
            onConfirm: async () => {
                const res = await api.deleteBackup(user.id, backupId);
                addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
                if (res.success) onSave();
            },
        });
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveLogo = async () => {
        if (!user || !logoFile || !currentSettings) return;
        const uploadRes = await api.uploadPhoto(logoFile);
        if (uploadRes.success && uploadRes.url) {
            const newSettings = { ...currentSettings, logoUrl: uploadRes.url };
            const saveRes = await api.updateSystemSettings(user.id, newSettings);
            addNotification(saveRes.message, saveRes.success ? NotificationType.SUCCESS : NotificationType.ERROR);
            if (saveRes.success) {
                onSave();
                setLogoFile(null);
            }
        } else {
            addNotification(uploadRes.message || 'Logo upload failed', NotificationType.ERROR);
        }
    };
    
    if (!currentSettings) return null;

    const storageUsagePercentage = (currentSettings.storageUsageGB / currentSettings.storageLimitGB) * 100;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">System Settings</h2>

            <Card>
                 <h3 className="text-xl font-bold mb-4">Storage Status</h3>
                <div className="space-y-2">
                    <div className="w-full bg-slate-700 rounded-full h-4">
                        <div className="bg-sky-500 h-4 rounded-full" style={{ width: `${storageUsagePercentage}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-slate-300">
                        <span>{currentSettings.storageUsageGB.toFixed(2)} GB Used</span>
                        <span>{currentSettings.storageLimitGB} GB Total</span>
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold mb-4">Branding & Logo</h3>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-32 h-16 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0">
                        {logoPreview && <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain" />}
                    </div>
                    <div className="flex-grow w-full">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Upload New Logo</label>
                        <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600/20 file:text-sky-400 hover:file:bg-sky-600/30"/>
                    </div>
                    <Button onClick={handleSaveLogo} disabled={!logoFile}>Save Logo</Button>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold mb-4">Backup & Restore</h3>
                <p className="text-slate-400 mb-4">Create a backup of all website data. Restore from a previous point in case of errors.</p>
                <div className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                    <span>Create a full snapshot of the current database.</span>
                    <Button onClick={handleCreateBackup} isLoading={isBackupLoading}>Create New Backup</Button>
                </div>
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {backups.map(backup => (
                        <div key={backup.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900/50 p-2 rounded-md gap-2">
                            <span className="text-sm font-mono">Backup from {new Date(backup.timestamp).toLocaleString()}</span>
                            <div className="space-x-2 flex-shrink-0">
                                <Button size="sm" variant="secondary" onClick={() => onPreviewBackup(backup)}>Preview</Button>
                                <Button size="sm" variant="secondary" onClick={() => handleDownloadBackup(backup)}>Download</Button>
                                <Button size="sm" variant="secondary" onClick={() => handleRestoreBackup(backup)}>Restore</Button>
                                <Button size="sm" variant="danger" onClick={() => handleDeleteBackup(backup.id)}>Delete</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Session Management</h3>
                    <Button onClick={handleSaveSettings}>Save Session Settings</Button>
                </div>
                <div className="space-y-4 mt-4">
                     <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-white">Single Device Login</p>
                            <p className="text-sm text-slate-400">If enabled, users can only be logged in on one device at a time.</p>
                        </div>
                        <input type="checkbox" className="toggle-checkbox" checked={currentSettings.singleDeviceLogin} onChange={e => handleSettingChange('singleDeviceLogin', e.target.checked)} />
                    </div>
                     <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-white">Idle Timeout (in minutes)</p>
                            <p className="text-sm text-slate-400">Automatically log out users after a period of inactivity. Set to 0 to disable.</p>
                        </div>
                        <Input type="number" value={currentSettings.sessionTimeoutInMinutes} onChange={e => handleSettingChange('sessionTimeoutInMinutes', Number(e.target.value))} className="w-24" />
                    </div>
                </div>
            </Card>

            <Card>
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Automated Popups</h3>
                    <Button onClick={handleSaveSettings}>Save Popup Settings</Button>
                </div>
                <div className="space-y-4 mt-4">
                     <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-white">Course Promotion Popup</p>
                            <p className="text-sm text-slate-400">Show a course promotion popup to new users on their first login.</p>
                        </div>
                        <input type="checkbox" className="toggle-checkbox" checked={currentSettings.isCoursePopupEnabled} onChange={e => handleSettingChange('isCoursePopupEnabled', e.target.checked)} />
                    </div>
                     <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-white">Mandatory Instruction Popup</p>
                            <p className="text-sm text-slate-400">Force all users to agree to instructions before using the site.</p>
                        </div>
                        <input type="checkbox" className="toggle-checkbox" checked={currentSettings.isInstructionPopupEnabled} onChange={e => handleSettingChange('isInstructionPopupEnabled', e.target.checked)} />
                    </div>
                </div>
                 <style>{`
                    .toggle-checkbox { width: 3.5rem; height: 1.75rem; appearance: none; background-color: #475569; border-radius: 9999px; position: relative; cursor: pointer; transition: background-color .2s ease-in-out; }
                    .toggle-checkbox::before { content: ""; width: 1.25rem; height: 1.25rem; background-color: white; border-radius: 9999px; position: absolute; top: 0.25rem; left: 0.25rem; transition: transform .2s ease-in-out; }
                    .toggle-checkbox:checked { background-color: #0ea5e9; }
                    .toggle-checkbox:checked::before { transform: translateX(1.75rem); }
                `}</style>
            </Card>

            <Card>
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Instruction Content</h3>
                    <Button variant="secondary" onClick={onEditInstructions}>Edit Instructions</Button>
                </div>
                <p className="text-slate-400 mt-2">Edit the content of the mandatory instruction popup shown to users.</p>
            </Card>

            <Card>
                <h3 className="text-xl font-bold mb-4">Website Version</h3>
                {versionInfo && ( <div className="space-y-2"> <p>Current Version: <span className="font-bold text-sky-400">{versionInfo.version}</span></p> <p>Release Date: {versionInfo.releaseDate}</p> </div> )}
            </Card>

            <Card>
                <h3 className="text-xl font-bold mb-4">বাংলা ফন্ট সেটিংস</h3>
                <p className="text-slate-400 mb-2">ওয়েবসাইটের সকল বাংলা লেখার জন্য ডিফল্ট ফন্ট নির্বাচন করুন।</p>
                <select value={fontPreference} onChange={e => setFontPreference(e.target.value)} className="w-full md:w-1/2 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="font-noto-bengali">Noto Sans Bengali (Default)</option>
                    <option value="font-solaiman-lipi">SolaimanLipi</option>
                </select>
            </Card>
        </div>
    );
};

export default SettingsView;
