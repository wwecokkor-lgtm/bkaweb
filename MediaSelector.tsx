
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Media } from './types';
import { Modal, Button, Spinner } from './commonComponents';

interface MediaSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (media: Media[]) => void;
}

const MediaSelector: React.FC<MediaSelectorProps> = ({ isOpen, onClose, onSelect }) => {
    const [mediaItems, setMediaItems] = useState<Media[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            api.getMedia().then(data => {
                setMediaItems(data);
                setIsLoading(false);
            });
        }
    }, [isOpen]);
    
    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };

    const handleConfirm = () => {
        const selectedItems = mediaItems.filter(item => selectedIds.has(item.id));
        onSelect(selectedItems);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Media from Library">
            <div className="space-y-4">
                {isLoading ? <div className="flex justify-center h-64 items-center"><Spinner/></div> : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                        {mediaItems.map(item => (
                            <button key={item.id} onClick={() => toggleSelection(item.id)} className={`relative border-2 rounded-lg overflow-hidden focus:outline-none ${selectedIds.has(item.id) ? 'border-sky-500' : 'border-transparent'}`}>
                                {item.type === 'image' ? <img src={item.url} alt={item.caption} className="w-full h-24 object-cover" /> : <div className="w-full h-24 bg-slate-700 flex items-center justify-center text-sky-400 font-bold">PDF</div>}
                                {selectedIds.has(item.id) && <div className="absolute inset-0 bg-sky-500/50 flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>}
                            </button>
                        ))}
                    </div>
                )}
                 {mediaItems.length === 0 && !isLoading && <p className="text-center text-slate-400 py-8">Your media library is empty. Please upload some files first.</p>}
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
                        Confirm Selection ({selectedIds.size})
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default MediaSelector;
