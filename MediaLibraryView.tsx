
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from './commonComponents';
import type { Media, User } from './types';
import { api } from './api';
import { useAppStore } from './store';
import { NotificationType } from './types';

interface MediaLibraryViewProps {
    media: Media[];
    users: User[];
    onDelete: (m: Media) => void;
    onUpload: () => void;
    onUpdate: () => void;
}

const getStatusColor = (status: Media['status']): 'green' | 'yellow' | 'red' => {
    if (status === 'Approved') return 'green';
    if (status === 'Pending') return 'yellow';
    return 'red';
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({ media, users, onDelete, onUpload, onUpdate }) => {
    const [tab, setTab] = useState<'All' | 'Pending' | 'Approved'>('All');
    const { user, addNotification } = useAppStore();

    const filteredMedia = useMemo(() => {
        if (tab === 'All') return media;
        return media.filter(m => m.status === tab);
    }, [media, tab]);

    const handleStatusUpdate = async (mediaId: string, status: 'Approved' | 'Rejected') => {
        if (!user) return;
        const res = await api.updateMediaStatus(user.id, mediaId, status);
        addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
        if (res.success) {
            onUpdate();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Media Library</h2>
                <Button onClick={onUpload}>Upload Media</Button>
            </div>
             <div className="flex border-b border-slate-700">
                {(['All', 'Pending', 'Approved'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400'}`}>{t}</button>
                ))}
            </div>
            <Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredMedia.map(item => {
                        const uploader = users.find(u => u.id === item.uploadedByUserId);
                        return (
                            <div key={item.id} className="relative group border border-slate-700 rounded-lg overflow-hidden flex flex-col">
                                <div className="h-40 bg-slate-800 flex items-center justify-center">
                                    {item.type === 'image' ? (
                                        <img src={item.url} alt={item.caption} className="max-w-full max-h-full object-contain" loading="lazy" />
                                    ) : (
                                        <div className="text-sky-400 font-bold text-3xl">PDF</div>
                                    )}
                                </div>
                                <div className="p-3 bg-slate-800/50 flex-grow flex flex-col justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-white truncate" title={item.fileName}>{item.fileName}</p>
                                        <p className="text-xs text-slate-400">By: {uploader?.username || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{formatBytes(item.fileSize)}</p>
                                    </div>
                                    <div className="mt-2">
                                        <Badge color={getStatusColor(item.status)}>{item.status}</Badge>
                                    </div>
                                </div>
                                {item.status === 'Pending' && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" onClick={() => handleStatusUpdate(item.id, 'Approved')}>Approve</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(item.id, 'Rejected')}>Reject</Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {filteredMedia.length === 0 && <p className="text-center text-slate-400 py-8">No media found in this category.</p>}
            </Card>
        </div>
    );
}

export default MediaLibraryView;
