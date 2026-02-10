
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { NotificationType } from './types';
import type { User, Page, NotificationMessage, Course } from './types';
import { api } from './api';

interface Session {
    user: User;
    sessionId: string;
}

interface ConfirmationAction {
    title: string;
    message: string;
    actionType: 'danger' | 'warning';
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
}

interface NavState {
    page: Page;
    id?: string;
}

interface AppState {
    isAuthenticated: boolean;
    user: User | null;
    sessionId: string | null;
    page: Page;
    notifications: NotificationMessage[];
    selectedCourseId: string | null;
    selectedLessonId: string | null;
    selectedExamId: string | null;
    selectedNewsPostId: string | null;
    isPaymentModalOpen: boolean;
    courseForPayment: Course | null;
    searchTerm: string;
    fontPreference: string;
    isPreviewMode: boolean;
    setIsPreviewMode: (isPreview: boolean) => void;
    startPreviewSession: (previewUser: User) => void;
    setFontPreference: (fontClass: string) => void;
    setSearchTerm: (term: string) => void;
    login: (session: Session) => void;
    logout: () => void;
    setPage: (page: Page) => void;
    selectCourse: (courseId: string) => void;
    selectNewsPost: (postId: string) => void;
    startExam: (examId: string) => void;
    startLesson: (courseId: string, lessonId: string) => void;
    addNotification: (message: string, type: NotificationType) => void;
    removeNotification: (id: number) => void;
    updateUser: (updatedUser: Partial<User>) => void;
    openPaymentModal: (course: Course) => void;
    closePaymentModal: () => void;
    confirmation: ConfirmationAction | null;
    showConfirmation: (action: ConfirmationAction) => void;
    hideConfirmation: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);
const logoutChannel = new BroadcastChannel('bk-academy-logout');

const getInitialNavState = (): NavState => {
    try {
        const navStateJSON = localStorage.getItem('bk-academy-nav-state');
        if (navStateJSON) {
            return JSON.parse(navStateJSON);
        }
    } catch (e) {
        console.error("Failed to parse nav state", e);
    }
    return { page: 'login' };
};

export const AppStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const initialNavState = getInitialNavState();
    const [page, _setPage] = useState<Page>(initialNavState.page);
    const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialNavState.id && initialNavState.page === 'courseDetail' ? initialNavState.id : null);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [selectedNewsPostId, setSelectedNewsPostId] = useState<string | null>(initialNavState.id && initialNavState.page === 'newsDetail' ? initialNavState.id : null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [courseForPayment, setCourseForPayment] = useState<Course | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [fontPreference, _setFontPreference] = useState(localStorage.getItem('bk-academy-font') || 'font-noto-bengali');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [confirmation, setConfirmation] = useState<ConfirmationAction | null>(null);
    
    const showConfirmation = useCallback((action: ConfirmationAction) => setConfirmation(action), []);
    const hideConfirmation = useCallback(() => setConfirmation(null), []);

    const setPage = useCallback((newPage: Page) => {
        _setPage(newPage);
        if (newPage !== 'login' && newPage !== 'register') {
             localStorage.setItem('bk-academy-nav-state', JSON.stringify({ page: newPage }));
        }
    }, []);
    
    const setFontPreference = useCallback((fontClass: string) => {
        _setFontPreference(fontClass);
        localStorage.setItem('bk-academy-font', fontClass);
    }, []);

    const removeNotification = useCallback((id: number) => { setNotifications(prev => prev.filter(n => n.id !== id)); }, []);
    const addNotification = useCallback((message: string, type: NotificationType) => { const id = Date.now(); setNotifications(prev => [...prev, { id, message, type }]); setTimeout(() => removeNotification(id), 5000); }, [removeNotification]);

    const login = useCallback((sessionData: Session) => {
        setIsAuthenticated(true);
        setUser(sessionData.user);
        setSessionId(sessionData.sessionId);
        localStorage.setItem('bk-academy-session', JSON.stringify(sessionData));
        const navState = getInitialNavState();
        _setPage(navState.page === 'login' || navState.page === 'register' ? 'dashboard' : navState.page);
    }, []);
    
    const logout = useCallback(() => {
        if (user && sessionId) {
            api.logout(user.id, sessionId).catch(e => console.error("Logout API call failed", e));
        }
        setIsAuthenticated(false);
        setUser(null);
        setSessionId(null);
        localStorage.removeItem('bk-academy-session');
        localStorage.removeItem('bk-academy-nav-state');
        logoutChannel.postMessage('logout');
        setPage('login');
        addNotification('You have been successfully logged out.', NotificationType.SUCCESS);
        if (isPreviewMode) {
            window.location.replace('/');
        }
    }, [user, sessionId, isPreviewMode, setPage, addNotification]);
    
    useEffect(() => {
        try {
            const savedSession = localStorage.getItem('bk-academy-session');
            if (savedSession) {
                const sessionData: Session = JSON.parse(savedSession);
                if (sessionData.user && sessionData.sessionId) {
                    login(sessionData);
                }
            }
        } catch (e) { console.error("Failed to restore session", e); localStorage.removeItem('bk-academy-session'); }
    }, [login]);

    useEffect(() => {
        const handleLogoutMessage = (event: MessageEvent) => { if (event.data === 'logout' && isAuthenticated) { setIsAuthenticated(false); setUser(null); setSessionId(null); setPage('login'); addNotification("You have been logged out from another tab.", NotificationType.INFO); } };
        logoutChannel.addEventListener('message', handleLogoutMessage);
        return () => logoutChannel.removeEventListener('message', handleLogoutMessage);
    }, [isAuthenticated, addNotification, setPage]);

    const updateUser = useCallback((updatedUser: Partial<User>) => {
        setUser(prevUser => {
            const newUser = prevUser ? { ...prevUser, ...updatedUser } : null;
            const session = localStorage.getItem('bk-academy-session');
            if (session && newUser) { try { const sessionData: Session = JSON.parse(session); sessionData.user = newUser; localStorage.setItem('bk-academy-session', JSON.stringify(sessionData)); } catch (e) { console.error("Failed to update session in localStorage", e); } }
            return newUser;
        });
    }, []);

    const selectCourse = useCallback((courseId: string) => { setSelectedCourseId(courseId); setPage('courseDetail'); localStorage.setItem('bk-academy-nav-state', JSON.stringify({ page: 'courseDetail', id: courseId })); }, [setPage]);
    const selectNewsPost = useCallback((postId: string) => { setSelectedNewsPostId(postId); setPage('newsDetail'); localStorage.setItem('bk-academy-nav-state', JSON.stringify({ page: 'newsDetail', id: postId })); }, [setPage]);
    const startExam = useCallback((examId: string) => { setSelectedExamId(examId); setPage('examAttempt'); }, [setPage]);
    const startLesson = useCallback((courseId: string, lessonId: string) => { setSelectedCourseId(courseId); setSelectedLessonId(lessonId); setPage('lessonWatch'); }, [setPage]);
    const openPaymentModal = useCallback((course: Course) => { setCourseForPayment(course); setIsPaymentModalOpen(true); }, []);
    const closePaymentModal = useCallback(() => { setIsPaymentModalOpen(false); setCourseForPayment(null); }, []);
    
    const startPreviewSession = useCallback((previewUser: User) => { setIsAuthenticated(true); setUser(previewUser); setIsPreviewMode(true); setPage('dashboard'); }, [setPage]);

    const value = { isAuthenticated, user, sessionId, page, notifications, selectedCourseId, selectedLessonId, selectedExamId, selectedNewsPostId, isPaymentModalOpen, courseForPayment, searchTerm, setSearchTerm, login, logout, setPage, selectCourse, selectNewsPost, startExam, startLesson, addNotification, removeNotification, updateUser, openPaymentModal, closePaymentModal, fontPreference, setFontPreference, isPreviewMode, setIsPreviewMode, startPreviewSession, confirmation, showConfirmation, hideConfirmation, };

    return React.createElement(AppContext.Provider, { value: value }, children);
};

export const useAppStore = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useAppStore must be used within an AppStoreProvider');
    return context;
};
