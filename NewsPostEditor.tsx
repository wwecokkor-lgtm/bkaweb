
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { NewsPost, Media, YouTubeVideo, User } from './types';
import { PostCategory } from './types';
import { Modal, Button, Input, ToggleSwitch } from './commonComponents';
import { NotificationType } from './types';
import MediaSelector from './MediaSelector';
import VersionHistoryModal from './VersionHistoryModal';

interface NewsPostEditorProps {
    post: NewsPost | null;
    onClose: () => void;
    onSave: () => void;
}

const generateSlug = (title: string) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

const NewsPostEditor: React.FC<NewsPostEditorProps> = ({ post, onClose, onSave }) => {
    const { user, addNotification, showConfirmation } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<NewsPost>>({
        title: '', subtitle: '', slug: '', shortDescription: '', longDescription: '', category: PostCategory.GENERAL,
        tags: [], status: 'Draft', isPinned: false, isFeatured: false, isBreaking: false, priority: 'Normal',
        attachments: [], readTime: 1, history: []
    });
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

    const DRAFT_KEY = `newspost-draft-${post?.id || 'new'}`;

    useEffect(() => { if (post) setFormData(post); }, [post]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.title || formData.longDescription) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [formData, DRAFT_KEY]);

    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft && !post) { // Only restore for new posts
            try {
                const draftData = JSON.parse(savedDraft);
                if (draftData.title || draftData.longDescription) {
                    showConfirmation({
                        title: "Unsaved Draft Found",
                        message: "Do you want to restore your unsaved changes?",
                        actionType: 'warning',
                        confirmText: "Restore Draft",
                        cancelText: "Discard",
                        onConfirm: () => setFormData(draftData),
                        onCancel: () => localStorage.removeItem(DRAFT_KEY)
                    });
                }
            } catch (e) { console.error("Could not parse draft", e); }
        }
    }, [DRAFT_KEY, post, showConfirmation]);
    
    const cleanupAndClose = () => {
        if (!post) localStorage.removeItem(DRAFT_KEY); // Remove draft only for new posts on close
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'title') {
            setFormData(prev => ({ ...prev, title: value, slug: generateSlug(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleToggle = (name: keyof NewsPost, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleMediaSelect = (selectedMedia: Media[]) => {
        setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...selectedMedia] }));
        setIsMediaSelectorOpen(false);
    };

    const handleAddYoutubeVideo = async () => {
        if (!youtubeUrl) return;
        const res = await api.getYouTubeVideoDetails(youtubeUrl);
        if (res.success && res.video) {
            setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), res.video!] }));
            setYoutubeUrl('');
            addNotification('YouTube video added!', NotificationType.SUCCESS);
        } else {
            addNotification(res.message, NotificationType.ERROR);
        }
    };
    
    const removeAttachment = (id: string) => {
        setFormData(prev => ({ ...prev, attachments: prev.attachments?.filter(att => att.id !== id) }));
    };

    const handleRestoreVersion = (content: any) => {
        setFormData(prev => ({ ...prev, ...content }));
        setIsVersionHistoryOpen(false);
        addNotification('Content restored from a previous version.', NotificationType.INFO);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        const dataToSave: Partial<NewsPost> = {
            ...formData,
            readTime: Number(formData.readTime),
            tags: typeof formData.tags === 'string' ? (formData.tags as string).split(',').map(t => t.trim()).filter(Boolean) : formData.tags,
        };

        const response = post?.id
            ? await api.updateNewsPost(user.id, post.id, { ...dataToSave, authorId: user.id })
            : await api.createNewsPost(user.id, { ...dataToSave, authorId: user.id } as Omit<NewsPost, 'id' | 'createdAt' | 'slug' | 'viewCount' | 'comments' | 'likes'>);
        
        setIsLoading(false);
        if (response.success) {
            addNotification(response.message, NotificationType.SUCCESS);
            localStorage.removeItem(DRAFT_KEY);
            onSave();
        } else {
            addNotification(response.message, NotificationType.ERROR);
        }
    };

    return (
        <>
            <Modal isOpen={true} onClose={cleanupAndClose} title={post ? 'Edit Post' : 'Create New Post'} size="2xl">
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 md:col-span-2 space-y-4">
                        <Input name="title" label="Title" value={formData.title} onChange={handleChange} required />
                        <Input name="subtitle" label="Subtitle (Optional)" value={formData.subtitle} onChange={handleChange} />
                        <Input name="slug" label="SEO Slug" value={formData.slug} onChange={handleChange} required />
                        <div><label className="block text-sm font-medium text-slate-300 mb-1">Short Description</label><textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea></div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1">Full Content (Markdown supported)</label><textarea name="longDescription" value={formData.longDescription} onChange={handleChange} rows={10} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea></div>
                    </div>

                    <div className="col-span-3 md:col-span-1 space-y-4">
                        <div className="p-4 bg-slate-700/50 rounded-lg space-y-4">
                             <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-sky-400">Publishing</h3>
                                {formData.history && formData.history.length > 0 && (
                                    <Button size="sm" variant="secondary" onClick={() => setIsVersionHistoryOpen(true)}>History</Button>
                                )}
                            </div>
                            <div><label className="block text-sm font-medium text-slate-300 mb-1">Status</label><select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="Draft">Draft</option><option value="Published">Published</option><option value="Scheduled">Scheduled</option><option value="Archived">Archived</option></select></div>
                            {formData.status === 'Scheduled' && <Input name="scheduledAt" type="datetime-local" label="Schedule Date" value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''} onChange={handleChange} />}
                            <Input name="expiresAt" type="datetime-local" label="Expire Date (Optional)" value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ''} onChange={handleChange} />
                        </div>
                         <div className="p-4 bg-slate-700/50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-sky-400">Attributes</h3>
                            <ToggleSwitch label="Pin this post" checked={!!formData.isPinned} onChange={(c) => handleToggle('isPinned', c)} />
                            <ToggleSwitch label="Featured post" checked={!!formData.isFeatured} onChange={(c) => handleToggle('isFeatured', c)} />
                            <ToggleSwitch label="Breaking news" checked={!!formData.isBreaking} onChange={(c) => handleToggle('isBreaking', c)} />
                             <div><label className="block text-sm font-medium text-slate-300 mb-1">Priority</label><select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-200"><option value="Normal">Normal</option><option value="Top">Top</option></select></div>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-sky-400">Metadata</h3>
                            <div><label className="block text-sm font-medium text-slate-300 mb-1">Category</label><select name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-200">{Object.values(PostCategory).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <Input name="tags" label="Tags (comma-separated)" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags} onChange={handleChange} />
                            <Input name="readTime" type="number" label="Read Time (minutes)" value={formData.readTime} onChange={handleChange} />
                        </div>
                    </div>
                    
                    <div className="col-span-3 space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-slate-600 pb-2">Attachments</h3>
                        <div className="flex gap-2">
                            <Input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube URL..." /><Button variant="secondary" onClick={handleAddYoutubeVideo}>Add Video</Button>
                        </div>
                        <Button variant="secondary" onClick={() => setIsMediaSelectorOpen(true)} className="w-full">Add Media from Library</Button>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {formData.attachments?.map(att => (
                                <div key={att.id} className="relative group bg-slate-700 rounded-md overflow-hidden">
                                    {'type' in att && att.type === 'youtube' ? <img src={att.thumbnailUrl} alt={att.title} className="w-full h-20 object-cover" /> : ('type' in att && att.type === 'image' ? <img src={att.url} alt={att.caption} className="w-full h-20 object-cover" /> : <div className="w-full h-20 flex items-center justify-center text-sky-400">PDF</div>)}
                                    <button onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-3 flex justify-end gap-4 pt-4 border-t border-slate-700">
                        <Button variant="secondary" onClick={cleanupAndClose}>Cancel</Button>
                        <Button onClick={handleSubmit} isLoading={isLoading}>Save Post</Button>
                    </div>
                </div>
            </Modal>
            {isMediaSelectorOpen && <MediaSelector isOpen={isMediaSelectorOpen} onClose={() => setIsMediaSelectorOpen(false)} onSelect={handleMediaSelect} />}
            {isVersionHistoryOpen && <VersionHistoryModal history={formData.history || []} onClose={() => setIsVersionHistoryOpen(false)} onRestore={handleRestoreVersion} users={[]} />}
        </>
    );
};
export default NewsPostEditor;
