
import React, { useState } from 'react';
import { Modal, Button } from './commonComponents';

interface RejectionReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reason for Rejection">
            <div className="space-y-4">
                <p className="text-slate-300">Please provide a brief reason for rejecting this payment. This will be shown to the student.</p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g., Transaction ID did not match."
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" onClick={handleConfirm} disabled={!reason.trim()}>Confirm Rejection</Button>
                </div>
            </div>
        </Modal>
    );
};

export default RejectionReasonModal;
