import React, { useState } from 'react';
import { Modal, Button } from './commonComponents';

interface StatusReasonModalProps {
    isOpen: boolean;
    // FIX: Updated prop to match UserStatus enum values for better type safety.
    action: 'Suspended' | 'Banned';
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const StatusReasonModal: React.FC<StatusReasonModalProps> = ({ isOpen, action, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason);
        }
    };

    // FIX: Convert status to a verb for display purposes to ensure grammatical correctness.
    const verb = action === 'Suspended' ? 'Suspend' : 'Ban';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reason to ${verb} User`}>
            <div className="space-y-4">
                <p className="text-slate-300">Please provide a brief reason for this action. This may be shown to the user.</p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={`e.g., Violation of terms of service.`}
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" onClick={handleConfirm} disabled={!reason.trim()}>Confirm {verb}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default StatusReasonModal;