
import type { User, UserStatus, ExamAttempt, UserActivity } from './types';
import { Role } from './types';
import { mockUsers, mockInstructors, simulateDelay, logAdminAction, mockExamAttempts, mockUserActivities, saveDB } from './db';

export const userApi = {
    getUsers: async (includeDeleted: boolean = false): Promise<User[]> => {
        await simulateDelay(300);
        if (includeDeleted) return [...mockUsers];
        return [...mockUsers.filter(u => !u.deletedAt)];
    },
    updateUserStatus: async (adminId: string, userId: string, status: UserStatus, reason?: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found.' };
        if (user.role === Role.SUPER_ADMIN) return { success: false, message: 'Cannot change the status of a Super Admin.' };
        user.status = status;
        user.statusReason = reason;

        // Instructor approval logic
        if (user.role === Role.INSTRUCTOR && user.instructorProfileId && status === 'Active') {
            const instructorProfile = mockInstructors.find(i => i.id === user.instructorProfileId);
            if (instructorProfile) {
                instructorProfile.isVerified = true;
                instructorProfile.status = 'Active';
            }
        }
        
        logAdminAction(adminId, `Updated status of ${user.username} to ${status}`, 'User', userId);
        return { success: true, message: `User status updated to ${status}.` };
    },
    updateUserRole: async (adminId: string, userId: string, role: Role): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const adminUser = mockUsers.find(u => u.id === adminId);
        const targetUser = mockUsers.find(u => u.id === userId);

        if (!adminUser || !targetUser) return { success: false, message: 'User not found.' };
        
        if (targetUser.role === Role.SUPER_ADMIN && adminUser.role !== Role.SUPER_ADMIN) {
             return { success: false, message: 'Only a Super Admin can modify another Super Admin.' };
        }
        if (role === Role.SUPER_ADMIN && adminUser.role !== Role.SUPER_ADMIN) {
            return { success: false, message: 'You do not have permission to assign Super Admin role.'};
        }

        targetUser.role = role;
        logAdminAction(adminId, `Updated role of ${targetUser.username} to ${role}`, 'User', userId);
        return { success: true, message: `User role updated to ${role}.` };
    },
    softDeleteUser: async (adminId: string, userId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found.' };
        if (user.role === Role.SUPER_ADMIN) return { success: false, message: 'Super Admin cannot be deleted.' };
        user.deletedAt = new Date();
        logAdminAction(adminId, `Moved user to trash: ${user.username}`, 'User', userId);
        return { success: true, message: 'User moved to trash.' };
    },
    restoreUser: async (adminId: string, userId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found.' };
        user.deletedAt = undefined;
        logAdminAction(adminId, `Restored user: ${user.username}`, 'User', userId);
        return { success: true, message: 'User restored successfully.' };
    },
    permanentlyDeleteUser: async (adminId: string, userId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(1000);
        const userIndex = mockUsers.findIndex(u => u.id === userId);
        if (userIndex === -1) return { success: false, message: 'User not found.' };
        const username = mockUsers[userIndex].username;
        // In a real DB, you might anonymize related data (orders, comments) instead of cascading deletes.
        mockUsers.splice(userIndex, 1);
        logAdminAction(adminId, `Permanently deleted user: ${username}`, 'User', userId);
        return { success: true, message: 'User permanently deleted.' };
    },
    forceLogoutUser: async (adminId: string, userIdToLogout: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const user = mockUsers.find(u => u.id === userIdToLogout);
        if (!user) return { success: false, message: 'User not found.' };
        if (user.role === Role.SUPER_ADMIN) return { success: false, message: 'Cannot force logout a Super Admin.' };
        
        user.currentSessionId = undefined;
        user.activeSessions = [];
        logAdminAction(adminId, `Forced logout for user: ${user.username}`, 'User', userIdToLogout);
        return { success: true, message: `User ${user.username} has been logged out from all devices.` };
    },
    updateUserAgreement: async (userId: string, version: string): Promise<{ success: boolean; user?: User; message: string }> => {
        await simulateDelay(500);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found.' };
        user.agreementStatus = 'Agreed';
        user.agreementTimestamp = new Date();
        user.agreedInstructionVersion = version;
        user.isFirstVisit = false;
        saveDB();
        return { success: true, user, message: 'Agreement accepted.' };
    },
    toggleWishlist: async (userId: string, courseId: string): Promise<{ success: boolean; user?: User; message: string }> => {
        await simulateDelay(300);
        const user = mockUsers.find(u => u.id === userId);
        if(!user) return { success: false, message: 'User not found.' };
        const index = user.wishlistCourseIds.indexOf(courseId);
        if (index > -1) {
            user.wishlistCourseIds.splice(index, 1);
            saveDB();
            return { success: true, user, message: 'Removed from wishlist.' };
        }  else {
            user.wishlistCourseIds.push(courseId);
            saveDB();
            return { success: true, user, message: 'Added to wishlist!' };
        }
    },
    toggleBookmarkPost: async (userId: string, postId: string): Promise<{ success: boolean; user?: User; message: string }> => {
        await simulateDelay(200);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found.' };
        user.bookmarkedPostIds = user.bookmarkedPostIds || [];
        const bookmarkIndex = user.bookmarkedPostIds.indexOf(postId);
        let message;
        if (bookmarkIndex > -1) {
            user.bookmarkedPostIds.splice(bookmarkIndex, 1);
            message = 'Post removed from bookmarks.';
        } else {
            user.bookmarkedPostIds.push(postId);
            message = 'Post bookmarked!';
        }
        saveDB();
        return { success: true, user: {...user}, message };
    },
    getExamAttemptsForUser: async (userId: string): Promise<ExamAttempt[]> => {
        await simulateDelay(400);
        return mockExamAttempts.filter(att => att.userId === userId).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    },
    getUserActivity: async (userId: string): Promise<UserActivity[]> => {
        await simulateDelay(300);
        return [...mockUserActivities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    exportUserData: async (userId: string): Promise<{ success: boolean, data?: string, message: string }> => {
        await simulateDelay(700);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found.' };
        const userData = {
            profile: { id: user.id, username: user.username, email: user.email, phone: user.phone, createdAt: user.createdAt },
            enrollments: user.enrolledCourseIds,
            // In real app, fetch orders, exam attempts etc.
        };
        return { success: true, data: JSON.stringify(userData, null, 2), message: "User data prepared for export." };
    },
};
