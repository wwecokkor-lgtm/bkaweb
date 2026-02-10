
import React, { useEffect, useState, useRef } from 'react';
import { useAppStore, AppStoreProvider } from './store';
import { api } from './api';

import Header from './Header';
import Footer from './Footer';
import LoginPage from './LoginPage';
import RegistrationPage from './RegistrationPage';
import DashboardPage from './DashboardPage';
import AdminPage from './AdminPage';
import CoursesPage from './CoursesPage';
import CourseDetailPage from './CourseDetailPage';
import ProfilePage from './ProfilePage';
import NotificationsPage from './NotificationsPage';
import ExamAttemptPage from './ExamAttemptPage';
import NewsPage from './NewsPage';
import NewsPostDetailPage from './NewsPostDetailPage';
import Notification from './Notification';
import PaymentModal from './PaymentModal';
import PromotionPopup from './PromotionPopup';
import InstructionPopup from './InstructionPopup';
import LessonWatchingPage from './LessonWatchingPage';
import ExamsPage from './ExamsPage';
import LeaderboardPage from './LeaderboardPage';
import IdleTimeoutModal from './IdleTimeoutModal';
import BottomNavBar from './BottomNavBar';
import ConfirmationModal from './ConfirmationModal';
import InstructorDashboardPage from './InstructorDashboardPage';
import PendingApprovalPage from './PendingApprovalPage';
import InstructorRegistrationPage from './InstructorRegistrationPage';

import type { Page, SystemSettings, InstructionContent, User } from './types';
import { Role, NotificationType } from './types';

const AppContent: React.FC = () => {
    const { isAuthenticated, user, sessionId, page, setPage, fontPreference, updateUser, isPreviewMode, setIsPreviewMode, startPreviewSession, logout, addNotification, confirmation, hideConfirmation } = useAppStore();
    
    const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
    const [instructionContent, setInstructionContent] = useState<InstructionContent | null>(null);
    const [showPromotionPopup, setShowPromotionPopup] = useState(false);
    const [showInstructionPopup, setShowInstructionPopup] = useState(false);
    const [isIdleModalOpen, setIsIdleModalOpen] = useState(false);
    const idleTimerRef = useRef<number | null>(null);

    useEffect(() => {
        // Check for preview mode on initial load
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('preview') === 'true') {
            const asRole = urlParams.get('as') || 'student';
            setIsPreviewMode(true);
            if (asRole !== 'guest') {
                const previewUser: User = {
                    id: 'preview-user',
                    username: 'Preview Student',
                    email: 'preview@bk.academy',
                    role: Role.USER,
                    avatarUrl: 'https://picsum.photos/seed/preview/200',
                    createdAt: new Date(),
                    enrolledCourseIds: asRole === 'enrolled_student' ? ['c1', 'c2'] : [],
                    wishlistCourseIds: ['c3'],
                    status: 'Active',
                    agreementStatus: 'Agreed',
                    coins: 150,
                    coinTransactions: [],
                    badges: [],
                };
                startPreviewSession(previewUser);
            } else {
                 setPage('courses');
            }
        }
    }, []);


    useEffect(() => {
        api.getSystemSettings().then(setSystemSettings);
        api.getInstructionContent().then(setInstructionContent);
    }, []);

    // Session Management (Idle Timeout)
    useEffect(() => {
        if (!isAuthenticated || !user || !sessionId || !systemSettings || isPreviewMode || systemSettings.sessionTimeoutInMinutes === 0) {
            return;
        }

        const resetIdleTimer = () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if(isIdleModalOpen) setIsIdleModalOpen(false); // Close modal on any activity
            idleTimerRef.current = window.setTimeout(() => {
                setIsIdleModalOpen(true);
            }, systemSettings.sessionTimeoutInMinutes * 60 * 1000);
        };

        const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
        activityEvents.forEach(event => window.addEventListener(event, resetIdleTimer));
        resetIdleTimer();

        return () => {
            activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimer));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [isAuthenticated, user, sessionId, systemSettings, isPreviewMode, isIdleModalOpen]);

    // Single Device Login Check
    useEffect(() => {
        if (!isAuthenticated || !user || !sessionId || !systemSettings?.singleDeviceLogin || isPreviewMode) {
            return;
        }

        const sessionVerifier = window.setInterval(async () => {
            try {
                const res = await api.verifySession(user.id, sessionId);
                if (!res.valid) {
                    clearInterval(sessionVerifier);
                    addNotification("You have been logged out because you signed in on another device.", NotificationType.INFO);
                    logout();
                }
            } catch (error) {
                console.error("Session verification failed:", error);
            }
        }, 30000); // Check every 30 seconds
        
        return () => clearInterval(sessionVerifier);
    }, [isAuthenticated, user, sessionId, systemSettings, isPreviewMode, addNotification, logout]);

    useEffect(() => {
        if (!isPreviewMode && !isAuthenticated && !['login', 'register', 'instructorRegister'].includes(page)) {
            setPage('login');
        } else if (!isPreviewMode && isAuthenticated && ['login', 'register', 'instructorRegister'].includes(page)) {
            // Logic to redirect to last page or dashboard is in store's login function
        }
    }, [isAuthenticated, page, setPage, isPreviewMode]);
    
    useEffect(() => {
        document.body.className = `bg-slate-900 text-slate-200 ${fontPreference}`;
    }, [fontPreference]);

    useEffect(() => {
        if (isAuthenticated && user && systemSettings && !isPreviewMode) {
            if (user.isFirstVisit && systemSettings.isCoursePopupEnabled) {
                setShowPromotionPopup(true);
            } 
            else if (user.agreementStatus !== 'Agreed' && systemSettings.isInstructionPopupEnabled) {
                setShowInstructionPopup(true);
            }
        }
    }, [isAuthenticated, user, systemSettings, isPreviewMode]);

    const handlePromotionClose = () => {
        setShowPromotionPopup(false);
        if (user?.agreementStatus !== 'Agreed' && systemSettings?.isInstructionPopupEnabled) {
            setShowInstructionPopup(true);
        }
    };

    const handleInstructionAgree = async () => {
        if (user && instructionContent) {
            const res = await api.updateUserAgreement(user.id, instructionContent.version);
            if (res.success && res.user) {
                updateUser(res.user);
                setShowInstructionPopup(false);
            }
        }
    };
    
    const handleIdleLogout = () => {
        setIsIdleModalOpen(false);
        logout();
    };

    const handleStayLoggedIn = () => {
        setIsIdleModalOpen(false);
    };

    const handleConfirm = async () => {
        if (confirmation?.onConfirm) {
            await confirmation.onConfirm();
        }
        hideConfirmation();
    };

    const handleCancel = () => {
        if (confirmation?.onCancel) {
            confirmation.onCancel();
        }
        hideConfirmation();
    };
    
    const hasAgreed = user?.agreementStatus === 'Agreed';
    const isCorePage = ['dashboard', 'profile', 'admin', 'login', 'register', 'instructorRegister'].includes(page);
    const needsToAgree = !isPreviewMode && !hasAgreed && !isCorePage;
    const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
    const isInstructor = user?.role === Role.INSTRUCTOR;

    useEffect(() => {
        if (needsToAgree && !showInstructionPopup) {
            setShowInstructionPopup(true);
        }
    }, [page, needsToAgree, showInstructionPopup]);

    const renderPage = () => {
        if (page === 'lessonWatch') return <LessonWatchingPage />;
        
        if (!isAuthenticated && !isPreviewMode) {
            if (page === 'register') return <RegistrationPage logoUrl={systemSettings?.logoUrl} />;
            if (page === 'instructorRegister') return <InstructorRegistrationPage logoUrl={systemSettings?.logoUrl} />;
            return <LoginPage logoUrl={systemSettings?.logoUrl} />;
        }
        
        if (isInstructor && user?.status !== 'Active') {
            if (user?.status === 'Pending') return <PendingApprovalPage />;
            return (
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-red-400">Account {user?.status}</h2>
                    <p className="mt-4">Your account is currently {user?.status}. Please contact support for assistance.</p>
                </div>
            );
        }

        if (needsToAgree) {
            return <DashboardPage />;
        }

        switch (page) {
            case 'dashboard': return <DashboardPage />;
            case 'instructorDashboard': return isInstructor ? <InstructorDashboardPage /> : <DashboardPage />;
            case 'courses': return <CoursesPage />;
            case 'courseDetail': return <CourseDetailPage />;
            case 'profile': return <ProfilePage />;
            case 'notifications': return <NotificationsPage />;
            case 'examAttempt': return <ExamAttemptPage />;
            case 'news': return <NewsPage />;
            case 'newsDetail': return <NewsPostDetailPage />;
            case 'exams': return <ExamsPage />;
            case 'leaderboard': return <LeaderboardPage />;
            default: return isPreviewMode ? <CoursesPage /> : <DashboardPage />;
        }
    };
    
    const renderPopups = () => (
        <>
            {showPromotionPopup && <PromotionPopup onClose={handlePromotionClose} />}
            {showInstructionPopup && instructionContent && <InstructionPopup content={instructionContent} onAgree={handleInstructionAgree} />}
        </>
    );
    
    if (isAuthenticated && isAdmin && page === 'admin' && !isPreviewMode) {
        return (
            <>
                <AdminPage />
                <Notification />
                <PaymentModal />
                {renderPopups()}
                 {isAuthenticated && <IdleTimeoutModal isOpen={isIdleModalOpen} onClose={handleStayLoggedIn} onLogout={handleIdleLogout} />}
                 {confirmation && <ConfirmationModal isOpen={!!confirmation} onClose={handleCancel} onConfirm={handleConfirm} {...confirmation} />}
            </>
        );
    }
    
    if (page === 'lessonWatch' || page === 'examAttempt') {
        return (
             <>
                {renderPage()}
                {confirmation && <ConfirmationModal isOpen={!!confirmation} onClose={handleCancel} onConfirm={handleConfirm} {...confirmation} />}
             </>
        )
    }
    
    const showBottomNav = isAuthenticated && !isAdmin && !isInstructor && !['lessonWatch', 'examAttempt'].includes(page);

    return (
        <div className="min-h-screen flex flex-col bg-slate-900 font-sans">
            {isPreviewMode && (
                <div className="bg-yellow-500 text-slate-900 text-center py-1 font-bold text-sm sticky top-0 z-50">
                    PREVIEW MODE
                </div>
            )}
            <Header logoUrl={systemSettings?.logoUrl} />
            <main className="flex-grow container mx-auto px-4 py-8 pb-20 md:pb-8">
                {renderPage()}
            </main>
            <Footer />
            <Notification />
            <PaymentModal />
            {showBottomNav && <BottomNavBar />}
            {renderPopups()}
            {isAuthenticated && <IdleTimeoutModal isOpen={isIdleModalOpen} onClose={handleStayLoggedIn} onLogout={handleIdleLogout} />}
            {confirmation && <ConfirmationModal isOpen={!!confirmation} onClose={handleCancel} onConfirm={handleConfirm} {...confirmation} />}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppStoreProvider>
            <AppContent />
        </AppStoreProvider>
    );
};

export default App;
