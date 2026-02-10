
import React from 'react';
import { Modal, Button } from './commonComponents';
import type { Backup } from './types';

interface BackupPreviewModalProps {
    backup: Backup | null;
    onClose: () => void;
}

const BackupPreviewModal: React.FC<BackupPreviewModalProps> = ({ backup, onClose }) => {
    if (!backup) return null;

    let summary = { users: 0, courses: 0, orders: 0, exams: 0, posts: 0 };
    try {
        const data = JSON.parse(backup.data);
        summary = {
            users: data.mockUsers?.length || 0,
            courses: data.mockCourses?.length || 0,
            orders: data.mockOrders?.length || 0,
            exams: data.mockExams?.length || 0,
            posts: data.mockNewsPosts?.length || 0,
        };
    } catch (e) {
        return (
            <Modal isOpen={true} onClose={onClose} title="Backup Preview Error">
                <p className="text-red-400">Could not parse backup data. The file might be corrupted.</p>
                 <div className="flex justify-end mt-4"><Button variant="secondary" onClick={onClose}>Close</Button></div>
            </Modal>
        );
    }
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Preview of Backup: ${new Date(backup.timestamp).toLocaleString()}`}>
            <div className="space-y-4">
                <p className="text-slate-300">This backup contains the following data snapshot:</p>
                <ul className="list-disc list-inside bg-slate-700/50 p-4 rounded-lg space-y-2">
                    <li><span className="font-semibold">{summary.users}</span> Users</li>
                    <li><span className="font-semibold">{summary.courses}</span> Courses</li>
                    <li><span className="font-semibold">{summary.orders}</span> Orders</li>
                    <li><span className="font-semibold">{summary.exams}</span> Exams</li>
                    <li><span className="font-semibold">{summary.posts}</span> News Posts</li>
                </ul>
                <p className="text-sm text-yellow-400">Note: Restoring will overwrite all current data with this snapshot.</p>
                <div className="flex justify-end mt-4">
                    <Button variant="secondary" onClick={onClose}>Close Preview</Button>
                </div>
            </div>
        </Modal>
    );
};

export default BackupPreviewModal;
