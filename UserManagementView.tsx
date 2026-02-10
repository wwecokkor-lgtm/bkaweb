
import React, { useState, useMemo } from 'react';
import { Card, Button, Input, Badge } from './commonComponents';
import type { User, UserStatus } from './types';
import { Role } from './types';
import { useAppStore } from './store';
import { api } from './api';

const getRoleColor = (role: Role): 'red' | 'purple' | 'sky' | 'slate' => ({ 'super_admin': 'red', 'admin': 'purple', 'instructor': 'sky', 'user': 'slate' }[role] as 'red' | 'purple' | 'sky' | 'slate');
const getStatusColor = (status: UserStatus): 'green' | 'yellow' | 'red' => ({ 'Active': 'green', 'Pending': 'yellow', 'Suspended': 'red', 'Banned': 'red' }[status] as 'green' | 'yellow' | 'red');

interface UserManagementViewProps {
    users: User[];
    onEdit: (u: User) => void;
    onSave: () => void;
    setConfirmationAction: (action: any) => void;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ users, onEdit, onSave, setConfirmationAction }) => {
    const { user: adminUser } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');

    const handleSoftDelete = (user: User) => {
        if (!adminUser) return;
        setConfirmationAction({
            title: 'Move to Trash?',
            message: `Are you sure you want to move ${user.username} to trash? They will lose access to the site.`,
            actionType: 'warning',
            onConfirm: () => api.softDeleteUser(adminUser.id, user.id)
        });
    };

    const handleRestore = (user: User) => {
        if (!adminUser) return;
        api.restoreUser(adminUser.id, user.id).then(onSave);
    };
    
    const handlePermanentDelete = (user: User) => {
         if (!adminUser) return;
        setConfirmationAction({
            title: 'Delete Permanently?',
            message: `This action is irreversible. All data associated with ${user.username} will be lost.`,
            actionType: 'danger',
            onConfirm: () => api.permanentlyDeleteUser(adminUser.id, user.id)
        });
    };
    
    const filteredUsers = useMemo(() => {
        const sourceUsers = viewMode === 'active' ? users.filter(u => !u.deletedAt) : users.filter(u => u.deletedAt);
        return sourceUsers.filter(user =>
            (roleFilter === 'All' || user.role === roleFilter) &&
            (statusFilter === 'All' || user.status === statusFilter) &&
            (user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    }, [users, searchTerm, roleFilter, statusFilter, viewMode]);
    
    const isSuperAdmin = adminUser?.role === Role.SUPER_ADMIN;

    return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold">User Management</h2>
        <Card>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or email..." className="md:col-span-2" />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="All">All Roles</option>{Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}</select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="All">All Statuses</option><option>Active</option><option>Pending</option><option>Suspended</option><option>Banned</option></select>
            </div>
            <div className="flex border-b border-slate-700">
                <button onClick={() => setViewMode('active')} className={`px-4 py-2 text-sm font-medium ${viewMode === 'active' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400'}`}>Active Users</button>
                <button onClick={() => setViewMode('trash')} className={`px-4 py-2 text-sm font-medium ${viewMode === 'trash' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400'}`}>Trash</button>
            </div>
        </Card>
        <Card className="overflow-x-auto">
            <table className="w-full text-left">
                <thead><tr className="border-b border-slate-700"><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Last Login/Deleted At</th><th className="p-3">Actions</th></tr></thead>
                <tbody>{filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                        <td className="p-3"><div className="flex items-center gap-3"><img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-full"/><div><p className="font-semibold">{user.username}</p><p className="text-xs text-slate-400">{isSuperAdmin ? user.email : user.email.replace(/(?<=.).*?(?=@)/, '***')}</p></div></div></td>
                        <td className="p-3"><Badge color={getRoleColor(user.role)}>{user.role.replace('_', ' ').toUpperCase()}</Badge></td>
                        <td className="p-3"><Badge color={getStatusColor(user.status)}>{user.status}</Badge></td>
                        <td className="p-3 text-sm text-slate-400">{user.deletedAt ? new Date(user.deletedAt).toLocaleString() : (user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never')}</td>
                        <td className="p-3 space-x-2">
                             {viewMode === 'trash' ? (
                                <>
                                    <Button onClick={() => handleRestore(user)} size="sm" variant="secondary">Restore</Button>
                                    <Button onClick={() => handlePermanentDelete(user)} size="sm" variant="danger">Delete Forever</Button>
                                </>
                             ) : (
                                 <>
                                    <Button onClick={() => onEdit(user)} size="sm" variant="secondary">Manage</Button>
                                    <Button onClick={() => handleSoftDelete(user)} size="sm" variant="danger">Trash</Button>
                                 </>
                             )}
                        </td>
                    </tr>
                ))}</tbody>
            </table>
        </Card>
    </div>
    );
};

export default UserManagementView;
