
import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { NewsPost } from './types';
import { Card, Button, Spinner } from './commonComponents';

const NewsCard: React.FC<{ post: NewsPost }> = ({ post }) => {
    const { selectNewsPost } = useAppStore();
    const firstAttachment = post.attachments?.[0];
    let thumbnailUrl = 'https://picsum.photos/seed/news/400/225'; // Default
    if (firstAttachment) {
        if ('type' in firstAttachment && firstAttachment.type === 'youtube') {
            thumbnailUrl = firstAttachment.thumbnailUrl;
        } else if ('type' in firstAttachment && firstAttachment.type === 'image') {
            thumbnailUrl = firstAttachment.url;
        }
    }

    return (
        <Card className="flex flex-col hover:border-sky-500 transition-colors duration-300 group">
            <div className="relative">
                <img src={thumbnailUrl} alt={post.title} className="w-full h-40 object-cover rounded-t-lg mb-4" loading="lazy" />
                {post.isPinned && <span className="absolute top-2 right-2 bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">PINNED</span>}
                {post.status !== 'Published' && <span className="absolute top-2 left-2 bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">{post.status.toUpperCase()}</span>}
            </div>
            <div className="flex-grow">
                <span className="text-xs font-semibold bg-sky-500/20 text-sky-400 px-2 py-1 rounded-full">{post.category}</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-1 group-hover:text-sky-400 transition-colors">{post.title}</h3>
                <p className="text-slate-400 text-sm mb-4 h-20 overflow-hidden">{post.shortDescription}</p>
            </div>
            <div className="flex items-center justify-between mt-2 border-t border-slate-700 pt-4">
                <div className="text-sm text-slate-500">
                    <p>{new Date(post.createdAt).toLocaleDateString()}</p>
                    <p>{post.viewCount} views</p>
                </div>
                <Button onClick={() => selectNewsPost(post.id)}>Read More</Button>
            </div>
        </Card>
    );
};


const NewsPage: React.FC = () => {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isPreviewMode } = useAppStore();

    useEffect(() => {
        api.getNewsPosts({ limit: 100 }, isPreviewMode).then(data => {
            setPosts(data.posts);
            setIsLoading(false);
        });
    }, [isPreviewMode]);

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">News & Announcements</h1>
                <p className="text-slate-400 mt-2">Stay updated with the latest news from BK Academy.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center"><Spinner /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.length > 0 ? posts.map(post => (
                        <NewsCard key={post.id} post={post} />
                    )) : <p className="text-slate-400 col-span-full text-center">No news posts available at the moment.</p>}
                </div>
            )}
        </div>
    );
};

export default NewsPage;
