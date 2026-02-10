
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { PaymentMethod } from './types';
import { Modal, Button, Input, Spinner } from './commonComponents';
import { NotificationType } from './types';

interface PaymentMethodEditorProps {
    method: PaymentMethod | null;
    onClose: () => void;
    onSave: () => void;
}

const PaymentMethodEditor: React.FC<PaymentMethodEditorProps> = ({ method, onClose, onSave }) => {
    const { user, addNotification } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<PaymentMethod>>({
        name: '',
        type: 'Manual',
        status: 'Active',
        iconUrl: '',
        accountNumber: '',
        credentials: ''
    });

    useEffect(() => {
        if (method) {
            setFormData(method);
        }
    }, [method]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!user || !formData.name || !formData.type) return;
        setIsLoading(true);
        
        const response = method?.id
            ? await api.updatePaymentMethod(user.id, method.id, formData)
            : await api.createPaymentMethod(user.id, formData as Omit<PaymentMethod, 'id'>);

        setIsLoading(false);
        if (response.success) {
            addNotification(response.message, NotificationType.SUCCESS);
            onSave();
        } else {
            addNotification(response.message, NotificationType.ERROR);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={method ? 'Edit Payment Method' : 'Create New Payment Method'}>
            <div className="space-y-4">
                <Input name="name" label="Method Name" value={formData.name} onChange={handleChange} placeholder="e.g., bKash" required />
                <Input name="iconUrl" label="Icon URL" value={formData.iconUrl} onChange={handleChange} placeholder="https://example.com/icon.png" />
                
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Method Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="Manual">Manual (bKash, Nagad, etc.)</option>
                        <option value="Gateway">Gateway (Card, etc.)</option>
                    </select>
                </div>

                {formData.type === 'Manual' && (
                    <Input name="accountNumber" label="Account Number" value={formData.accountNumber} onChange={handleChange} placeholder="e.g., 01700000000" />
                )}

                {formData.type === 'Gateway' && (
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">API Credentials</label>
                        <textarea name="credentials" value={formData.credentials} onChange={handleChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Enter API keys or other info here"></textarea>
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} isLoading={isLoading}>Save Method</Button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentMethodEditor;
