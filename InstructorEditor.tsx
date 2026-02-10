
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Instructor, InstructorSlide } from './types';
import { Modal, Button, Input } from './commonComponents';
import { NotificationType } from './types';

interface InstructorEditorProps {
    instructor: Instructor | null;
    onClose: () => void;
    onSave: () => void;
}

const InstructorEditor: React.FC<InstructorEditorProps> = ({ instructor, onClose, onSave }) => {
    const { user, addNotification } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Instructor>>({
        name: '', title: '', degrees: '', experience: '', bio: '', photoUrl: 'https://picsum.photos/seed/new-instructor/200',
        email: '', status: 'Active', slides: []
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(formData.photoUrl || null);
    
    useEffect(() => {
        if (instructor) {
            setFormData(instructor);
            setPhotoPreview(instructor.photoUrl);
        }
    }, [instructor]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSlideChange = (index: number, field: keyof InstructorSlide, value: string) => {
        const newSlides = [...(formData.slides || [])];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setFormData(prev => ({ ...prev, slides: newSlides }));
    };

    const addSlide = () => {
        const newSlide: InstructorSlide = { id: `s-${Date.now()}`, title: '', content: '' };
        setFormData(prev => ({ ...prev, slides: [...(prev.slides || []), newSlide] }));
    };

    const removeSlide = (index: number) => {
        setFormData(prev => ({ ...prev, slides: prev.slides?.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);

        let finalFormData = { ...formData };

        if (photoFile) {
            const uploadResponse = await api.uploadPhoto(photoFile);
            if (uploadResponse.success && uploadResponse.url) {
                finalFormData.photoUrl = uploadResponse.url;
            } else {
                addNotification(uploadResponse.message || 'Photo upload failed.', NotificationType.ERROR);
                setIsLoading(false);
                return;
            }
        }

        const response = instructor?.id
            ? await api.updateInstructor(user.id, instructor.id, finalFormData)
            : await api.createInstructor(user.id, finalFormData as Omit<Instructor, 'id'>);
        
        setIsLoading(false);
        if (response.success) {
            addNotification(response.message, NotificationType.SUCCESS);
            onSave();
        } else {
            addNotification(response.message, NotificationType.ERROR);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={instructor ? 'Edit Instructor' : 'Create New Instructor'} size="2xl">
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
                <h3 className="text-xl font-semibold text-sky-400 border-b border-slate-700 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="name" label="Full Name" value={formData.name} onChange={handleChange} required />
                    <Input name="title" label="Title / Designation" value={formData.title} onChange={handleChange} required />
                    <Input name="degrees" label="Degrees" value={formData.degrees} onChange={handleChange} />
                    <Input name="experience" label="Experience" value={formData.experience} onChange={handleChange} />
                    <Input name="email" label="Email" type="email" value={formData.email} onChange={handleChange} required />
                    <Input name="phone" label="Phone (Optional)" value={formData.phone} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Photo</label>
                    <div className="flex items-center gap-4">
                        <img src={photoPreview || 'https://picsum.photos/seed/placeholder/200'} alt="Instructor Preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"/>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600/20 file:text-sky-400 hover:file:bg-sky-600/30"/>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Biography</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200"></textarea>
                </div>

                <h3 className="text-xl font-semibold text-sky-400 border-b border-slate-700 pb-2 mt-6">Course Page Slides</h3>
                <div className="space-y-4">
                    {formData.slides?.map((slide, index) => (
                        <div key={slide.id || index} className="bg-slate-700/50 p-4 rounded-lg space-y-2 relative">
                             <Button size="sm" variant="danger" onClick={() => removeSlide(index)} className="absolute top-2 right-2 !p-1 h-6 w-6">X</Button>
                            <Input label={`Slide ${index + 1} Title`} value={slide.title} onChange={e => handleSlideChange(index, 'title', e.target.value)} />
                            <textarea placeholder="Slide content..." value={slide.content} onChange={e => handleSlideChange(index, 'content', e.target.value)} rows={3} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-200" />
                            <Input label="Image URL (Optional)" value={slide.imageUrl} onChange={e => handleSlideChange(index, 'imageUrl', e.target.value)} />
                        </div>
                    ))}
                    <Button variant="secondary" onClick={addSlide}>Add Slide</Button>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} isLoading={isLoading}>Save Instructor</Button>
                </div>
            </div>
        </Modal>
    );
};

export default InstructorEditor;
