
import React, { useState } from 'react';
import { Card, Button, Badge } from './commonComponents';
import type { Order, User } from './types';

const getOrderStatusColor = (status: Order['status']): 'green' | 'yellow' | 'red' => ({ 'Completed': 'green', 'Pending': 'yellow', 'Failed': 'red', 'Rejected': 'red' }[status] as 'green' | 'yellow' | 'red');

interface PaymentVerificationViewProps {
    orders: Order[];
    users: User[];
    onApprove: (orderId: string) => void;
    onReject: (orderId: string) => void;
}

const PaymentVerificationView: React.FC<PaymentVerificationViewProps> = ({ orders, users, onApprove, onReject }) => {
    const [tab, setTab] = useState<'Pending' | 'Completed' | 'Rejected'>('Pending');
    const getUserById = (id: string) => users.find(u => u.id === id);
    const filteredOrders = orders.filter(o => o.status === tab);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Payment Verification</h2>
            </div>
            <div className="flex border-b border-slate-700">
                <button onClick={() => setTab('Pending')} className={`px-4 py-2 text-sm font-medium ${tab === 'Pending' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400'}`}>Pending</button>
                <button onClick={() => setTab('Completed')} className={`px-4 py-2 text-sm font-medium ${tab === 'Completed' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400'}`}>Completed</button>
                <button onClick={() => setTab('Rejected')} className={`px-4 py-2 text-sm font-medium ${tab === 'Rejected' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400'}`}>Rejected</button>
            </div>
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="p-3">User</th>
                            <th className="p-3">Course</th>
                            <th className="p-3">Info</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Date</th>
                            {tab === 'Pending' && <th className="p-3">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => {
                            const user = getUserById(order.userId);
                            return (
                                <tr key={order.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                    <td className="p-3">{user?.username || 'Unknown'}</td>
                                    <td className="p-3">{order.courseTitle}</td>
                                    <td className="p-3">
                                        <p className="font-mono text-xs">TrxID: {order.transactionId}</p>
                                        <p>Amount: ৳{order.finalAmount}</p>
                                        {order.screenshotUrl && <a href={order.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline text-sm">View Screenshot</a>}
                                    </td>
                                    <td className="p-3"><Badge color={getOrderStatusColor(order.status)}>{order.status}</Badge></td>
                                    <td className="p-3 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    {tab === 'Pending' && (
                                        <td className="p-3 space-x-2">
                                            <Button onClick={() => onApprove(order.id)} size="sm">Approve</Button>
                                            <Button onClick={() => onReject(order.id)} size="sm" variant="danger">Reject</Button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default PaymentVerificationView;
