
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Course, Lesson, Comment, LessonResource } from './types';
import { Card, Button, Spinner, Badge } from './commonComponents';
import { NotificationType } from './types';
import VideoPlayer from './VideoPlayer';
import { linkify } from './linkify';

const LessonWatchingPage: React.FC = () => {
    const { user, selectedCourseId, selectedLessonId, startLesson, setPage, addNotification, updateUser } = useAppStore();
    
    const [course, setCourse] = useState<Course | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    
    const isEnrolled = useMemo(() => user?.enrolledCourseIds.includes(selectedCourseId || ''), [user, selectedCourseId]);
    const DRAFT_KEY = useMemo(() => `comment-draft-lesson-${activeLesson?.id}`, [activeLesson]);

    useEffect(() => {
        if (activeLesson) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                setCommentText(savedDraft);
            }
        }
    }, [activeLesson, DRAFT_KEY]);

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setCommentText(newText);
        localStorage.setItem(DRAFT_KEY, newText);
    };

    const fetchLessonData = useCallback(() => {
        if (selectedCourseId && selectedLessonId) {
            setIsLoading(true);
            api.getCourseById(selectedCourseId).then(courseData => {
                if (courseData) {
                    setCourse(courseData);
                    const lesson = courseData.lessons.find(l => l.id === selectedLessonId);
                    setActiveLesson(lesson || null);
                }
                setIsLoading(false);
            });
        }
    }, [selectedCourseId, selectedLessonId]);

    useEffect(fetchLessonData, [fetchLessonData]);
    
    // --- Security Features ---
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === 'c' || e.key === 's' || e.key === 'u')) e.preventDefault();
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) e.preventDefault();
        };
        
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleLessonClick = (lessonId: string) => {
        if (selectedCourseId) startLesson(selectedCourseId, lessonId);
    };

    const handleToggleLike = async () => {
        if (user && activeLesson) {
            const res = await api.toggleLikeLesson(user.id, activeLesson.id);
            if (res.success && res.lesson) {
                setActiveLesson(res.lesson);
            }
        }
    };

    const handleCommentSubmit = async () => {
        if (!user || !activeLesson || !commentText.trim()) return;
        setIsSubmittingComment(true);
        const res = await api.addCommentToLesson(activeLesson.id, {
            userId: user.id, username: user.username, avatarUrl: user.avatarUrl, content: commentText
        });
        if (res.success && res.lesson) {
            setActiveLesson(res.lesson);
            setCommentText('');
            localStorage.removeItem(DRAFT_KEY);
            addNotification('Comment posted!', NotificationType.SUCCESS);
        } else {
            addNotification(res.message, NotificationType.ERROR);
        }
        setIsSubmittingComment(false);
    };
    
    const handleProgressUpdate = (progress: number) => {
        if (user && activeLesson && !user.lessonProgress?.[activeLesson.id]?.completed) {
            api.updateLessonProgress(user.id, activeLesson.id, progress).then(res => {
                if(res.success && res.user) updateUser(res.user);
            });
        }
    };
    
    const handleLessonComplete = () => {
        if (user && activeLesson && !user.lessonProgress?.[activeLesson.id]?.completed) {
            api.markLessonAsComplete(user.id, activeLesson.id).then(res => {
                if(res.success && res.user) {
                    updateUser(res.user);
                    addNotification(`Lesson "${activeLesson.title}" completed!`, NotificationType.SUCCESS);
                }
            });
        }
    };

    if (!isEnrolled && !activeLesson?.isFree) {
        return <div className="p-8 text-center"><h2 className="text-2xl font-bold text-red-400">Access Denied</h2><p className="text-slate-300 mt-2">You must be enrolled in this course to view this lesson.</p><Button onClick={() => setPage('dashboard')} className="mt-4">Back to Dashboard</Button></div>
    }
    
    if (isLoading || !course || !activeLesson) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    
    const isLiked = user ? activeLesson.likes.includes(user.id) : false;
    const isCompleted = user ? user.lessonProgress?.[activeLesson.id]?.completed : false;

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-slate-200" style={{ userSelect: 'none' }}>
            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <div className="bg-black relative aspect-video">
                    <VideoPlayer 
                        src={activeLesson.contentUrl} 
                        user={user} 
                        onProgress={handleProgressUpdate}
                        onComplete={handleLessonComplete}
                        initialProgress={user?.lessonProgress?.[activeLesson.id]?.progress || 0}
                    />
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{activeLesson.title}</h1>
                            <p className="text-slate-400">From: {course.title}</p>
                        </div>
                        <Button onClick={handleToggleLike} variant={isLiked ? 'primary' : 'secondary'}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.562 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                            {activeLesson.likes.length}
                        </Button>
                    </div>

                    {/* Resources */}
                    {activeLesson.resources.length > 0 && <Card>
                        <h2 className="text-xl font-bold mb-3">Resources for this lesson</h2>
                        <div className="space-y-2">{activeLesson.resources.map(res => (
                            <a href={res.url} target="_blank" rel="noopener noreferrer" key={res.id} className="flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg">
                                <span className="text-white font-medium">{res.title}</span>
                                <Badge color="sky">{res.type}</Badge>
                            </a>
                        ))}</div>
                    </Card>}

                    {/* Comments */}
                    <Card><h2 className="text-xl font-bold mb-4">Comments ({activeLesson.comments.length})</h2><div className="space-y-4">
                        <div className="flex items-start gap-3"><img src={user?.avatarUrl} alt="you" className="w-9 h-9 rounded-full" /><div className="flex-grow space-y-2"><textarea value={commentText} onChange={handleCommentChange} placeholder="Ask a question or leave a comment..." rows={3} className="w-full bg-slate-700 border-slate-600 rounded-md p-2 text-sm" /> <Button onClick={handleCommentSubmit} isLoading={isSubmittingComment} size="sm">Post</Button></div></div>
                        {activeLesson.comments.map(c => (
                            <div key={c.id} className="flex items-start gap-3"><img src={c.avatarUrl} alt={c.username} className="w-9 h-9 rounded-full" /><div className="flex-grow bg-slate-800/60 p-3 rounded-lg"><p className="font-semibold text-sm text-white">{c.username}</p><p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{linkify(c.content)}</p></div></div>
                        ))}
                    </div></Card>
                </div>
            </main>

            {/* Lesson Playlist Sidebar */}
            <aside className="w-full lg:w-80 border-t lg:border-l border-slate-700 flex-shrink-0 flex flex-col">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="font-bold text-white">Course Content</h2>
                    <Button variant="secondary" size="sm" onClick={() => setPage('dashboard')}>Exit Lesson</Button>
                </div>
                <ul className="overflow-y-auto flex-1 p-2 space-y-1">
                    {course.lessons.map((lesson, index) => {
                        const isLessonCompleted = user?.lessonProgress?.[lesson.id]?.completed;
                        return (
                            <li key={lesson.id}><button onClick={() => handleLessonClick(lesson.id)} className={`w-full text-left p-3 rounded-md flex items-start gap-3 ${selectedLessonId === lesson.id ? 'bg-sky-600/20' : 'hover:bg-slate-700/50'}`}>
                                <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isLessonCompleted ? 'bg-green-500' : 'border-2 border-slate-500'}`}>{isLessonCompleted && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}</div>
                                <div><p className="font-medium text-sm text-white">{index + 1}. {lesson.title}</p><p className="text-xs text-slate-400">{lesson.duration}</p></div>
                            </button></li>
                        );
                    })}
                </ul>
            </aside>
        </div>
    );
};

export default LessonWatchingPage;
