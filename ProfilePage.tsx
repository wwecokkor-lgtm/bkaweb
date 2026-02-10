
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from './store';
import { Card, Button, Spinner } from './commonComponents';
import { api } from './api';
import { NotificationType } from './types';
import type { Order } from './types';

const ProfilePage: React.FC = () => {
    const { user, sessionId, updateUser, addNotification, showConfirmation, login } = useAppStore();
    const [isUploading, setIsUploading] = useState(false);
    const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);

    useEffect(() => {
        if (user) {
            api.getOrders().then(allOrders => {
                setOrders(allOrders.filter(o => o.userId === user.id));
                setIsLoadingOrders(false);
            });
        }
    }, [user]);

    const handleExportData = async () => {
        if (!user) return;
        const res = await api.exportUserData(user.id);
        if (res.success && res.data) {
            const blob = new Blob([res.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bk-academy-data-${user.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addNotification('Your data has been exported.', NotificationType.SUCCESS);
        } else {
            addNotification(res.message, NotificationType.ERROR);
        }
    };

    const handleLogoutOtherDevices = () => {
        if (!user || !sessionId) return;
        showConfirmation({
            title: "Logout From Other Devices?",
            message: "This will end all other active sessions. Your current session will remain.",
            actionType: 'warning',
            onConfirm: async () => {
                const res = await api.logoutFromOtherDevices(user.id, sessionId);
                if (res.success && res.user && res.sessionId) {
                    login({ user: res.user, sessionId: res.sessionId });
                    addNotification(res.message, NotificationType.SUCCESS);
                } else {
                    addNotification(res.message, NotificationType.ERROR);
                }
            }
        });
    };
    
    if (!user) return <div>Loading profile...</div>;

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) setNewAvatarPreview(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) { addNotification('Please select a file first.', NotificationType.ERROR); return; }
        setIsUploading(true);
        const response = await api.uploadPhoto(file);
        setIsUploading(false);
        if (response.success && response.url) {
            updateUser({ avatarUrl: response.url });
            setNewAvatarPreview(null);
            addNotification('Avatar updated successfully!', NotificationType.SUCCESS);
        } else {
            addNotification(response.message, NotificationType.ERROR);
        }
    };
    
    const getStatusColor = (status: Order['status']) => ({ 'Completed': 'bg-green-500/20 text-green-400', 'Pending': 'bg-yellow-500/20 text-yellow-400', 'Rejected': 'bg-red-500/20 text-red-400', 'Failed': 'bg-red-500/20 text-red-400' }[status]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex-shrink-0">
                            <img src={newAvatarPreview || user.avatarUrl} alt="User avatar" className="w-40 h-40 rounded-full object-cover border-4 border-slate-700" />
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                            <div className="mt-4 flex gap-2">
                                {newAvatarPreview ? ( <> <Button onClick={handleUpload} isLoading={isUploading} size="sm">Save</Button> <Button onClick={() => setNewAvatarPreview(null)} variant="secondary" size="sm">Cancel</Button> </> ) : ( <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full">Change Photo</Button> )}
                            </div>
                        </div>
                        <div className="flex-grow text-center">
                            <h2 className="text-3xl font-bold text-white">{user.username}</h2>
                            <p className="text-lg text-slate-400 mt-1">{user.email}</p>
                            <p className="text-sm text-slate-500 mt-2">Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
                            <span className="mt-4 inline-block bg-sky-500/20 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase">{user.role}</span>
                        </div>
                    </div>
                </Card>
                <Card>
                    <h2 className="text-2xl font-bold mb-4">My Coins</h2>
                    <div className="text-center">
                        <p className="text-5xl font-bold text-yellow-400">{user.coins || 0}</p>
                        <p className="text-slate-400">Coins Available</p>
                    </div>
                     <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
                        <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                        {user.coinTransactions?.length > 0 ? [...user.coinTransactions].reverse().map(tx => (
                            <div key={tx.id} className="flex justify-between text-sm p-2 bg-slate-700/50 rounded-md">
                                <div>
                                    <p className={tx.type === 'Earned' ? 'text-green-400' : 'text-red-400'}>{tx.type}: {tx.amount} coins</p>
                                    <p className="text-xs text-slate-500">{tx.description}</p>
                                </div>
                                <p className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleDateString()}</p>
                            </div>
                        )) : <p className="text-sm text-slate-400 text-center py-4">No transactions yet.</p>}
                     </div>
                </Card>
                 <Card>
                    <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
                     <div className="space-y-3">
                         <Button variant="secondary" className="w-full" onClick={handleExportData}>Export My Data</Button>
                         <Button variant="secondary" className="w-full" onClick={handleLogoutOtherDevices}>Logout From Other Devices</Button>
                         <Button variant="danger" className="w-full" onClick={() => addNotification('Account deletion request sent. Admin will review it.', NotificationType.INFO)}>Request Account Deletion</Button>
                     </div>
                </Card>
            </div>
            
            <div className="lg:col-span-2">
                <Card>
                    <h2 className="text-2xl font-bold mb-4">My Orders</h2>
                    {isLoadingOrders ? <Spinner /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead><tr className="border-b border-slate-700"><th className="p-3">Course</th><th className="p-3">Amount</th><th className="p-3">Date</th><th className="p-3">Status</th></tr></thead>
                                <tbody>
                                    {orders.length > 0 ? orders.map(order => (
                                        <tr key={order.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                            <td className="p-3">{order.courseTitle}{order.status === 'Rejected' && <span className="block text-xs text-red-400">Reason: {order.rejectionReason}</span>}</td>
                                            <td className="p-3">{order.paymentMethod === 'Coins' ? `${order.finalAmount} Coins` : `৳${order.finalAmount}`}</td>
                                            <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>{order.status}</span></td>
                                        </tr>
                                    )) : <tr><td colSpan={4} className="p-3 text-center text-slate-400">You have no orders yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;
