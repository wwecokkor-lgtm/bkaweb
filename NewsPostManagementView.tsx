
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Badge } from './commonComponents';
import type { NewsPost } from './types';
import { api } from './api';

type PostStatusTab = 'Published' | 'Draft' | 'Scheduled' | 'Archived' | 'Trash';

interface NewsPostManagementViewProps {
    onEdit: (p: NewsPost) => void;
    onTrash: (p: NewsPost) => void;
    onDelete: (p: NewsPost) => void;
    onRestore: (p: NewsPost) => void;
    onAdd: () => void;
}

const NewsPostManagementView: React.FC<NewsPostManagementViewProps> = ({ onEdit, onTrash, onDelete, onRestore, onAdd }) => {
    const [tab, setTab] = useState<PostStatusTab>('Published');
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const fetchPosts = async () => {
            if (tab === 'Trash') {
                const trashedPosts = await api.getTrashedNewsPosts();
                setPosts(trashedPosts);
            } else {
                const data = await api.getNewsPosts({ status: tab, limit: 100 });
                setPosts(data.posts);
            }
            setIsLoading(false);
        };
        fetchPosts();
    }, [tab]);
    
    const tabs: PostStatusTab[] = ['Published', 'Draft', 'Scheduled', 'Archived', 'Trash'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">News & Posts</h2>
                <Button onClick={onAdd}>Add New Post</Button>
            </div>
            <div className="flex border-b border-slate-700">
                {tabs.map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400'}`}>{t}</button>
                ))}
            </div>
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="p-3">Title</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Attributes</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center p-8">Loading...</td></tr>
                        ) : posts.length > 0 ? posts.map(post => (
                            <tr key={post.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                <td className="p-3">{post.title}</td>
                                <td className="p-3"><Badge color="sky">{post.category}</Badge></td>
                                <td className="p-3 space-x-1">
                                    {post.isPinned && <Badge color="yellow">Pinned</Badge>}
                                    {post.isFeatured && <Badge color="purple">Featured</Badge>}
                                    {post.isBreaking && <Badge color="red">Breaking</Badge>}
                                </td>
                                <td className="p-3 text-sm text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                                <td className="p-3 space-x-2">
                                    {tab === 'Trash' ? (
                                        <>
                                            <Button onClick={() => onRestore(post)} size="sm" variant="secondary">Restore</Button>
                                            <Button onClick={() => onDelete(post)} size="sm" variant="danger">Delete Forever</Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button onClick={() => onEdit(post)} size="sm" variant="secondary">Edit</Button>
                                            <Button onClick={() => onTrash(post)} size="sm" variant="danger">Trash</Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )) : (
                             <tr><td colSpan={5} className="text-center text-slate-400 p-8">No posts found in this category.</td></tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default NewsPostManagementView;
