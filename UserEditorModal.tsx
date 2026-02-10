
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { User, UserStatus } from './types';
import { Role } from './types';
import { Modal, Button, Input, Badge } from './commonComponents';
import { NotificationType } from './types';
import StatusReasonModal from './StatusReasonModal';

interface UserEditorModalProps {
    user: User | null;
    onClose: () => void;
    onSave: () => void;
}

const getRoleColor = (role: Role): 'red' | 'purple' | 'sky' | 'slate' => ({ 'super_admin': 'red', 'admin': 'purple', 'instructor': 'sky', 'user': 'slate' }[role] as 'red' | 'purple' | 'sky' | 'slate');
const getStatusColor = (status: UserStatus): 'green' | 'yellow' | 'red' => ({ 'Active': 'green', 'Pending': 'yellow', 'Suspended': 'red', 'Banned': 'red' }[status] as 'green' | 'yellow' | 'red');

const UserInfoRow: React.FC<{ label: string; value?: string | number | Date | null }> = ({ label, value }) => {
    if (!value && value !== 0) return null;
    const displayValue = value instanceof Date ? value.toLocaleString() : value;
    return (
        <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-700/50">
            <dt className="text-sm font-medium text-slate-400">{label}</dt>
            <dd className="text-sm text-slate-200 col-span-2">{displayValue}</dd>
        </div>
    );
};


const UserEditorModal: React.FC<UserEditorModalProps> = ({ user, onClose, onSave }) => {
    const { user: adminUser, addNotification } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role>(Role.USER);
    const [selectedStatus, setSelectedStatus] = useState<UserStatus>('Pending');
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [statusToChange, setStatusToChange] = useState<'Suspended' | 'Banned' | null>(null);

    useEffect(() => {
        if (user) {
            setSelectedRole(user.role);
            setSelectedStatus(user.status);
        }
    }, [user]);

    if (!user) return null;

    const handleStatusChangeRequest = (newStatus: UserStatus) => {
        if(user.role === Role.SUPER_ADMIN) {
            addNotification("Super Admin status cannot be changed.", NotificationType.ERROR);
            return;
        }
        if (newStatus === 'Suspended' || newStatus === 'Banned') {
            setStatusToChange(newStatus);
            setIsReasonModalOpen(true);
        } else {
            updateStatus(newStatus);
        }
    };
    
    const updateStatus = async (status: UserStatus, reason?: string) => {
        if (!adminUser) return;
        setIsLoading(true);
        const res = await api.updateUserStatus(adminUser.id, user.id, status, reason);
        addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
        if (res.success) {
            setSelectedStatus(status);
            onSave();
        }
        setIsLoading(false);
        setIsReasonModalOpen(false);
    };

    const handleRoleChange = async () => {
        if (!adminUser) return;
        setIsLoading(true);
        const res = await api.updateUserRole(adminUser.id, user.id, selectedRole);
        addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
        if (res.success) onSave();
        setIsLoading(false);
    };
    
    const handleForceLogout = async () => {
        if (!adminUser) return;
        setIsLoading(true);
        const res = await api.forceLogoutUser(adminUser.id, user.id);
        addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
        if (res.success) onSave();
        setIsLoading(false);
    };
    
    const isSuperAdmin = user.role === Role.SUPER_ADMIN;

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title={`Manage User: ${user.username}`} size="lg">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <img src={user.avatarUrl} alt={user.username} className="w-16 h-16 rounded-full"/>
                        <div>
                            <p className="text-xl font-bold">{user.username}</p>
                            <p className="text-slate-400">{user.email}</p>
                            <div className="flex gap-2 mt-2">
                                <Badge color={getRoleColor(user.role)}>{user.role.toUpperCase()}</Badge>
                                <Badge color={getStatusColor(user.status)}>{user.status}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
                         <h3 className="text-lg font-semibold text-sky-400 border-b border-slate-600 pb-2">Admin Controls</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Change Role</label>
                            <div className="flex gap-2">
                                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as Role)} disabled={isSuperAdmin} className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50">
                                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <Button onClick={handleRoleChange} variant="secondary" isLoading={isLoading} disabled={selectedRole === user.role || isSuperAdmin}>Save Role</Button>
                            </div>
                            {isSuperAdmin && <p className="text-xs text-yellow-400 mt-1">Super Admin role cannot be changed.</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Change Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['Active', 'Pending', 'Suspended', 'Banned'] as UserStatus[]).map(status => (
                                    <Button key={status} variant={status === selectedStatus ? 'primary' : 'secondary'} onClick={() => handleStatusChangeRequest(status)} disabled={status === selectedStatus || isSuperAdmin}>
                                        Set as {status}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2 p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-slate-600 pb-2">Active Sessions</h3>
                        {user.activeSessions && user.activeSessions.length > 0 ? (
                            user.activeSessions.map(session => (
                                <div key={session.sessionId} className="text-xs bg-slate-800 p-2 rounded-md">
                                    <p><span className="font-semibold text-slate-300">IP:</span> {session.ipAddress}</p>
                                    <p><span className="font-semibold text-slate-300">Device:</span> {session.userAgent}</p>
                                    <p><span className="font-semibold text-slate-300">Logged In:</span> {new Date(session.loggedInAt).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400">No active sessions.</p>
                        )}
                        <Button onClick={handleForceLogout} variant="danger" size="sm" isLoading={isLoading} disabled={isSuperAdmin || !user.activeSessions || user.activeSessions.length === 0} className="mt-2">
                           Force Logout All Devices
                        </Button>
                    </div>

                     <div className="space-y-2 p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-slate-600 pb-2">User Information</h3>
                        <dl>
                           <UserInfoRow label="Phone Number" value={user.phone} />
                           <UserInfoRow label="Date of Birth" value={user.dob} />
                           <UserInfoRow label="Gender" value={user.gender} />
                           <UserInfoRow label="Class / Grade" value={user.grade} />
                           <UserInfoRow label="School" value={user.school} />
                           <UserInfoRow label="Medium" value={user.medium} />
                           <UserInfoRow label="Member Since" value={user.createdAt} />
                           <UserInfoRow label="Last Login" value={user.lastLoginAt} />
                           <UserInfoRow label="Agreement" value={`${user.agreementStatus} (v${user.agreedInstructionVersion || 'N/A'})`} />
                        </dl>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-700">
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                    </div>
                </div>
            </Modal>
            {isReasonModalOpen && statusToChange && (
                <StatusReasonModal
                    isOpen={isReasonModalOpen}
                    action={statusToChange}
                    onClose={() => setIsReasonModalOpen(false)}
                    onConfirm={(reason) => updateStatus(statusToChange, reason)}
                />
            )}
        </>
    );
};

export default UserEditorModal;
