
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { Card, Button, Spinner } from './commonComponents';
import { api } from './api';
import type { Course, Exam, NewsPost, Page } from './types';

interface NavState { page: Page; id?: string; }

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 rounded-full bg-sky-500 bg-opacity-20 text-sky-400 mr-4">{icon}</div>
        <div><p className="text-sm text-slate-400">{title}</p><p className="text-2xl font-bold text-white">{value}</p></div>
    </Card>
);

const DashboardPage: React.FC = () => {
    const { user, selectCourse, startExam, setPage, selectNewsPost, isPreviewMode } = useAppStore();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{ enrolledCourses: Course[], exams: Exam[], newsPosts: NewsPost[] }>({ enrolledCourses: [], exams: [], newsPosts: [] });
    const [lastPageInfo, setLastPageInfo] = useState<NavState | null>(null);

    useEffect(() => {
        try {
            const navStateJSON = localStorage.getItem('bk-academy-nav-state');
            if (navStateJSON) {
                const navState: NavState = JSON.parse(navStateJSON);
                if (navState.page && !['dashboard', 'instructorDashboard', 'login', 'register'].includes(navState.page)) {
                    setLastPageInfo(navState);
                }
            }
        } catch (e) { console.error("Could not parse nav state for banner."); }
    }, []);

    const handleContinue = () => {
        if (lastPageInfo) {
            if (lastPageInfo.page === 'courseDetail' && lastPageInfo.id) {
                selectCourse(lastPageInfo.id);
            } else if (lastPageInfo.page === 'newsDetail' && lastPageInfo.id) {
                selectNewsPost(lastPageInfo.id);
            } else {
                setPage(lastPageInfo.page);
            }
            setLastPageInfo(null);
        }
    };
    
    useEffect(() => {
        if (user) {
            setIsLoading(true);
            Promise.all([
                api.getCourses(isPreviewMode), 
                api.getExams(), 
                api.getNewsPosts({}, isPreviewMode)
            ]).then(([allCourses, allExams, allNewsPosts]) => {
                    const myCourses = allCourses.filter(course => user.enrolledCourseIds.includes(course.id));
                    const availableExams = allExams.filter(exam => user.enrolledCourseIds.includes(exam.courseId) && (exam.status === 'Published' || isPreviewMode));
                    const news = allNewsPosts.posts;
                    setData({ enrolledCourses: myCourses, exams: availableExams, newsPosts: news.slice(0, 4) });
                    setIsLoading(false);
                });
        }
    }, [user, isPreviewMode]);

    if (!user || isLoading) return <div className="flex justify-center items-center h-64"><Spinner/></div>;

    const getPageName = (page: Page) => page.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    return (
        <div className="space-y-8">
            {lastPageInfo && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                    <p className="text-slate-300">Welcome back! Want to continue where you left off at <span className="font-semibold text-sky-400">{getPageName(lastPageInfo.page)}</span>?</p>
                    <div className="flex items-center gap-2">
                         <Button onClick={handleContinue}>Continue</Button>
                         <button onClick={() => setLastPageInfo(null)} className="text-slate-500 hover:text-white">&times;</button>
                    </div>
                </div>
            )}
            <h1 className="text-4xl font-bold text-white">Welcome back, {user.username}!</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Courses Enrolled" value={user.enrolledCourseIds.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path d="M12 6.253v11.494m-9-5.747h18" /></svg>} />
                <StatCard title="Available Exams" value={data.exams.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
                <StatCard title="Coins Earned" value={user.coins} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card><h2 className="text-2xl font-bold mb-4">Your Enrolled Courses</h2><div className="space-y-4">
                        {data.enrolledCourses.length > 0 ? data.enrolledCourses.map(course => (
                            <div key={course.id} className="flex items-center bg-slate-700/50 p-3 rounded-lg">
                                <img src={course.thumbnailUrl} alt={course.title} className="w-24 h-14 object-cover rounded-md mr-4"/>
                                <div className="flex-grow"><h3 className="font-semibold text-white">{course.title}</h3><p className="text-sm text-slate-400">by {course.author}</p></div>
                                <Button size="sm" onClick={() => selectCourse(course.id)}>Continue Course</Button>
                            </div>
                        )) : <p className="text-slate-400">You have not enrolled in any courses yet.</p>}
                    </div></Card>
                    <Card><h2 className="text-2xl font-bold mb-4">Available Exams</h2><div className="space-y-4">
                         {data.exams.length > 0 ? data.exams.map(exam => (
                            <div key={exam.id} className="flex items-center bg-slate-700/50 p-3 rounded-lg">
                                <div className="flex-grow"><h3 className="font-semibold text-white">{exam.title}</h3><p className="text-sm text-slate-400">{exam.description}</p></div>
                                <Button size="sm" onClick={() => startExam(exam.id)}>Start Exam</Button>
                            </div>
                        )) : <p className="text-slate-400">No exams are available for you at the moment.</p>}
                    </div></Card>
                </div>
                <div className="lg:col-span-1">
                     <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">News & Announcements</h2>
                            <Button variant="secondary" size="sm" onClick={() => setPage('news')}>View All</Button>
                        </div>
                        <div className="space-y-4">
                            {data.newsPosts.map(post => (
                                <button key={post.id} onClick={() => selectNewsPost(post.id)} className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                                    {post.isPinned && <span className="text-xs font-bold text-yellow-400">PINNED</span>}
                                    <h4 className="font-semibold text-sky-400">{post.title}</h4>
                                    <p className="text-sm text-slate-300 mt-1">{post.shortDescription}</p>
                                    <p className="text-xs text-slate-500 mt-2">{new Date(post.createdAt).toLocaleDateString()}</p>
                                </button>
                            ))}
                        </div>
                     </Card>
                </div>
            </div>
        </div>
    );
};
export default DashboardPage;
