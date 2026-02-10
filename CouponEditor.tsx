
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Coupon } from './types';
import { Modal, Button, Input, ToggleSwitch } from './commonComponents';
import { NotificationType } from './types';

interface CouponEditorProps {
    coupon: Coupon | null;
    onClose: () => void;
    onSave: () => void;
}

const CouponEditor: React.FC<CouponEditorProps> = ({ coupon, onClose, onSave }) => {
    const { user, addNotification } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Coupon>>({
        code: '',
        discountType: 'Fixed',
        discountValue: 100,
        isActive: true,
        usageLimit: 0,
    });

    useEffect(() => {
        if (coupon) {
            setFormData({
                ...coupon,
                expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] as any : undefined
            });
        } else {
            // Generate a random code for new coupons
            setFormData(prev => ({ ...prev, code: `BK${Math.random().toString(36).substring(2, 8).toUpperCase()}`}));
        }
    }, [coupon]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleToggle = (checked: boolean) => {
        setFormData(prev => ({ ...prev, isActive: checked }));
    };

    const handleSubmit = async () => {
        if (!user || !formData.code || !formData.discountValue) {
            addNotification('Code and discount value are required.', NotificationType.ERROR);
            return;
        }
        setIsLoading(true);

        const dataToSave = {
            ...formData,
            expiresAt: formData.expiresAt ? new Date(formData.expiresAt as any) : undefined,
        };

        const response = coupon?.id
            ? await api.updateCoupon(user.id, coupon.id, dataToSave)
            : await api.createCoupon(user.id, dataToSave as Omit<Coupon, 'id' | 'createdAt' | 'timesUsed'>);

        setIsLoading(false);
        if (response.success) {
            addNotification(response.message, NotificationType.SUCCESS);
            onSave();
        } else {
            addNotification(response.message, NotificationType.ERROR);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={coupon ? 'Edit Coupon' : 'Create New Coupon'}>
            <div className="space-y-4">
                <Input name="code" label="Coupon Code" value={formData.code} onChange={handleChange} required />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Discount Type</label>
                        <select name="discountType" value={formData.discountType} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200">
                            <option value="Fixed">Fixed Amount (৳)</option>
                            <option value="Percentage">Percentage (%)</option>
                        </select>
                    </div>
                    <Input name="discountValue" label="Value" type="number" value={formData.discountValue} onChange={handleChange} required />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <Input name="usageLimit" label="Usage Limit (0 for unlimited)" type="number" value={formData.usageLimit} onChange={handleChange} />
                     <Input name="expiresAt" label="Expires At (Optional)" type="date" value={formData.expiresAt as any} onChange={handleChange} />
                </div>
                <ToggleSwitch label="Is Active" checked={!!formData.isActive} onChange={handleToggle} />

                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} isLoading={isLoading}>Save Coupon</Button>
                </div>
            </div>
        </Modal>
    );
};

export default CouponEditor;
