
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Course, Lesson, LessonResource } from './types';
import { Modal, Button, Input, Spinner } from './commonComponents';
import { NotificationType } from './types';

interface InstructorCourseEditorProps {
    course: Course | null;
    onClose: () => void;
    onSave: () => void;
}

const InstructorCourseEditor: React.FC<InstructorCourseEditorProps> = ({ course, onClose, onSave }) => {
    const { user, addNotification } = useAppStore();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Course>>({
        title: '', description: '', category: 'SSC', author: user?.username || '', price: 1000, discount: 0,
        thumbnailUrl: 'https://picsum.photos/seed/newcourse/400/225', lessons: [], resources: [],
    });
    const [thumbnailPreview, setThumbnailPreview] = useState(formData.thumbnailUrl);

    useEffect(() => {
        if (course) {
            setFormData(course);
            setThumbnailPreview(course.thumbnailUrl);
        }
    }, [course]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLessonChange = (index: number, field: keyof Lesson, value: string | boolean | number) => {
        const newLessons = [...(formData.lessons || [])];
        newLessons[index] = { ...newLessons[index], [field]: value };
        setFormData(prev => ({ ...prev, lessons: newLessons }));
    };

    const addLesson = () => {
        const newLesson: Lesson = { id: `new-${Date.now()}`, title: '', contentUrl: '', type: 'Video', duration: '00:00', isFree: false, likes: [], comments: [], resources: [], coinReward: 0 };
        setFormData(prev => ({ ...prev, lessons: [...(prev.lessons || []), newLesson] }));
    };

    const removeLesson = (index: number) => {
        setFormData(prev => ({ ...prev, lessons: prev.lessons?.filter((_, i) => i !== index) }));
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true);
            const res = await api.uploadPhoto(file);
            setIsLoading(false);
            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, thumbnailUrl: res.url }));
                setThumbnailPreview(res.url);
                addNotification('Thumbnail uploaded!', NotificationType.SUCCESS);
            } else {
                addNotification(res.message, NotificationType.ERROR);
            }
        }
    };
    
    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        const dataToSave = { 
            ...formData, 
            price: Number(formData.price), 
            discount: Number(formData.discount),
            authorId: user.id, // Ensure ownership
            publishStatus: 'Draft' // Instructors can only save as draft
        };

        const response = course?.id
            ? await api.updateCourse(user.id, course.id, dataToSave)
            : await api.createCourse(user.id, dataToSave as Omit<Course, 'id' | 'createdAt' | 'updatedAt'>);

        setIsLoading(false);
        if (response.success) {
            addNotification(response.message, NotificationType.SUCCESS);
            onSave();
        } else {
            addNotification(response.message, NotificationType.ERROR);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: return (
                <div className="space-y-4">
                    <Input name="title" label="Course Title" value={formData.title} onChange={handleChange} required />
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Category</label><select name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"><option>SSC</option><option>HSC</option><option>JSC</option><option>General</option></select></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Thumbnail</label><div className="flex items-center gap-4"><img src={thumbnailPreview} alt="preview" className="w-24 h-14 object-cover rounded" /><input type="file" onChange={handleThumbnailUpload} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600/20 file:text-sky-400 hover:file:bg-sky-600/30"/></div></div>
                </div>
            );
            case 2: return (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {formData.lessons?.map((lesson, index) => (
                        <div key={index} className="bg-slate-700/50 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between items-center"><h4 className="font-semibold">Lesson {index + 1}</h4><Button size="sm" variant="danger" onClick={() => removeLesson(index)}>Remove</Button></div>
                            <Input label="Title" value={lesson.title} onChange={e => handleLessonChange(index, 'title', e.target.value)} />
                            <Input label="Content URL (e.g. YouTube)" value={lesson.contentUrl} onChange={e => handleLessonChange(index, 'contentUrl', e.target.value)} />
                            <Input label="Coin Reward" type="number" value={lesson.coinReward || 0} onChange={e => handleLessonChange(index, 'coinReward', Number(e.target.value))} />
                            <div className="flex items-center gap-2 pt-1"><input type="checkbox" id={`isFree-${index}`} className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-600 rounded" checked={!!lesson.isFree} onChange={e => handleLessonChange(index, 'isFree', e.target.checked)} /><label htmlFor={`isFree-${index}`} className="text-sm text-slate-300 select-none cursor-pointer">Mark as free preview</label></div>
                        </div>
                    ))}
                    <Button variant="secondary" onClick={addLesson}>Add Lesson</Button>
                </div>
            );
            case 3: return (
                <div className="space-y-4">
                    <Input name="price" label="Price (BDT)" type="number" value={formData.price} onChange={handleChange} required />
                    <Input name="discount" label="Discounted Price (Optional)" type="number" value={formData.discount} onChange={handleChange} />
                    <div className="p-4 bg-slate-700/50 rounded-lg">
                        <p className="font-semibold text-white">Publishing Status</p>
                        <p className="text-sm text-slate-300">Your course will be saved as a 'Draft'. An admin will review and publish it.</p>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={course ? 'Edit Course' : 'Create New Course'}>
            <div>
                <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2">
                    {['Basic Info', 'Lessons', 'Pricing'].map((name, index) => (
                        <button key={index} onClick={() => setStep(index + 1)} className={`text-sm font-medium ${step === index + 1 ? 'text-sky-400' : 'text-slate-400'}`}>{name}</button>
                    ))}
                </div>
                
                <div className="min-h-[300px]">{renderStep()}</div>

                <div className="flex justify-between mt-6">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <div className="flex gap-2">
                        {step > 1 && <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Previous</Button>}
                        {step < 3 && <Button onClick={() => setStep(s => s + 1)}>Next</Button>}
                        {step === 3 && <Button onClick={handleSubmit} isLoading={isLoading}>Save as Draft</Button>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default InstructorCourseEditor;
