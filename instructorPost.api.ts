
import type { InstructorPost, InstructorPostComment } from './types';
import { mockInstructorPosts, mockUsers, simulateDelay, logAdminAction, saveDB } from './db';
import { Role } from './types';

export const instructorPostApi = {
    getInstructorPosts: async (authorId: string): Promise<InstructorPost[]> => {
        await simulateDelay(300);
        return mockInstructorPosts.filter(p => p.authorId === authorId && !p.deletedAt).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    getAllInstructorPosts: async (): Promise<InstructorPost[]> => {
        await simulateDelay(300);
        return [...mockInstructorPosts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    createInstructorPost: async (authorId: string, postData: Omit<InstructorPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'viewCount' | 'authorId'>): Promise<{ success: boolean; post?: InstructorPost; message: string }> => {
        await simulateDelay(800);
        const newPost: InstructorPost = {
            ...postData,
            id: `ip-${Date.now()}`,
            authorId,
            createdAt: new Date(),
            updatedAt: new Date(),
            likes: [],
            comments: [],
            viewCount: 0,
            status: 'Draft', // All new posts are drafts by default
        };
        mockInstructorPosts.unshift(newPost);
        saveDB();
        return { success: true, post: newPost, message: 'Post saved as draft.' };
    },

    updateInstructorPost: async (authorId: string, postId: string, postData: Partial<InstructorPost>): Promise<{ success: boolean; post?: InstructorPost; message: string }> => {
        await simulateDelay(800);
        const postIndex = mockInstructorPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return { success: false, message: 'Post not found.' };

        const existingPost = mockInstructorPosts[postIndex];
        if (existingPost.authorId !== authorId) {
            return { success: false, message: 'You do not have permission to edit this post.' };
        }

        // Instructors cannot change status directly, only admins can.
        const { status, ...restOfData } = postData;

        mockInstructorPosts[postIndex] = { ...existingPost, ...restOfData, updatedAt: new Date() };
        saveDB();
        return { success: true, post: mockInstructorPosts[postIndex], message: 'Post updated successfully.' };
    },
    
    updateInstructorPostStatus: async (adminId: string, postId: string, status: 'Published' | 'Draft'): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(400);
        const postIndex = mockInstructorPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return { success: false, message: 'Post not found.' };

        mockInstructorPosts[postIndex].status = status;
        logAdminAction(adminId, `Set status of post ${postId} to ${status}`, 'InstructorPost', postId);
        return { success: true, message: `Post status updated to ${status}.` };
    },

    deleteInstructorPost: async (userId: string, postId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const user = mockUsers.find(u => u.id === userId);
        const postIndex = mockInstructorPosts.findIndex(p => p.id === postId);

        if (postIndex === -1) return { success: false, message: 'Post not found.' };
        
        const post = mockInstructorPosts[postIndex];
        const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

        if (post.authorId !== userId && !isAdmin) {
            return { success: false, message: 'You do not have permission to delete this post.' };
        }

        mockInstructorPosts.splice(postIndex, 1);
        logAdminAction(userId, `Deleted instructor post: ${post.title}`, 'InstructorPost', postId);
        return { success: true, message: 'Post deleted successfully.' };
    }
};
