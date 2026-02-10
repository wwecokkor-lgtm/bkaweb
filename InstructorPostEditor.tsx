
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { InstructorPost, Course, Media, YouTubeVideo, PostVisibility } from './types';
import { Modal, Button, Input, ToggleSwitch } from './commonComponents';
import { NotificationType } from './types';

interface InstructorPostEditorProps {
    post: InstructorPost | null;
    allCourses: Course[];
    onClose: () => void;
    onSave: () => void;
}

const InstructorPostEditor: React.FC<InstructorPostEditorProps> = ({ post, allCourses, onClose, onSave }) => {
    const { user, addNotification, showConfirmation } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<InstructorPost>>({
        title: '', content: '', attachments: [], visibility: 'Public', status: 'Draft'
    });
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const DRAFT_KEY = `instructor-post-draft-${post?.id || 'new'}`;

    useEffect(() => { if (post) setFormData(post); }, [post]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if(formData.title || formData.content) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [formData, DRAFT_KEY]);

    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft && !post) {
            try {
                const draftData = JSON.parse(savedDraft);
                if (draftData.title || draftData.content) {
                    showConfirmation({
                        title: "Unsaved Draft Found",
                        message: "Do you want to restore your unsaved post?",
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
    
    const cleanupAndClose = () => { if(!post) localStorage.removeItem(DRAFT_KEY); onClose(); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0 || !user) return;
        setIsLoading(true);
        const uploadPromises = Array.from(files).map(file => api.uploadMedia(file, user.id));
        const results = await Promise.all(uploadPromises);
        
        const successfulUploads: Media[] = results
            .filter(r => r.success && r.media)
            .map(r => r.media as Media);
        
        setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...successfulUploads] }));
        setIsLoading(false);
        addNotification(`${successfulUploads.length} image(s) uploaded.`, NotificationType.SUCCESS);
    };

    const handleAddYoutubeVideo = async () => {
        if (!youtubeUrl) return;
        const res = await api.getYouTubeVideoDetails(youtubeUrl);
        if (res.success && res.video) {
            setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), res.video!] }));
            setYoutubeUrl('');
            addNotification('YouTube video added!', NotificationType.SUCCESS);
        } else { addNotification(res.message, NotificationType.ERROR); }
    };

    const removeAttachment = (id: string) => setFormData(prev => ({ ...prev, attachments: prev.attachments?.filter(att => att.id !== id) }));
    
    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        const response = post?.id
            ? await api.updateInstructorPost(user.id, post.id, formData)
            : await api.createInstructorPost(user.id, formData as Omit<InstructorPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'viewCount' | 'authorId'>);
        
        setIsLoading(false);
        if (response.success) {
            addNotification(response.message, NotificationType.SUCCESS);
            localStorage.removeItem(DRAFT_KEY);
            onSave();
        } else { addNotification(response.message, NotificationType.ERROR); }
    };

    return (
        <Modal isOpen={true} onClose={cleanupAndClose} title={post ? 'Edit Post' : 'Create New Post'} size="2xl">
            <div className="space-y-6">
                <Input name="title" label="Post Title" value={formData.title} onChange={handleChange} required />
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
                    <textarea name="content" value={formData.content} onChange={handleChange} rows={10} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-sky-400 border-b border-slate-600 pb-2">Attachments</h3>
                    <div onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); handleImageUpload(e.dataTransfer.files);}} className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-sky-500">
                        <input type="file" multiple accept="image/*" onChange={e => handleImageUpload(e.target.files)} className="hidden" id="post-image-upload" />
                        <label htmlFor="post-image-upload" className="cursor-pointer text-slate-400">Drag & drop images, or click to upload.</label>
                    </div>
                    <div className="flex gap-2"><Input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube URL..." /><Button variant="secondary" onClick={handleAddYoutubeVideo}>Add Video</Button></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {formData.attachments?.map(att => (
                            <div key={att.id} className="relative group bg-slate-700 rounded-md overflow-hidden">
                                {att.type === 'youtube' ? <img src={att.thumbnailUrl} alt={att.title} className="w-full h-20 object-cover" /> : <img src={att.url} alt={att.caption} className="w-full h-20 object-cover" />}
                                <button onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100">&times;</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-sky-400 border-b border-slate-600 pb-2">Visibility</h3>
                    <select name="visibility" value={formData.visibility} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200">
                        <option value="Public">Public (Visible to all users)</option>
                        <option value="Course-Only">Course-Only (Visible on selected course page)</option>
                        <option value="Enrolled-Only">Enrolled-Only (Visible only to students of selected course)</option>
                    </select>
                    {formData.visibility !== 'Public' && (
                        <select name="courseId" value={formData.courseId} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200">
                            <option value="">Select a course...</option>
                            {allCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400 mr-auto">Status: <span className="font-semibold text-yellow-400">Draft</span> (Admin will review before publishing)</div>
                    <Button variant="secondary" onClick={cleanupAndClose}>Cancel</Button>
                    <Button onClick={handleSubmit} isLoading={isLoading}>Save Draft</Button>
                </div>
            </div>
        </Modal>
    );
};
export default InstructorPostEditor;
