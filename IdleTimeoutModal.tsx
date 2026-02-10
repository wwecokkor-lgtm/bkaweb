
import React, { useState, useEffect } from 'react';
import { Modal, Button } from './commonComponents';

interface IdleTimeoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({ isOpen, onClose, onLogout }) => {
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        if (isOpen) {
            setCountdown(60);
            const interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        onLogout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isOpen, onLogout]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Are you still there?">
            <div className="space-y-4 text-center">
                <p className="text-slate-300">
                    You've been inactive for a while. For your security, you will be logged out automatically in
                </p>
                <p className="text-4xl font-bold text-sky-400">{countdown}</p>
                <p className="text-slate-300">
                    seconds.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Button variant="secondary" onClick={onLogout}>
                        Logout
                    </Button>
                    <Button onClick={onClose}>
                        Stay Logged In
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default IdleTimeoutModal;
