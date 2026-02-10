
import type { User, AuthResponse, ActiveSession, Instructor } from './types';
import { Role } from './types';
import { mockUsers, mockInstructors, simulateDelay, systemSettings, logAdminAction, saveDB } from './db';

const getDummyIp = () => `103.12.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
const getDummyUserAgent = () => {
    const agents = ['Chrome/108.0.0.0 Safari/537.36', 'Firefox/107.0', 'Edge/108.0.1462.46'];
    return agents[Math.floor(Math.random() * agents.length)];
}

export const authApi = {
    login: async (email: string, password_unused: string): Promise<AuthResponse> => {
        await simulateDelay(500);
        const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) return { success: false, message: 'Invalid credentials.' };
        if (user.status === 'Banned' || user.status === 'Suspended') {
            return { success: false, message: `Your account is currently ${user.status}. Please contact support.` };
        }
        // Allow pending instructors to log in to see the pending page
        if (user.status === 'Pending' && user.role !== Role.INSTRUCTOR) {
            return { success: false, message: `Your account is pending approval.` };
        }

        user.role = user.email.toLowerCase() === 'fffgamer066@gmail.com' ? Role.SUPER_ADMIN : user.role;
        user.lastLoginAt = new Date();
        
        // --- Session Management ---
        const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const newSession: ActiveSession = {
            sessionId,
            ipAddress: getDummyIp(),
            userAgent: getDummyUserAgent(),
            loggedInAt: new Date(),
        };

        if (systemSettings.singleDeviceLogin) {
            user.activeSessions = [newSession];
        } else {
            user.activeSessions = [...(user.activeSessions || []), newSession];
        }
        user.currentSessionId = sessionId;
        
        saveDB();
        return { success: true, user: { ...user, isFirstVisit: false }, sessionId, message: 'Login successful!' };
    },

    logout: async (userId: string, sessionId: string): Promise<{ success: boolean }> => {
        await simulateDelay(100);
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
            user.activeSessions = user.activeSessions?.filter(s => s.sessionId !== sessionId);
            if (user.currentSessionId === sessionId) {
                user.currentSessionId = undefined;
            }
        }
        saveDB();
        return { success: true };
    },

    logoutFromOtherDevices: async (userId: string, currentSessionId: string): Promise<AuthResponse> => {
        await simulateDelay(500);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found.' };

        const currentSession = user.activeSessions?.find(s => s.sessionId === currentSessionId);
        if (!currentSession) return { success: false, message: 'Current session is invalid.' };

        user.activeSessions = [currentSession];
        user.currentSessionId = currentSessionId;

        logAdminAction(userId, 'Logged out from all other devices', 'User', userId);

        return { success: true, user: { ...user }, sessionId: currentSessionId, message: 'Successfully logged out from other devices.' };
    },

    verifySession: async (userId: string, sessionId: string): Promise<{ valid: boolean; reason?: string }> => {
        await simulateDelay(150);
        const user = mockUsers.find(u => u.id === userId);
        if (!user || user.currentSessionId !== sessionId) {
            return { valid: false, reason: 'new_device' };
        }
        return { valid: true };
    },
    
    register: async (formData: any): Promise<{ success: boolean; user?: User; message: string }> => {
        await simulateDelay(1000);
        if (mockUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
            return { success: false, message: 'An account with this email already exists.' };
        }
        
        const newUser: User = {
            id: String(mockUsers.length + 1),
            username: formData.fullName,
            email: formData.email,
            role: Role.USER,
            avatarUrl: formData.avatarUrl || 'https://picsum.photos/seed/newuser/200',
            createdAt: new Date(),
            enrolledCourseIds: [],
            wishlistCourseIds: [],
            status: 'Active',
            agreementStatus: 'Not Agreed',
            isFirstVisit: true,
            phone: formData.phone,
            dob: formData.dob,
            gender: formData.gender,
            grade: formData.grade,
            school: formData.school,
            medium: formData.medium,
            address: formData.address,
            coins: 0,
            coinTransactions: [],
            badges: [],
            activeSessions: [],
        };
        
        mockUsers.push(newUser);
        saveDB();
        return { success: true, user: newUser, message: 'Registration successful! Welcome to BK Academy.' };
    },

    registerInstructorApplication: async (formData: any): Promise<AuthResponse> => {
        await simulateDelay(1500);
        if (mockUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
            return { success: false, message: 'An account with this email already exists.' };
        }

        const newUser: User = {
            id: String(mockUsers.length + 1),
            username: formData.fullName,
            email: formData.email,
            role: Role.INSTRUCTOR,
            avatarUrl: formData.avatarUrl || 'https://picsum.photos/seed/new-instructor/200',
            createdAt: new Date(),
            status: 'Pending',
            phone: formData.phone,
            enrolledCourseIds: [],
            wishlistCourseIds: [],
            agreementStatus: 'Not Agreed',
            isFirstVisit: true,
            coins: 0,
            coinTransactions: [],
            badges: [],
            activeSessions: [],
        };

        const newInstructorProfile: Instructor = {
            id: `i-prof-${newUser.id}`,
            name: newUser.username,
            email: newUser.email,
            phone: newUser.phone,
            photoUrl: newUser.avatarUrl,
            status: 'Inactive',
            isVerified: false,
            title: `Instructor (${formData.expertise})`,
            degrees: '',
            experience: `${formData.experienceYears} years`,
            bio: formData.bio,
            slides: [],
            expertise: formData.expertise,
            experienceYears: Number(formData.experienceYears),
            languages: formData.languages,
            portfolioUrl: formData.portfolioUrl,
        };
        
        mockInstructors.push(newInstructorProfile);
        newUser.instructorProfileId = newInstructorProfile.id;
        mockUsers.push(newUser);

        // Log in the user to show the pending page
        const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        newUser.currentSessionId = sessionId;
        newUser.activeSessions = [{ sessionId, ipAddress: getDummyIp(), userAgent: getDummyUserAgent(), loggedInAt: new Date() }];

        saveDB();
        return { success: true, user: newUser, sessionId, message: 'Your application has been submitted for review.' };
    },
};
