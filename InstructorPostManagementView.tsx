
import React from 'react';
import { Card, Button, Badge } from './commonComponents';
import type { InstructorPost, User } from './types';
import { useAppStore } from './store';
import { api } from './api';

interface InstructorPostManagementViewProps {
    posts: InstructorPost[];
    users: User[];
    onUpdate: () => void;
}

const InstructorPostManagementView: React.FC<InstructorPostManagementViewProps> = ({ posts, users, onUpdate }) => {
    const { user, showConfirmation } = useAppStore();

    const getAuthorName = (authorId: string) => users.find(u => u.id === authorId)?.username || 'Unknown';

    const handleStatusUpdate = async (postId: string, status: 'Published' | 'Draft') => {
        if (!user) return;
        const res = await api.updateInstructorPostStatus(user.id, postId, status);
        if (res.success) onUpdate();
    };

    const handleDelete = (post: InstructorPost) => {
        if (!user) return;
        showConfirmation({
            title: 'Delete Post Permanently?',
            message: `Are you sure you want to delete the post "${post.title}"? This is irreversible.`,
            actionType: 'danger',
            onConfirm: async () => {
                const res = await api.deleteInstructorPost(user.id, post.id);
                if (res.success) onUpdate();
            },
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Instructor Post Management</h2>
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="p-3">Post Title</th>
                            <th className="p-3">Author</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map(post => (
                            <tr key={post.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                <td className="p-3 max-w-xs truncate">{post.title}</td>
                                <td className="p-3">{getAuthorName(post.authorId)}</td>
                                <td className="p-3"><Badge color={post.status === 'Published' ? 'green' : 'yellow'}>{post.status}</Badge></td>
                                <td className="p-3 text-sm text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                                <td className="p-3 space-x-2">
                                    {post.status === 'Draft' ? (
                                        <Button onClick={() => handleStatusUpdate(post.id, 'Published')} size="sm">Approve</Button>
                                    ) : (
                                        <Button onClick={() => handleStatusUpdate(post.id, 'Draft')} size="sm" variant="secondary">Unpublish</Button>
                                    )}
                                    <Button onClick={() => handleDelete(post)} size="sm" variant="danger">Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default InstructorPostManagementView;
