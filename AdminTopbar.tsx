
import React, { useRef, useState, useEffect } from 'react';
import type { User } from './types';
import { Button } from './commonComponents';

interface AdminTopbarProps {
    user: User;
    notificationsCount: number;
    pageTitle: string;
    onMobileMenuToggle: () => void;
    onLogoutRequest: () => void;
    onProfileClick: () => void;
}

const AdminTopbar: React.FC<AdminTopbarProps> = ({ user, notificationsCount, pageTitle, onMobileMenuToggle, onLogoutRequest, onProfileClick }) => {
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const previewDropdownRef = useRef<HTMLDivElement>(null);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isPreviewDropdownOpen, setIsPreviewDropdownOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
            if (previewDropdownRef.current && !previewDropdownRef.current.contains(event.target as Node)) {
                setIsPreviewDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 h-16 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={onMobileMenuToggle} className="md:hidden text-slate-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <h1 className="text-xl font-bold text-white hidden md:block">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-4">
                 <div className="relative" ref={previewDropdownRef}>
                    <Button onClick={() => setIsPreviewDropdownOpen(!isPreviewDropdownOpen)} variant="secondary" size="sm">
                        Preview Site
                        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </Button>
                     {isPreviewDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-md shadow-lg py-1 border border-slate-700 z-10">
                            <button onClick={() => { window.open('/?preview=true&as=guest', '_blank'); setIsPreviewDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">As Guest User</button>
                            <button onClick={() => { window.open('/?preview=true&as=student', '_blank'); setIsPreviewDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">As Student (Not Enrolled)</button>
                            <button onClick={() => { window.open('/?preview=true&as=enrolled_student', '_blank'); setIsPreviewDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">As Enrolled Student</button>
                        </div>
                    )}
                 </div>

                 <button className="relative text-slate-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {notificationsCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-xs items-center justify-center">{notificationsCount}</span></span>}
                </button>
                 <div className="relative" ref={profileDropdownRef}>
                     <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                        <img src={user.avatarUrl} alt="admin" className="w-9 h-9 rounded-full border-2 border-slate-600 hover:border-sky-500" />
                    </button>
                      {isProfileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg py-1 border border-slate-700 z-10">
                            <div className="px-4 py-2 border-b border-slate-700"><p className="text-sm text-slate-400">Signed in as</p><p className="font-medium text-white truncate">{user.username}</p></div>
                            <button onClick={() => { onProfileClick(); setIsProfileDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">My Profile</button>
                            <button onClick={() => { onLogoutRequest(); setIsProfileDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 border-t border-slate-700">Logout</button>
                        </div>
                    )}
                 </div>
            </div>
        </header>
    );
};

export default AdminTopbar;
