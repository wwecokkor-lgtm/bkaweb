
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { User, Course, Order, PaymentMethod, AdminLog, Exam, NewsPost, Media, UserStatus, VersionInfo, InstructionContent, SystemSettings, Backup, Instructor, InstructorPost, Coupon } from './types';
import { Role } from './types';

// Import Editors and Modals
import CourseEditor from './CourseEditor';
import PaymentMethodEditor from './PaymentMethodEditor';
import ExamEditor from './ExamEditor';
import NewsPostEditor from './NewsPostEditor';
import MediaUploader from './MediaUploader';
import RejectionReasonModal from './RejectionReasonModal';
import UserEditorModal from './UserEditorModal';
import InstructionEditor from './InstructionEditor';
import BackupPreviewModal from './BackupPreviewModal';
import InstructorEditor from './InstructorEditor';
import CouponEditor from './CouponEditor';

// Import Layout Components
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

// Import View Components
import AdminDashboardView from './AdminDashboardView';
import UserManagementView from './UserManagementView';
import CourseManagementView from './CourseManagementView';
import ExamManagementView from './ExamManagementView';
import NewsPostManagementView from './NewsPostManagementView';
import MediaLibraryView from './MediaLibraryView';
import PaymentVerificationView from './PaymentVerificationView';
import PaymentMethodsView from './PaymentMethodsView';
import ActivityLogsView from './ActivityLogsView';
import ReportsView from './ReportsView';
import SettingsView from './SettingsView';
import InstructorManagementView from './InstructorManagementView';
import InstructorPostManagementView from './InstructorPostManagementView';
import CouponManagementView from './CouponManagementView';

// --- Type Exports for Children ---
export type AdminView = 'dashboard' | 'users' | 'instructors' | 'courses' | 'exams' | 'news' | 'instructorPosts' | 'media' | 'payments' | 'paymentMethods' | 'logs' | 'settings' | 'reports' | 'coupons';

export type NavItem = {
  key: string;
  label: string;
  view?: AdminView;
  icon: React.ReactElement;
  children?: Omit<NavItem, 'children' | 'key'>[];
  badgeCount?: () => number;
  roles?: Role[];
};

// --- MAIN ADMIN PAGE COMPONENT (CONTAINER) ---
const AdminPage: React.FC = () => {
    const { user, logout, notifications, showConfirmation } = useAppStore();
    const [view, setView] = useState<AdminView>('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        users: User[], courses: Course[], orders: Order[], paymentMethods: PaymentMethod[], 
        exams: Exam[], newsPosts: NewsPost[], media: Media[], adminLogs: AdminLog[], 
        versionInfo: VersionInfo | null, systemSettings: SystemSettings | null, instructionContent: InstructionContent | null,
        backups: Backup[], instructors: Instructor[], instructorPosts: InstructorPost[], coupons: Coupon[],
    }>({ users: [], courses: [], orders: [], paymentMethods: [], exams: [], newsPosts: [], media: [], adminLogs: [], versionInfo: null, systemSettings: null, instructionContent: null, backups: [], instructors: [], instructorPosts: [], coupons: [] });
    
    // UI State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Modals State
    const [isCourseEditorOpen, setIsCourseEditorOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isPaymentMethodEditorOpen, setIsPaymentMethodEditorOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const [isExamEditorOpen, setIsExamEditorOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [isNewsPostEditorOpen, setIsNewsPostEditorOpen] = useState(false);
    const [selectedNewsPost, setSelectedNewsPost] = useState<NewsPost | null>(null);
    const [isMediaUploaderOpen, setIsMediaUploaderOpen] = useState(false);
    const [isUserEditorOpen, setIsUserEditorOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [orderToReject, setOrderToReject] = useState<string | null>(null);
    const [isInstructionEditorOpen, setIsInstructionEditorOpen] = useState(false);
    const [previewBackup, setPreviewBackup] = useState<Backup | null>(null);
    const [isInstructorEditorOpen, setIsInstructorEditorOpen] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
    const [isCouponEditorOpen, setIsCouponEditorOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

    // Data Fetching
    const fetchData = useCallback(() => {
        setIsLoading(true);
        Promise.all([
            api.getUsers(true), api.getCourses(true, true), api.getOrders(), api.getPaymentMethods(), 
            api.getExams(),
            api.getNewsPosts({status: 'all'}), api.getMedia(), api.getAdminLogs(), 
            api.getAppVersion(), api.getSystemSettings(), api.getInstructionContent(),
            api.getBackups(), api.getInstructors(), api.getAllInstructorPosts(), api.getCoupons()
        ]).then(([users, courses, orders, paymentMethods, exams, newsData, media, adminLogs, versionInfo, systemSettings, instructionContent, backups, instructors, instructorPosts, coupons]) => { 
            setData({ users, courses, orders, paymentMethods, exams, newsPosts: newsData.posts, media, adminLogs, versionInfo, systemSettings, instructionContent, backups, instructors, instructorPosts, coupons }); 
        }).finally(() => setIsLoading(false));
    }, []);
    useEffect(fetchData, [fetchData]);

    const handleOpenEditor = (type: 'course' | 'paymentMethod' | 'exam' | 'newsPost' | 'media' | 'user' | 'instruction' | 'instructor' | 'coupon', dataItem: any | null = null) => {
        if (type === 'course') { setSelectedCourse(dataItem); setIsCourseEditorOpen(true); }
        if (type === 'paymentMethod') { setSelectedPaymentMethod(dataItem); setIsPaymentMethodEditorOpen(true); }
        if (type === 'exam') { setSelectedExam(dataItem); setIsExamEditorOpen(true); }
        if (type === 'newsPost') { setSelectedNewsPost(dataItem); setIsNewsPostEditorOpen(true); }
        if (type === 'media') { setIsMediaUploaderOpen(true); }
        if (type === 'user') { setSelectedUser(dataItem); setIsUserEditorOpen(true); }
        if (type === 'instruction') { setIsInstructionEditorOpen(true); }
        if (type === 'instructor') { setSelectedInstructor(dataItem); setIsInstructorEditorOpen(true); }
        if (type === 'coupon') { setSelectedCoupon(dataItem); setIsCouponEditorOpen(true); }
    };
    
    const handleSave = () => {
        setIsCourseEditorOpen(false); setSelectedCourse(null);
        setIsPaymentMethodEditorOpen(false); setSelectedPaymentMethod(null);
        setIsExamEditorOpen(false); setSelectedExam(null);
        setIsNewsPostEditorOpen(false); setSelectedNewsPost(null);
        setIsMediaUploaderOpen(false);
        setIsUserEditorOpen(false); setSelectedUser(null);
        setIsInstructionEditorOpen(false);
        setIsInstructorEditorOpen(false); setSelectedInstructor(null);
        setIsCouponEditorOpen(false); setSelectedCoupon(null);
        fetchData();
    };

    // --- Navigation Structure ---
    const navItems: NavItem[] = useMemo(() => [
        { key: 'dashboard', label: 'Dashboard', view: 'dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg> },
        { key: 'users', label: 'User Management', view: 'users', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12a5.995 5.995 0 00-3-5.197m0 0A4 4 0 1112 4.354a4 4 0 010 5.292" /></svg>, badgeCount: () => data.users.filter(u => u.status === 'Pending' && u.role === Role.USER).length },
        { key: 'instructors', label: 'Instructors', view: 'instructors', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>, badgeCount: () => data.users.filter(u => u.status === 'Pending' && u.role === Role.INSTRUCTOR).length },
        { key: 'academics', label: 'Academics', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" /></svg>, children: [
            { label: 'Courses', view: 'courses', icon: <></> },
            { label: 'Exams', view: 'exams', icon: <></> },
        ]},
        { key: 'payments', label: 'Payment', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, badgeCount: () => data.orders.filter(o => o.status === 'Pending').length, children: [
            { label: 'Verification', view: 'payments', icon: <></> },
            { label: 'Methods', view: 'paymentMethods', icon: <></> },
            { label: 'Coupons', view: 'coupons', icon: <></> },
        ]},
        { key: 'content', label: 'Content', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-1-5h.01" /></svg>, children: [
            { label: 'Admin Posts', view: 'news', icon: <></> },
            { label: 'Instructor Posts', view: 'instructorPosts', icon: <></> },
            { label: 'Media Library', view: 'media', icon: <></> },
        ]},
        { key: 'reports', label: 'Reports', view: 'reports', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
        { key: 'logs', label: 'Activity Logs', view: 'logs', roles: [Role.SUPER_ADMIN], icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { key: 'settings', label: 'Settings', view: 'settings', roles: [Role.SUPER_ADMIN], icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    ], [data]);

    const renderView = () => {
        if (isLoading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500"></div></div>;
        if (!user) return null;
        switch(view) {
            case 'dashboard': return <AdminDashboardView {...data} onQuickAction={(v) => { setView(v); handleOpenEditor(v as any); }} />;
            case 'users': return <UserManagementView users={data.users} onEdit={(u) => handleOpenEditor('user', u)} onSave={fetchData} setConfirmationAction={showConfirmation} />;
            case 'instructors': return <InstructorManagementView instructors={data.instructors} onAdd={() => handleOpenEditor('instructor')} onEdit={(i) => handleOpenEditor('instructor', i)} onSave={fetchData} />;
            case 'courses': return <CourseManagementView courses={data.courses} onAdd={() => handleOpenEditor('course', null)} onEdit={(c) => handleOpenEditor('course', c)} onSave={fetchData} setConfirmationAction={showConfirmation} />;
            case 'exams': return <ExamManagementView exams={data.exams} onEdit={(q) => handleOpenEditor('exam', q)} onDelete={(q) => {}} onAdd={() => handleOpenEditor('exam', null)} />;
            case 'news': return <NewsPostManagementView 
                onAdd={() => handleOpenEditor('newsPost', null)}
                onEdit={(p) => handleOpenEditor('newsPost', p)} 
                onTrash={(p) => showConfirmation({ title: 'Trash Post?', message: `Are you sure you want to move "${p.title}" to trash?`, actionType: 'warning', onConfirm: async () => { await api.softDeleteNewsPost(user.id, p.id); fetchData(); } })}
                onDelete={(p) => showConfirmation({ title: 'Delete Post Permanently?', message: `This action is irreversible. Are you sure you want to permanently delete "${p.title}"?`, actionType: 'danger', onConfirm: async () => { await api.permanentlyDeleteNewsPost(user.id, p.id); fetchData(); } })}
                onRestore={(p) => api.restoreNewsPost(user.id, p.id).then(fetchData)}
            />;
            case 'instructorPosts': return <InstructorPostManagementView posts={data.instructorPosts} users={data.users} onUpdate={fetchData} />;
            case 'media': return <MediaLibraryView media={data.media} users={data.users} onUpdate={fetchData} onDelete={(m) => {}} onUpload={() => handleOpenEditor('media', null)} />;
            case 'payments': return <PaymentVerificationView orders={data.orders} users={data.users} onApprove={(id) => { api.approvePayment(user!.id, id).then(fetchData); }} onReject={(id) => { setOrderToReject(id); setIsRejectionModalOpen(true); }} />;
            case 'paymentMethods': return <PaymentMethodsView methods={data.paymentMethods} onEdit={(m) => handleOpenEditor('paymentMethod', m)} onDelete={(m) => {}} onAdd={() => handleOpenEditor('paymentMethod', null)} />;
            case 'coupons': return <CouponManagementView coupons={data.coupons} onAdd={() => handleOpenEditor('coupon', null)} onEdit={(c) => handleOpenEditor('coupon', c)} onSave={fetchData} />;
            case 'logs': return <ActivityLogsView logs={data.adminLogs} />;
            case 'settings': return <SettingsView versionInfo={data.versionInfo} systemSettings={data.systemSettings} backups={data.backups} onSave={fetchData} onEditInstructions={() => handleOpenEditor('instruction')} onPreviewBackup={(b) => setPreviewBackup(b)} setConfirmationAction={showConfirmation} />;
            case 'reports': return <ReportsView />;
            default: return <h2 className="text-3xl font-bold">Coming Soon</h2>;
        }
    };
    
    if (!user || !(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN)) {
        return <div className="p-8 text-center text-red-400">Access Denied. You do not have permission to view this page.</div>;
    }

    return (
        <div className="flex h-screen bg-slate-900 text-slate-200">
            <AdminSidebar 
                isCollapsed={isSidebarCollapsed}
                isMobileMenuOpen={isMobileMenuOpen}
                navItems={navItems}
                view={view}
                openSubmenu={openSubmenu}
                version={data.versionInfo?.version}
                userRole={user.role}
                logoUrl={data.systemSettings?.logoUrl}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onSetView={(v) => { setView(v); setIsMobileMenuOpen(false); }}
                onSetOpenSubmenu={setOpenSubmenu}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminTopbar
                    user={user}
                    notificationsCount={notifications.length}
                    pageTitle={navItems.flatMap(i => i.children ? i.children : i).find(i => i.view === view)?.label || 'Admin'}
                    onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    onLogoutRequest={() => showConfirmation({ title: 'Confirm Logout', message: 'Are you sure you want to log out?', actionType: 'warning', onConfirm: async () => logout() })}
                    onProfileClick={() => handleOpenEditor('user', user)}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 p-6">
                    {renderView()}
                </main>
            </div>
            
            {/* Modals */}
            {isCourseEditorOpen && <CourseEditor course={selectedCourse} onClose={handleSave} onSave={handleSave} />}
            {isPaymentMethodEditorOpen && <PaymentMethodEditor method={selectedPaymentMethod} onClose={handleSave} onSave={handleSave} />}
            {isExamEditorOpen && <ExamEditor exam={selectedExam} allCourses={data.courses} onClose={handleSave} onSave={handleSave} />}
            {isNewsPostEditorOpen && <NewsPostEditor post={selectedNewsPost} onClose={handleSave} onSave={handleSave} />}
            {isMediaUploaderOpen && <MediaUploader onClose={handleSave} onSave={handleSave} />}
            {isUserEditorOpen && <UserEditorModal user={selectedUser} onClose={handleSave} onSave={handleSave} />}
            {isInstructorEditorOpen && <InstructorEditor instructor={selectedInstructor} onClose={handleSave} onSave={handleSave} />}
            {isCouponEditorOpen && <CouponEditor coupon={selectedCoupon} onClose={handleSave} onSave={handleSave} />}
            {isRejectionModalOpen && <RejectionReasonModal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} onConfirm={(reason) => { api.rejectPayment(user.id, orderToReject!, reason).then(fetchData); setIsRejectionModalOpen(false); }} />}
            {isInstructionEditorOpen && data.instructionContent && <InstructionEditor instructionContent={data.instructionContent} onClose={handleSave} onSave={handleSave} users={data.users} />}
            {previewBackup && <BackupPreviewModal backup={previewBackup} onClose={() => setPreviewBackup(null)} />}
        </div>
    );
};

export default AdminPage;
