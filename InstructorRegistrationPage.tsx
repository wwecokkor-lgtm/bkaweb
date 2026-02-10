
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import { Button, Input, Card } from './commonComponents';
import { NotificationType } from './types';

interface InstructorRegistrationPageProps {
    logoUrl?: string;
}

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
    const strength = useMemo(() => {
        let score = 0;
        if (!password) return { score: 0, label: '', color: '' };
        if (password.length >= 8) score++; if (/[A-Z]/.test(password)) score++; if (/[0-9]/.test(password)) score++; if (/[^A-Za-z0-9]/.test(password)) score++;
        switch (score) {
            case 1: return { score, label: 'Weak', color: 'bg-red-500' }; case 2: return { score, label: 'Medium', color: 'bg-yellow-500' };
            case 3: return { score, label: 'Strong', color: 'bg-green-500' }; case 4: return { score, label: 'Very Strong', color: 'bg-emerald-500' };
            default: return { score: 0, label: '', color: '' };
        }
    }, [password]);
    if (!password) return null;
    return (
        <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-slate-700 rounded-full h-2"><div className={`h-2 rounded-full ${strength.color}`} style={{ width: `${(strength.score / 4) * 100}%` }}></div></div>
            <span className="text-xs text-slate-400 w-24 text-right">{strength.label}</span>
        </div>
    );
};

const DRAFT_KEY = 'instructor-registration-draft';

const InstructorRegistrationPage: React.FC<InstructorRegistrationPageProps> = ({ logoUrl }) => {
    const { setPage, addNotification, login, showConfirmation } = useAppStore();
    const [formData, setFormData] = useState({
        fullName: '', email: '', phone: '', password: '', confirmPassword: '',
        expertise: 'Physics', experienceYears: '1', courseCategory: 'SSC', bio: '',
        languages: [] as string[], portfolioUrl: '', terms: false,
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const draftData = JSON.parse(savedDraft);
                 showConfirmation({
                    title: "Unsaved Application Found",
                    message: "Do you want to restore your saved application progress?",
                    actionType: 'warning',
                    confirmText: "Restore",
                    cancelText: "Start New",
                    onConfirm: () => setFormData(draftData),
                    onCancel: () => localStorage.removeItem(DRAFT_KEY)
                });
            } catch (e) { console.error("Could not parse draft"); }
        }
    }, [showConfirmation]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.fullName || formData.email || formData.bio) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            if (name === 'language') {
                setFormData(prev => ({...prev, languages: checked ? [...prev.languages, value] : prev.languages.filter(l => l !== value) }));
            } else {
                 setFormData({ ...formData, [name]: checked });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file));
        } else if (file) { addNotification('Please select a valid image file.', NotificationType.ERROR); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) { addNotification("Passwords do not match.", NotificationType.ERROR); return; }
        if (!formData.terms) { addNotification("You must accept the terms & conditions.", NotificationType.ERROR); return; }
        
        setIsLoading(true);
        let uploadedAvatarUrl = '';
        if (avatarFile) {
            const uploadResponse = await api.uploadPhoto(avatarFile);
            if (uploadResponse.success && uploadResponse.url) { uploadedAvatarUrl = uploadResponse.url; } 
            else { addNotification(uploadResponse.message, NotificationType.ERROR); setIsLoading(false); return; }
        }

        const response = await api.registerInstructorApplication({ ...formData, avatarUrl: uploadedAvatarUrl });
        setIsLoading(false);

        if (response.success && response.user && response.sessionId) {
            addNotification(response.message, NotificationType.SUCCESS);
            localStorage.removeItem(DRAFT_KEY);
            login({ user: response.user, sessionId: response.sessionId });
        } else {
            addNotification(response.message, NotificationType.ERROR);
        }
    };

    return (
        <div className="flex items-center justify-center w-full py-12">
            <Card className="w-full max-w-3xl">
                <div className="text-center mb-8">
                    {logoUrl ? (
                        <img src={logoUrl} alt="BK Academy Logo" className="w-48 mx-auto mb-4" />
                    ) : (
                        <h1 className="text-3xl font-bold text-white">Become an Instructor</h1>
                    )}
                    <p className="text-slate-400">Join our team of expert educators and share your knowledge.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} required />
                            <Input name="email" type="email" label="Email Address" value={formData.email} onChange={handleChange} required />
                            <Input name="phone" type="tel" label="Mobile Number" value={formData.phone} onChange={handleChange} required />
                            <div>
                                <div className="relative"><Input name="password" type={showPassword ? 'text' : 'password'} label="Password" value={formData.password} onChange={handleChange} required minLength={8} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-slate-400">{showPassword ? 'Hide' : 'Show'}</button></div>
                                <PasswordStrengthIndicator password={formData.password} />
                            </div>
                            <Input name="confirmPassword" type="password" label="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2">Professional Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-slate-300 mb-1">Area of Expertise</label><select name="expertise" value={formData.expertise} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2"><option>Physics</option><option>Chemistry</option><option>Math</option><option>Biology</option><option>ICT</option><option>Bangla</option><option>English</option></select></div>
                            <Input name="experienceYears" type="number" label="Teaching Experience (Years)" value={formData.experienceYears} onChange={handleChange} min="0" required />
                            <div><label className="block text-sm font-medium text-slate-300 mb-1">Preferred Course Category</label><select name="courseCategory" value={formData.courseCategory} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2"><option>SSC</option><option>HSC</option><option>JSC</option><option>General</option></select></div>
                            <div><label className="block text-sm font-medium text-slate-300 mb-1">Languages</label><div className="flex gap-4 pt-2">{['Bangla', 'English'].map(lang => <label key={lang} className="flex items-center gap-2"><input type="checkbox" name="language" value={lang} checked={formData.languages.includes(lang)} onChange={handleChange} className="h-4 w-4 text-sky-600" />{lang}</label>)}</div></div>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-300 mb-1">Short Bio / About Yourself</label><textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2" required placeholder="Tell us about your teaching philosophy and experience..."></textarea></div>
                    </div>
                     
                    <div className="space-y-4">
                         <h2 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2">Verification & Profile</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Profile Photo</label>
                                <div className="flex items-center gap-4">
                                    <img src={avatarPreview || 'https://picsum.photos/seed/placeholder/200'} alt="Avatar Preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"/>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600/20 text-sky-400 hover:file:bg-sky-600/30"/>
                                </div>
                             </div>
                             <Input name="portfolioUrl" label="Portfolio / Website / YouTube Link (Optional)" value={formData.portfolioUrl} onChange={handleChange} placeholder="https://example.com" />
                         </div>
                    </div>
                    
                    <div className="flex items-start"><input id="terms" name="terms" type="checkbox" checked={formData.terms} onChange={handleChange} className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-600 rounded mt-1" /><div className="ml-3 text-sm"><label htmlFor="terms" className="text-slate-300">I agree to the <a href="#" className="text-sky-400 hover:underline">Instructor Terms & Conditions</a></label></div></div>
                    
                    <div className="flex items-center justify-between">
                         <Button type="submit" className="w-full md:w-auto" isLoading={isLoading}>Submit Application</Button>
                        <p className="text-slate-400">Already have an account?{' '}<button onClick={() => setPage('login')} className="font-semibold text-sky-500 hover:text-sky-400">Login</button></p>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default InstructorRegistrationPage;
