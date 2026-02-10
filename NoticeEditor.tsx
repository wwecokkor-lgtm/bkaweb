
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Notice } from './types';
import { Modal, Button, Input } from './commonComponents';
import { NotificationType } from './types';

interface NoticeEditorProps {
    notice: Notice | null;
    onClose: () => void;
    onSave: () => void;
}

const NoticeEditor: React.FC<NoticeEditorProps> = ({ notice, onClose, onSave }) => {
    const { user, addNotification } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Notice>>({ title: '', content: '' });

    useEffect(() => {
        if (notice) {
            setFormData(notice);
        }
    }, [notice]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!user || !formData.title || !formData.content) return;
        setIsLoading(true);

        const response = notice?.id
            ? await api.updateNotice(user.id, notice.id, formData)
            : await api.createNotice(user.id, formData as Omit<Notice, 'id' | 'createdAt'>);

        setIsLoading(false);
        if (response.success) {
            addNotification(response.message, NotificationType.SUCCESS);
            onSave();
        } else {
            addNotification(response.message, NotificationType.ERROR);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={notice ? 'Edit Notice' : 'Create New Notice'}>
            <div className="space-y-4">
                <Input name="title" label="Title" value={formData.title} onChange={handleChange} required />
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
                    <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        rows={5}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    ></textarea>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} isLoading={isLoading}>Save Notice</Button>
                </div>
            </div>
        </Modal>
    );
};

export default NoticeEditor;
