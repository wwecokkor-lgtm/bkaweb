
import React, { useState, useMemo } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import { Button, Input, Card } from './commonComponents';
import { NotificationType, Role } from './types';

interface RegistrationPageProps {
    logoUrl?: string;
}

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
    const strength = useMemo(() => {
        let score = 0;
        if (!password) return { score: 0, label: '', color: '' };
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        switch (score) {
            case 1: return { score, label: 'Weak', color: 'bg-red-500' };
            case 2: return { score, label: 'Medium', color: 'bg-yellow-500' };
            case 3: return { score, label: 'Strong', color: 'bg-green-500' };
            case 4: return { score, label: 'Very Strong', color: 'bg-emerald-500' };
            default: return { score: 0, label: '', color: '' };
        }
    }, [password]);

    if (!password) return null;

    return (
        <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${strength.color}`} style={{ width: `${(strength.score / 4) * 100}%` }}></div>
            </div>
            <span className="text-xs text-slate-400 w-24 text-right">{strength.label}</span>
        </div>
    );
};

const RegistrationPage: React.FC<RegistrationPageProps> = ({ logoUrl }) => {
    const { setPage, addNotification, login } = useAppStore();
    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', confirmPassword: '', dob: '',
        gender: '', grade: '6', school: '', medium: 'Bangla', phone: '',
        address: '', terms: false, privacy: false
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        } else if (file) {
            addNotification('Please select a valid image file.', NotificationType.ERROR);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // --- Validation ---
        if(formData.password !== formData.confirmPassword) {
            addNotification("Passwords do not match.", NotificationType.ERROR);
            return;
        }
        if(!formData.terms || !formData.privacy) {
            addNotification("You must accept the terms and privacy policy.", NotificationType.ERROR);
            return;
        }
        
        setIsLoading(true);
        let uploadedAvatarUrl = '';
        if (avatarFile) {
            const uploadResponse = await api.uploadPhoto(avatarFile);
            if (uploadResponse.success && uploadResponse.url) {
                uploadedAvatarUrl = uploadResponse.url;
            } else {
                addNotification(uploadResponse.message, NotificationType.ERROR);
                setIsLoading(false);
                return;
            }
        }

        const registrationData = { ...formData, avatarUrl: uploadedAvatarUrl, role: Role.USER };
        const response = await api.register(registrationData);
        setIsLoading(false);

        if (response.success && response.user) {
            addNotification(response.message, NotificationType.SUCCESS);
            login({user: response.user, sessionId: response.user.currentSessionId || ''});
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
                        <h1 className="text-3xl font-bold text-white">Create Your Student Account</h1>
                    )}
                    <p className="text-slate-400">Join BK Academy and start learning today!</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} required minLength={3} />
                            <Input name="email" type="email" label="Email" value={formData.email} onChange={handleChange} required />
                            <div className="relative">
                                <Input name="password" type={showPassword ? 'text' : 'password'} label="Password" value={formData.password} onChange={handleChange} required minLength={8} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-slate-400">
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                                <PasswordStrengthIndicator password={formData.password} />
                            </div>
                            <Input name="confirmPassword" type="password" label="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                             <Input name="dob" type="date" label="Date of Birth (Optional)" value={formData.dob} onChange={handleChange} />
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                                </select>
                             </div>
                        </div>
                    </div>

                     {/* Academic Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2">Academic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Class / Grade</label>
                                <select name="grade" value={formData.grade} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Class {g}</option>)}
                                </select>
                            </div>
                             <Input name="school" label="School / Institution (Optional)" value={formData.school} onChange={handleChange} />
                            <div>
                               <label className="block text-sm font-medium text-slate-300 mb-1">Medium of Study</label>
                               <select name="medium" value={formData.medium} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                   <option value="Bangla">Bangla</option><option value="English">English</option>
                               </select>
                           </div>
                        </div>
                    </div>
                    
                    {/* Contact & Profile */}
                    <div className="space-y-4">
                         <h2 className="text-xl font-semibold text-sky-400 border-b border-slate-600 pb-2">Contact & Profile Photo</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="phone" type="tel" label="Phone Number (Optional)" value={formData.phone} onChange={handleChange} />
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Profile Photo (Optional)</label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <img src={avatarPreview || 'https://picsum.photos/seed/placeholder/200'} alt="Avatar Preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"/>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600/20 file:text-sky-400 hover:file:bg-sky-600/30"/>
                                </div>
                             </div>
                         </div>
                    </div>

                    {/* Security & Terms */}
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <input id="terms" name="terms" type="checkbox" checked={formData.terms} onChange={handleChange} className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-600 rounded mt-1" />
                            <div className="ml-3 text-sm"><label htmlFor="terms" className="text-slate-300">I agree to the <a href="#" className="text-sky-400 hover:underline">Terms & Conditions</a></label></div>
                        </div>
                         <div className="flex items-start">
                            <input id="privacy" name="privacy" type="checkbox" checked={formData.privacy} onChange={handleChange} className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-600 rounded mt-1" />
                            <div className="ml-3 text-sm"><label htmlFor="privacy" className="text-slate-300">I agree to the <a href="#" className="text-sky-400 hover:underline">Privacy Policy</a></label></div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                         <Button type="submit" className="w-full md:w-auto" isLoading={isLoading}>
                            Create Account
                        </Button>
                        <div className="text-center">
                            <p className="text-slate-400">
                                Already have an account?{' '}
                                <button type="button" onClick={() => setPage('login')} className="font-semibold text-sky-500 hover:text-sky-400">
                                    Login
                                </button>
                            </p>
                            <p className="text-slate-400">
                                Want to teach?{' '}
                                <button type="button" onClick={() => setPage('instructorRegister')} className="font-semibold text-amber-400 hover:text-amber-300">
                                    Apply Here
                                </button>
                            </p>
                        </div>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default RegistrationPage;
