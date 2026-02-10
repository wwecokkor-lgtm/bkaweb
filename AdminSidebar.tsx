
import React from 'react';
import { Badge } from './commonComponents';
import type { NavItem, AdminView } from './AdminPage';
import { Role } from './types';

interface AdminSidebarProps {
    isCollapsed: boolean;
    isMobileMenuOpen: boolean;
    navItems: NavItem[];
    view: AdminView;
    openSubmenu: string | null;
    version: string | undefined;
    userRole: Role;
    logoUrl?: string;
    onToggleCollapse: () => void;
    onSetView: (view: AdminView) => void;
    onSetOpenSubmenu: (key: string | null) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, isMobileMenuOpen, navItems, view, openSubmenu, version, userRole, logoUrl, onToggleCollapse, onSetView, onSetOpenSubmenu }) => {
    
    return (
        <aside className={`bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'} ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 w-64' : 'hidden md:flex'}`}>
            <div className={`flex items-center border-b border-slate-700 transition-all ${isCollapsed ? 'h-16 justify-center' : 'h-16 px-4'}`}>
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
                ) : (
                    <>
                        <span className={`font-bold text-xl text-white whitespace-nowrap ${isCollapsed ? 'hidden' : 'block'}`}>BK Academy</span>
                        <span className={`font-bold text-xl text-white whitespace-nowrap ${isCollapsed ? 'block' : 'hidden'}`}>BK</span>
                    </>
                )}
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
               {navItems.filter(i => !i.roles || i.roles.includes(userRole)).map(item => {
                   const isActive = openSubmenu === item.key;
                   const badgeCount = item.badgeCount ? item.badgeCount() : 0;
                   if (item.children) {
                       return (
                           <div key={item.key}>
                               <button onClick={() => onSetOpenSubmenu(isActive ? null : item.key)} className="w-full flex items-center justify-between p-2 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700">
                                   <div className="flex items-center gap-3">
                                       {item.icon}
                                       {!isCollapsed && <span>{item.label}</span>}
                                   </div>
                                   <div className="flex items-center gap-2">
                                       {badgeCount > 0 && <Badge color="red">{badgeCount}</Badge>}
                                       {!isCollapsed && <svg className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                                   </div>
                               </button>
                               {isActive && !isCollapsed && (
                                   <div className="pl-6 pt-1 space-y-1">
                                       {item.children.map(child => (
                                           <button key={child.view} onClick={() => child.view && onSetView(child.view)} className={`w-full text-left block p-2 text-sm rounded-md ${view === child.view ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>{child.label}</button>
                                       ))}
                                   </div>
                               )}
                           </div>
                       );
                   }
                   return (
                       <button key={item.key} onClick={() => { if(item.view) { onSetView(item.view); onSetOpenSubmenu(item.key); }}} className={`w-full flex items-center justify-between p-2 text-sm font-medium rounded-md transition-colors ${view === item.view ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                           <div className="flex items-center gap-3">{item.icon} {!isCollapsed && <span>{item.label}</span>}</div>
                           {badgeCount > 0 && <Badge color="red">{badgeCount}</Badge>}
                       </button>
                   );
               })}
            </nav>
            <div className="border-t border-slate-700 p-2">
                 <button onClick={onToggleCollapse} className="hidden md:flex w-full items-center p-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-700">
                    {isCollapsed ? 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg> : 
                        <div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg><span>Collapse</span></div>}
                 </button>
                 <p className={`text-center text-xs text-slate-500 mt-2 ${isCollapsed ? 'hidden' : 'block'}`}>Version: {version}</p>
            </div>
        </aside>
    );
};

export default AdminSidebar;
