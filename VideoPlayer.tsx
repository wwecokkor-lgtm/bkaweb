
import React from 'react';
import type { User } from './types';

interface VideoPlayerProps {
    src: string; // YouTube URL
    user: User | null;
    onProgress: (progress: number) => void;
    onComplete: () => void;
    initialProgress: number;
}


const getYouTubeID = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, user }) => {
    const videoId = getYouTubeID(src);
    const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!videoId) {
        return <div className="w-full h-full bg-black flex items-center justify-center text-red-400 p-4 text-center">Invalid or missing YouTube URL provided for this lesson.</div>;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`;

    return (
        <div className="relative w-full h-full bg-black">
            <iframe
                src={embedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
            ></iframe>
            
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="text-white/10 text-lg md:text-2xl font-bold transform -rotate-15 select-none">
                    {user?.email} - {currentTime}
                </span>
            </div>
        </div>
    );
};

export default VideoPlayer;
