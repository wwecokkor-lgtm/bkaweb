
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { Role } from './types';

const NavLink: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode; }> = ({ onClick, isActive, children }) => (
    <button onClick={onClick} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
        {children}
    </button>
);

interface HeaderProps {
    logoUrl?: string;
}

const Header: React.FC<HeaderProps> = ({ logoUrl }) => {
    const { isAuthenticated, user, logout, page, setPage, notifications, searchTerm, setSearchTerm, showConfirmation } = useAppStore();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !(event.target as HTMLElement).closest('#mobile-menu-button')) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage('courses');
    };

    const handleLogout = () => {
        setIsDropdownOpen(false);
        showConfirmation({
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out?',
            actionType: 'warning',
            onConfirm: logout
        });
    };
    
    const isInstructor = user?.role === Role.INSTRUCTOR;
    const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
    const homePage = isInstructor ? 'instructorDashboard' : 'dashboard';


    return (
        <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
            <nav className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Main Nav */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 text-white font-bold text-xl cursor-pointer" onClick={() => setPage(isAuthenticated ? homePage : 'login')}>
                             {logoUrl ? <img src={logoUrl} alt="BK Academy" className="h-8 w-auto" /> : 'BK Academy'}
                        </div>
                        {isAuthenticated && (
                            <div className="hidden md:block ml-10">
                                <div className="flex items-baseline space-x-4">
                                     <NavLink onClick={() => setPage(homePage)} isActive={page === 'dashboard' || page === 'instructorDashboard'}>Dashboard</NavLink>
                                    <NavLink onClick={() => setPage('courses')} isActive={page === 'courses'}>Our Courses</NavLink>
                                    {!isInstructor && <NavLink onClick={() => setPage('exams')} isActive={page === 'exams'}>Exams</NavLink>}
                                    {!isInstructor && <NavLink onClick={() => setPage('leaderboard')} isActive={page === 'leaderboard'}>Leaderboard</NavLink>}
                                    <NavLink onClick={() => setPage('news')} isActive={page === 'news' || page === 'newsDetail'}>News</NavLink>
                                    {isAdmin && <NavLink onClick={() => setPage('admin')} isActive={page === 'admin'}>Admin Panel</NavLink>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search, Notifications & Profile */}
                    {isAuthenticated && user && (
                        <div className="hidden md:flex items-center gap-4">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search courses..." className="bg-slate-700/50 text-white rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </form>

                            <button onClick={() => setPage('notifications')} className="relative text-slate-300 hover:text-white p-2 rounded-full hover:bg-slate-700">
                                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                {notifications.length > 0 && <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-slate-800 text-xs text-white flex items-center justify-center">{notifications.length}</span>}
                            </button>

                            <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}><img className="h-9 w-9 rounded-full border-2 border-slate-600 hover:border-sky-500 transition" src={user.avatarUrl} alt="User avatar" /></button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg py-1 border border-slate-700">
                                        <div className="px-4 py-2 border-b border-slate-700"><p className="text-sm text-slate-400">Signed in as</p><p className="font-medium text-white truncate">{user.username}</p></div>
                                        <button onClick={() => { setPage('profile'); setIsDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">My Profile</button>
                                        <button onClick={() => { setPage(homePage); setIsDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Dashboard</button>
                                        <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 border-t border-slate-700">Logout</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                     {/* Mobile Menu Button */}
                     {isAuthenticated && <div className="md:hidden">
                        <button id="mobile-menu-button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white p-2 rounded-md hover:bg-slate-700">
                           <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        </button>
                     </div>}
                </div>
            </nav>

             {/* Mobile Menu */}
            {isAuthenticated && isMobileMenuOpen && (
                <div ref={mobileMenuRef} className="md:hidden bg-slate-800 border-b border-slate-700">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink onClick={() => { setPage(homePage); setIsMobileMenuOpen(false); }} isActive={page === 'dashboard' || page === 'instructorDashboard'}>Dashboard</NavLink>
                        <NavLink onClick={() => { setPage('courses'); setIsMobileMenuOpen(false); }} isActive={page === 'courses'}>Our Courses</NavLink>
                        {!isInstructor && <NavLink onClick={() => { setPage('exams'); setIsMobileMenuOpen(false); }} isActive={page === 'exams'}>Exams</NavLink>}
                        {!isInstructor && <NavLink onClick={() => { setPage('leaderboard'); setIsMobileMenuOpen(false); }} isActive={page === 'leaderboard'}>Leaderboard</NavLink>}
                        <NavLink onClick={() => { setPage('news'); setIsMobileMenuOpen(false); }} isActive={page === 'news' || page === 'newsDetail'}>News</NavLink>
                        {isAdmin && <NavLink onClick={() => { setPage('admin'); setIsMobileMenuOpen(false); }} isActive={page === 'admin'}>Admin Panel</NavLink>}
                        <NavLink onClick={() => { setPage('profile'); setIsMobileMenuOpen(false); }} isActive={page === 'profile'}>My Profile</NavLink>
                        <NavLink onClick={() => { setPage('notifications'); setIsMobileMenuOpen(false); }} isActive={page === 'notifications'}>Notifications</NavLink>
                        <form onSubmit={(e) => { e.preventDefault(); setPage('courses'); setIsMobileMenuOpen(false); }} className="p-2">
                             <input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full bg-slate-700 text-white rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        </form>
                        <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white">Logout</button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
