
import React, { useState } from 'react';
import type { PostVersion, InstructionVersion, User } from './types';
import { Modal, Button } from './commonComponents';

type Version = PostVersion | InstructionVersion;

interface VersionHistoryModalProps {
    history: Version[];
    onClose: () => void;
    onRestore: (versionContent: any) => void;
    users: User[];
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ history, onClose, onRestore, users }) => {
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(history.length > 0 ? history[history.length - 1] : null);

    const getEditorName = (userId: string) => users.find(u => u.id === userId)?.username || 'Unknown Admin';
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Content Version History" size="2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ height: '60vh' }}>
                <div className="md:col-span-1 border-r border-slate-700 pr-4 overflow-y-auto">
                    <h3 className="font-semibold mb-2">Revisions</h3>
                    <ul className="space-y-2">
                        {[...history].reverse().map(v => (
                            <li key={v.version}>
                                <button
                                    onClick={() => setSelectedVersion(v)}
                                    className={`w-full text-left p-2 rounded-md ${selectedVersion?.version === v.version ? 'bg-sky-600/30' : 'hover:bg-slate-700/50'}`}
                                >
                                    <p className="font-semibold text-white">Version {v.version}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(v.editedAt).toLocaleString()} by {getEditorName(v.editedBy)}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="md:col-span-2 overflow-y-auto">
                    {selectedVersion ? (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Previewing Version {selectedVersion.version}</h3>
                            <div className="prose prose-sm prose-invert max-w-none bg-slate-900/50 p-4 rounded-md">
                                <h4>Title: {selectedVersion.content.title}</h4>
                                {'subtitle' in selectedVersion.content && typeof selectedVersion.content.subtitle === 'string' && <p><strong>Subtitle:</strong> {selectedVersion.content.subtitle}</p>}
                                {'shortDescription' in selectedVersion.content && typeof selectedVersion.content.shortDescription === 'string' && <p><strong>Short Desc:</strong> {selectedVersion.content.shortDescription}</p>}
                                <hr/>
                                <div dangerouslySetInnerHTML={{ __html: 'longDescription' in selectedVersion.content && typeof selectedVersion.content.longDescription === 'string' ? selectedVersion.content.longDescription : ('content' in selectedVersion.content ? selectedVersion.content.content : '') }}></div>
                            </div>
                            <Button onClick={() => onRestore(selectedVersion.content)}>Restore This Version</Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <p>Select a version from the left to preview it.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default VersionHistoryModal;
