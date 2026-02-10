
import React from 'react';
import { Card, Button, Badge } from './commonComponents';
import type { PaymentMethod } from './types';

interface PaymentMethodsViewProps {
    methods: PaymentMethod[];
    onEdit: (m: PaymentMethod) => void;
    onDelete: (m: PaymentMethod) => void;
    onAdd: () => void;
}

const PaymentMethodsView: React.FC<PaymentMethodsViewProps> = ({ methods, onEdit, onDelete, onAdd }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Payment Methods</h2>
            <Button onClick={onAdd}>Add New Method</Button>
        </div>
        <Card className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-700">
                        <th className="p-3">Method</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Account / Info</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {methods.map(method => (
                        <tr key={method.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                            <td className="p-3 flex items-center gap-3">
                                <img src={method.iconUrl} alt={method.name} className="w-9 h-9 object-contain"/>
                                {method.name}
                            </td>
                            <td>{method.type}</td>
                            <td className="p-3 font-mono text-sm">{method.type === 'Manual' ? method.accountNumber : 'Gateway'}</td>
                            <td className="p-3"><Badge color={method.status === 'Active' ? 'green' : 'slate'}>{method.status}</Badge></td>
                            <td className="p-3 space-x-2">
                                <Button onClick={() => onEdit(method)} size="sm" variant="secondary">Edit</Button>
                                <Button onClick={() => onDelete(method)} size="sm" variant="danger">Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    </div>
);

export default PaymentMethodsView;
