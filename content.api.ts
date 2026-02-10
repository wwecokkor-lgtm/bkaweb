
import type { NewsPost, Notice, Comment, PostVersion } from './types';
import { mockNewsPosts, mockNotices, mockUsers, simulateDelay, logAdminAction, saveDB } from './db';

const generateSlug = (title: string) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

export const contentApi = {
    // --- News Post Management ---
    getNewsPosts: async (options: { page?: number, limit?: number, category?: string, tag?: string, sort?: 'date' | 'views', status?: string } = {}, isPreview: boolean = false): Promise<{ posts: NewsPost[], total: number }> => {
        await simulateDelay(300);
        let posts = mockNewsPosts.filter(p => !p.deletedAt);

        if (options.status) {
            // This is for admin panel tabs, it should work as is.
            posts = posts.filter(p => p.status === options.status);
        } else if (!isPreview) {
            // For live user-facing pages, only show published and currently active scheduled posts.
            posts = posts.filter(p => p.status === 'Published' && (!p.scheduledAt || new Date(p.scheduledAt) <= new Date()));
        }
        
        if (options.category && options.category !== 'All') {
            posts = posts.filter(p => p.category === options.category);
        }
        if (options.tag) {
            posts = posts.filter(p => p.tags?.includes(options.tag));
        }

        if (options.sort === 'views') {
            posts.sort((a, b) => b.viewCount - a.viewCount);
        } else {
            posts.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        const total = posts.length;
        const page = options.page || 1;
        const limit = options.limit || 6;
        const paginatedPosts = posts.slice((page - 1) * limit, page * limit);

        return { posts: paginatedPosts, total };
    },
    getTrashedNewsPosts: async (): Promise<NewsPost[]> => {
        await simulateDelay(300);
        return mockNewsPosts.filter(p => !!p.deletedAt);
    },
    getNewsPostById: async (id: string): Promise<NewsPost | undefined> => {
        await simulateDelay(200);
        return mockNewsPosts.find(p => p.id === id && !p.deletedAt);
    },
    createNewsPost: async (adminId: string, postData: Omit<NewsPost, 'id' | 'createdAt' | 'slug' | 'viewCount' | 'comments' | 'likes'>): Promise<{ success: boolean; post?: NewsPost; message: string }> => {
        await simulateDelay(1000);
        const newPost: NewsPost = {
            ...postData,
            id: `np${mockNewsPosts.length + 1}`,
            slug: generateSlug(postData.title),
            createdAt: new Date(),
            viewCount: 0,
            comments: [],
            likes: [],
            history: [],
        };
        mockNewsPosts.unshift(newPost);
        logAdminAction(adminId, `Created post: ${newPost.title}`, 'NewsPost', newPost.id);
        return { success: true, post: newPost, message: 'Post created successfully!' };
    },
    updateNewsPost: async (adminId: string, postId: string, postData: Partial<NewsPost>): Promise<{ success: boolean; post?: NewsPost; message: string }> => {
        await simulateDelay(1000);
        const postIndex = mockNewsPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return { success: false, message: 'Post not found.' };
        
        const originalPost = mockNewsPosts[postIndex];
        
        const oldVersion: PostVersion = {
            version: (originalPost.history?.length || 0) + 1,
            editedAt: new Date(),
            editedBy: adminId,
            content: {
                title: originalPost.title,
                subtitle: originalPost.subtitle,
                shortDescription: originalPost.shortDescription,
                longDescription: originalPost.longDescription,
                attachments: originalPost.attachments,
            }
        };

        const updatedPost = { 
            ...originalPost, 
            ...postData, 
            slug: postData.title ? generateSlug(postData.title) : originalPost.slug,
            history: [...(originalPost.history || []), oldVersion]
        };

        mockNewsPosts[postIndex] = updatedPost;
        
        logAdminAction(adminId, `Updated post: ${updatedPost.title}`, 'NewsPost', postId);
        return { success: true, post: updatedPost, message: 'Post updated successfully!' };
    },
    softDeleteNewsPost: async (adminId: string, postId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const postIndex = mockNewsPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return { success: false, message: 'Post not found.' };

        mockNewsPosts[postIndex].deletedAt = new Date();
        logAdminAction(adminId, `Trashed post: ${mockNewsPosts[postIndex].title}`, 'NewsPost', postId);
        return { success: true, message: 'Post moved to trash.' };
    },
    restoreNewsPost: async (adminId: string, postId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const postIndex = mockNewsPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return { success: false, message: 'Post not found.' };

        mockNewsPosts[postIndex].deletedAt = undefined;
        logAdminAction(adminId, `Restored post: ${mockNewsPosts[postIndex].title}`, 'NewsPost', postId);
        return { success: true, message: 'Post restored.' };
    },
    permanentlyDeleteNewsPost: async (adminId: string, postId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(800);
        const postIndex = mockNewsPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return { success: false, message: 'Post not found.' };
        
        const postTitle = mockNewsPosts[postIndex].title;
        mockNewsPosts.splice(postIndex, 1);
        
        logAdminAction(adminId, `Permanently deleted post: ${postTitle}`, 'NewsPost', postId);
        return { success: true, message: 'Post permanently deleted.' };
    },
    incrementNewsPostView: async (postId: string): Promise<void> => {
        await simulateDelay(50);
        const post = mockNewsPosts.find(p => p.id === postId);
        if (post) {
            post.viewCount += 1;
            saveDB();
        }
    },
    addCommentToNewsPost: async (postId: string, commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<{ success: boolean, post?: NewsPost, message: string }> => {
        await simulateDelay(500);
        const post = mockNewsPosts.find(p => p.id === postId);
        if (!post) return { success: false, message: 'Post not found.' };
        const newComment: Comment = { ...commentData, id: `c-${Date.now()}`, createdAt: new Date() };
        post.comments.push(newComment);
        saveDB();
        return { success: true, post, message: 'Comment added.' };
    },
    toggleLikePost: async (postId: string, userId: string): Promise<{ success: boolean, post?: NewsPost }> => {
        await simulateDelay(200);
        const post = mockNewsPosts.find(p => p.id === postId);
        if (!post) return { success: false };
        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
        } else {
            post.likes.push(userId);
        }
        saveDB();
        return { success: true, post };
    },
    toggleBookmarkPost: async (postId: string, userId: string): Promise<{ success: boolean, user?: any }> => {
        await simulateDelay(200);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) return { success: false };
        user.bookmarkedPostIds = user.bookmarkedPostIds || [];
        const bookmarkIndex = user.bookmarkedPostIds.indexOf(postId);
        if (bookmarkIndex > -1) {
            user.bookmarkedPostIds.splice(bookmarkIndex, 1);
        } else {
            user.bookmarkedPostIds.push(postId);
        }
        saveDB();
        return { success: true, user };
    },

    // --- Notice Management ---
    createNotice: async (adminId: string, noticeData: Omit<Notice, 'id' | 'createdAt'>): Promise<{ success: boolean; notice?: Notice; message: string }> => {
        await simulateDelay(500);
        const newNotice: Notice = { ...noticeData, id: `n${mockNotices.length + 1}`, createdAt: new Date() };
        mockNotices.unshift(newNotice);
        logAdminAction(adminId, `Created notice: ${newNotice.title}`, 'Notice', newNotice.id);
        return { success: true, notice: newNotice, message: 'Notice created successfully!' };
    },
    updateNotice: async (adminId: string, noticeId: string, noticeData: Partial<Notice>): Promise<{ success: boolean; notice?: Notice; message: string }> => {
        await simulateDelay(500);
        const noticeIndex = mockNotices.findIndex(n => n.id === noticeId);
        if (noticeIndex === -1) return { success: false, message: 'Notice not found.' };
        mockNotices[noticeIndex] = { ...mockNotices[noticeIndex], ...noticeData };
        logAdminAction(adminId, `Updated notice: ${mockNotices[noticeIndex].title}`, 'Notice', noticeId);
        return { success: true, notice: mockNotices[noticeIndex], message: 'Notice updated successfully!' };
    },
    deleteNotice: async (adminId: string, noticeId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const noticeIndex = mockNotices.findIndex(n => n.id === noticeId);
        if (noticeIndex === -1) { return { success: false, message: 'Notice not found.' }; }
        const notice = mockNotices[noticeIndex];
        mockNotices.splice(noticeIndex, 1);
        logAdminAction(adminId, `Deleted notice: ${notice.title}`, 'Notice', noticeId);
        return { success: true, message: 'Notice deleted successfully.' };
    },
};
