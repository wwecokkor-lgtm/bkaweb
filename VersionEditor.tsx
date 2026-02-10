
import React, { useState } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { VersionInfo } from './types';
import { Modal, Button, Input } from './commonComponents';
import { NotificationType } from './types';

interface VersionEditorProps {
    versionInfo: VersionInfo;
    onClose: () => void;
    onSave: () => void;
}

const VersionEditor: React.FC<VersionEditorProps> = ({ versionInfo, onClose, onSave }) => {
    const { user, addNotification } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        version: versionInfo.version,
        releaseDate: versionInfo.releaseDate,
        changelog: versionInfo.changelog.join('\n'),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        const updatedVersionInfo: VersionInfo = {
            ...formData,
            changelog: formData.changelog.split('\n').filter(line => line.trim() !== ''),
        };
        const res = await api.updateAppVersion(user.id, updatedVersionInfo);
        addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
        if (res.success) {
            onSave();
        }
        setIsLoading(false);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Update App Version" size="lg">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="version" label="Version (e.g., 1.2.1)" value={formData.version} onChange={handleChange} />
                    <Input name="releaseDate" type="date" label="Release Date" value={formData.releaseDate} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Changelog (one item per line)</label>
                    <textarea
                        name="changelog"
                        value={formData.changelog}
                        onChange={handleChange}
                        rows={6}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Added new feature X&#10;Fixed bug in Y"
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} isLoading={isLoading}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );
};

export default VersionEditor;
