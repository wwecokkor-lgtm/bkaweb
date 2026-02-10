
import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { NewsPost, User, Comment } from './types';
import { Card, Button, Spinner, Input } from './commonComponents';
import { NotificationType } from './types';
import { linkify } from './linkify';

const NewsPostDetailPage: React.FC = () => {
    const { user, selectedNewsPostId, addNotification, setPage } = useAppStore();
    const [post, setPost] = useState<NewsPost | null>(null);
    const [author, setAuthor] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const DRAFT_KEY = useMemo(() => `comment-draft-news-${post?.id}`, [post]);

    useEffect(() => {
        if (post) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                setCommentText(savedDraft);
            }
        }
    }, [post, DRAFT_KEY]);

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setCommentText(newText);
        localStorage.setItem(DRAFT_KEY, newText);
    };

    const fetchPost = () => {
        if (selectedNewsPostId) {
            setIsLoading(true);
            Promise.all([
                api.getNewsPostById(selectedNewsPostId),
                api.getUsers()
            ]).then(([postData, allUsers]) => {
                if (postData) {
                    setPost(postData);
                    setAuthor(allUsers.find(u => u.id === postData.authorId) || null);
                }
                setIsLoading(false);
            });
        }
    };
    
    useEffect(() => {
        if (selectedNewsPostId) {
            api.incrementNewsPostView(selectedNewsPostId);
            fetchPost();
        }
    }, [selectedNewsPostId]);

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !user || !post) {
            addNotification('Please write a comment.', NotificationType.ERROR);
            return;
        }
        setIsSubmitting(true);
        const res = await api.addCommentToNewsPost(post.id, {
            userId: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            content: commentText
        });
        if (res.success && res.post) {
            setPost(res.post);
            setCommentText('');
            localStorage.removeItem(DRAFT_KEY);
            addNotification('Comment posted successfully!', NotificationType.SUCCESS);
        } else {
            addNotification(res.message, NotificationType.ERROR);
        }
        setIsSubmitting(false);
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    if (!post) return <div className="text-center text-red-400">Post not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Button variant="secondary" onClick={() => setPage('news')}>&larr; Back to News</Button>

            <Card className="p-8">
                <span className="text-sm font-semibold bg-sky-500/20 text-sky-400 px-2.5 py-1 rounded-full">{post.category}</span>
                <h1 className="text-4xl font-bold text-white mt-4">{post.title}</h1>
                <div className="flex items-center gap-4 text-slate-400 mt-4 border-b border-t border-slate-700 py-3">
                    {author && <img src={author.avatarUrl} alt={author.username} className="w-10 h-10 rounded-full" />}
                    <span>By {author?.username || 'Admin'}</span>
                    <span>&bull;</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span>{post.viewCount} views</span>
                </div>
                <div className="prose prose-invert prose-lg max-w-none mt-6 text-slate-300">
                    <p className="lead text-xl text-slate-300">{post.shortDescription}</p>
                    <div className="whitespace-pre-wrap">{linkify(post.longDescription)}</div>
                </div>
            </Card>

            {post.attachments.length > 0 && (
                <Card>
                    <h2 className="text-2xl font-bold mb-4">Attachments</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {post.attachments.map(att => (
                            <div key={att.id}>
                                {att.type === 'image' && <img src={att.url} alt={att.caption} className="rounded-lg w-full" />}
                                {att.type === 'youtube' && <iframe src={`https://www.youtube.com/embed/${att.url.split('v=')[1]}`} title={att.title} className="w-full aspect-video rounded-lg" allowFullScreen></iframe>}
                                {att.type === 'pdf' && <a href={att.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-sky-400">{att.caption}</a>}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Card>
                <h2 className="text-2xl font-bold mb-4">Comments ({post.comments.length})</h2>
                <div className="space-y-6">
                    {user && (
                        <div className="flex items-start gap-4">
                            <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full" />
                            <div className="flex-grow space-y-2">
                                <textarea value={commentText} onChange={handleCommentChange} placeholder="Write your comment..." rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
                                <Button onClick={handleCommentSubmit} isLoading={isSubmitting}>Post Comment</Button>
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        {post.comments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(comment => (
                            <div key={comment.id} className="flex items-start gap-4">
                                <img src={comment.avatarUrl} alt={comment.username} className="w-10 h-10 rounded-full" />
                                <div className="flex-grow bg-slate-700/50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-white">{comment.username}</p>
                                        <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
                                    </div>
                                    <p className="text-slate-300 mt-1 whitespace-pre-wrap">{linkify(comment.content)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

        </div>
    );
};

export default NewsPostDetailPage;
