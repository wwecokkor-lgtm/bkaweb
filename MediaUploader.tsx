
import React, { useState, useCallback } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Media } from './types';
import { Modal, Button, Spinner } from './commonComponents';
import { NotificationType } from './types';

interface MediaUploaderProps {
    onClose: () => void;
    onSave: () => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onClose, onSave }) => {
    const { addNotification, user } = useAppStore();
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (selectedFiles: FileList | null) => {
        if (selectedFiles) {
            setFiles(prev => [...prev, ...Array.from(selectedFiles)]);
        }
    };

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const onDrop = (e: React.DragEvent) => { e.preventDefault(); handleFileChange(e.dataTransfer.files); };

    const handleSubmit = async () => {
        if (files.length === 0 || !user) {
            addNotification('Please select files to upload.', NotificationType.ERROR);
            return;
        }
        setIsUploading(true);
        // Simulate a more robust, chunked upload process
        const uploadPromises = files.map(file => api.uploadMedia(file, user.id));
        const results = await Promise.all(uploadPromises);
        
        setIsUploading(false);
        const successCount = results.filter(r => r.success).length;
        if (successCount > 0) {
            addNotification(`${successCount} file(s) uploaded successfully and are awaiting approval.`, NotificationType.SUCCESS);
            onSave();
        }
        results.filter(r => !r.success).forEach(r => addNotification(r.message, NotificationType.ERROR));
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Upload Media">
            <div className="space-y-4">
                <div onDragOver={onDragOver} onDrop={onDrop} className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-sky-500">
                    <input type="file" multiple onChange={e => handleFileChange(e.target.files)} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <p className="text-slate-400">Drag & drop files here, or click to select.</p>
                        <p className="text-xs text-slate-500 mt-1">No file size limit. All uploads require admin approval.</p>
                    </label>
                </div>
                {files.length > 0 && (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
                                <p className="text-sm text-slate-300 truncate">{file.name}</p>
                                <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} isLoading={isUploading} disabled={files.length === 0}>
                        Upload {files.length > 0 ? files.length : ''} File(s)
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
export default MediaUploader;
