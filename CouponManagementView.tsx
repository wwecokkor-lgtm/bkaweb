
import React from 'react';
import { Card, Button, Badge } from './commonComponents';
import type { Coupon } from './types';
import { useAppStore } from './store';
import { api } from './api';

interface CouponManagementViewProps {
    coupons: Coupon[];
    onAdd: () => void;
    onEdit: (c: Coupon) => void;
    onSave: () => void;
}

const CouponManagementView: React.FC<CouponManagementViewProps> = ({ coupons, onAdd, onEdit, onSave }) => {
    const { user, showConfirmation } = useAppStore();

    const handleDelete = (coupon: Coupon) => {
        if (!user) return;
        showConfirmation({
            title: `Delete Coupon "${coupon.code}"?`,
            message: 'This action is irreversible and might affect users who have this code.',
            actionType: 'danger',
            onConfirm: async () => {
                const res = await api.deleteCoupon(user.id, coupon.id);
                if (res.success) onSave();
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Coupon Management</h2>
                <Button onClick={onAdd}>Add New Coupon</Button>
            </div>
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="p-3">Code</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Value</th>
                            <th className="p-3">Usage</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Expires</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map(coupon => (
                            <tr key={coupon.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                <td className="p-3 font-mono font-semibold text-sky-400">{coupon.code}</td>
                                <td className="p-3">{coupon.discountType}</td>
                                <td className="p-3 font-semibold">{coupon.discountType === 'Fixed' ? `৳${coupon.discountValue}` : `${coupon.discountValue}%`}</td>
                                <td className="p-3">{coupon.timesUsed} / {coupon.usageLimit === 0 ? '∞' : coupon.usageLimit}</td>
                                <td className="p-3"><Badge color={coupon.isActive ? 'green' : 'slate'}>{coupon.isActive ? 'Active' : 'Inactive'}</Badge></td>
                                <td className="p-3 text-sm text-slate-400">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}</td>
                                <td className="p-3 space-x-2">
                                    <Button onClick={() => onEdit(coupon)} size="sm" variant="secondary">Edit</Button>
                                    <Button onClick={() => handleDelete(coupon)} size="sm" variant="danger">Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {coupons.length === 0 && <p className="text-center p-8 text-slate-400">No coupons created yet.</p>}
            </Card>
        </div>
    );
};

export default CouponManagementView;
