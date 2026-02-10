
import React, { useState } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { InstructionContent, User } from './types';
import { Modal, Button, Input } from './commonComponents';
import { NotificationType } from './types';
import VersionHistoryModal from './VersionHistoryModal';

interface InstructionEditorProps {
    instructionContent: InstructionContent;
    users: User[];
    onClose: () => void;
    onSave: () => void;
}

const InstructionEditor: React.FC<InstructionEditorProps> = ({ instructionContent, users, onClose, onSave }) => {
    const { user, addNotification } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        version: instructionContent.version,
        title: instructionContent.title,
        content: instructionContent.content,
    });
    const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRestoreVersion = (content: any) => {
        setFormData(prev => ({...prev, ...content}));
        setIsVersionHistoryOpen(false);
        addNotification('Content restored from a previous version.', NotificationType.INFO);
    };
    
    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        const updatedContent: Omit<InstructionContent, 'lastUpdatedAt'> = {
            ...formData,
        };
        const res = await api.updateInstructionContent(user.id, updatedContent);
        addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
        if (res.success) {
            onSave();
        }
        setIsLoading(false);
    };

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title="Edit Instruction Content" size="lg">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Content</h3>
                         {instructionContent.history && instructionContent.history.length > 0 && (
                            <Button size="sm" variant="secondary" onClick={() => setIsVersionHistoryOpen(true)}>History</Button>
                        )}
                    </div>
                    <Input name="title" label="Instruction Title" value={formData.title} onChange={handleChange} />
                    <Input name="version" label="Instruction Version (e.g., 1.1)" value={formData.version} onChange={handleChange} />
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Content / Description</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={8}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="Write the instructions for users here..."
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSubmit} isLoading={isLoading}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
             {isVersionHistoryOpen && instructionContent.history && (
                <VersionHistoryModal 
                    history={instructionContent.history} 
                    onClose={() => setIsVersionHistoryOpen(false)} 
                    onRestore={handleRestoreVersion} 
                    users={users} 
                />
             )}
        </>
    );
};

export default InstructionEditor;
