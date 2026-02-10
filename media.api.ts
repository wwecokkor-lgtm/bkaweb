
import type { Media, YouTubeVideo } from './types';
import { mockMedia, simulateDelay, logAdminAction, saveDB } from './db';

export const mediaApi = {
    getMedia: async (): Promise<Media[]> => {
        await simulateDelay(200);
        return [...mockMedia];
    },
    uploadMedia: async (file: File, userId: string): Promise<{ success: boolean; media?: Media; message: string }> => {
        await simulateDelay(1500); // Simulate chunked upload time
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) return { success: false, message: 'Invalid file type. Only JPG, PNG, PDF allowed.' };
        
        // No client-side size limit, as requested
        
        const newMedia: Media = { 
            id: `m-${Date.now()}`, 
            url: URL.createObjectURL(file), 
            type: file.type.startsWith('image') ? 'image' : 'pdf', 
            caption: file.name, 
            uploadedAt: new Date(),
            fileName: file.name,
            fileSize: file.size,
            uploadedByUserId: userId,
            status: 'Pending', // All new uploads require approval
        };
        mockMedia.unshift(newMedia);
        saveDB();
        return { success: true, media: newMedia, message: 'File uploaded and is awaiting approval.' };
    },
    updateMediaStatus: async (adminId: string, mediaId: string, status: 'Approved' | 'Rejected'): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const mediaIndex = mockMedia.findIndex(m => m.id === mediaId);
        if (mediaIndex === -1) return { success: false, message: 'Media not found.' };

        mockMedia[mediaIndex].status = status;
        logAdminAction(adminId, `${status} media file: ${mockMedia[mediaIndex].fileName}`, 'Media', mediaId);
        return { success: true, message: `Media has been ${status.toLowerCase()}.` };
    },
    deleteMedia: async (adminId: string, mediaId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const mediaIndex = mockMedia.findIndex(m => m.id === mediaId);
        if (mediaIndex === -1) return { success: false, message: 'Media not found.' };
        // FIX: Mutate the array in place using splice instead of reassigning the imported variable.
        mockMedia.splice(mediaIndex, 1);
        logAdminAction(adminId, 'Deleted media', 'Media', mediaId);
        return { success: true, message: 'Media deleted.' };
    },
    getYouTubeVideoDetails: async (url: string): Promise<{ success: boolean, video?: YouTubeVideo, message: string }> => {
        await simulateDelay(800);
        const videoIdRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(videoIdRegex);
        if (!match || !match[1]) return { success: false, message: "Invalid YouTube URL." };
        const videoId = match[1];
        const video: YouTubeVideo = {
            id: `yt-${videoId}`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            title: `YouTube Video (${videoId})`,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            type: 'youtube',
        };
        return { success: true, video, message: "Video details fetched." };
    },
    uploadPhoto: async (file: File): Promise<{ success: boolean; url?: string; message: string }> => {
        await simulateDelay(1000);
        if (file && file.type.startsWith('image/')) {
            // No size limit here for profile pics, thumbnails, etc.
            // These are considered 'auto-approved' for simplicity.
            return { success: true, url: URL.createObjectURL(file), message: 'Photo uploaded!' };
        }
        return { success: false, message: 'Invalid file type.' };
    },
};
