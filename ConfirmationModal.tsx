
import React from 'react';
import { Modal, Button } from './commonComponents';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    actionType: 'danger' | 'warning';
    confirmText?: string;
    cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, actionType, confirmText, cancelText }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-slate-300">{message}</p>
                <div className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>
                        {cancelText || 'Cancel'}
                    </Button>
                    <Button variant={actionType === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
                        {confirmText || (actionType === 'danger' ? 'Confirm Delete' : 'Confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
