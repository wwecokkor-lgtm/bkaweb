
import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Course, Instructor, InstructorPost } from './types';
import { Card, Button, Spinner, Badge } from './commonComponents';
import InstructorCourseEditor from './InstructorCourseEditor';
import InstructorEditor from './InstructorEditor';
import InstructorPostEditor from './InstructorPostEditor';

const InstructorDashboardPage: React.FC = () => {
    const { user, logout, showConfirmation } = useAppStore();
    const [courses, setCourses] = useState<Course[]>([]);
    const [posts, setPosts] = useState<InstructorPost[]>([]);
    const [instructorProfile, setInstructorProfile] = useState<Instructor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Editor States
    const [isCourseEditorOpen, setIsCourseEditorOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
    const [isPostEditorOpen, setIsPostEditorOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<InstructorPost | null>(null);

    const fetchData = useCallback(async () => {
        if (!user || !user.instructorProfileId) return;
        setIsLoading(true);
        try {
            const [instructorCourses, instructorPosts, allInstructors] = await Promise.all([
                api.getCoursesForInstructor(user.id),
                api.getInstructorPosts(user.id),
                api.getInstructors()
            ]);
            setCourses(instructorCourses);
            setPosts(instructorPosts);
            setInstructorProfile(allInstructors.find(i => i.id === user.instructorProfileId) || null);
        } catch (error) {
            console.error("Failed to fetch instructor data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSave = () => {
        setIsCourseEditorOpen(false); setSelectedCourse(null);
        setIsProfileEditorOpen(false);
        setIsPostEditorOpen(false); setSelectedPost(null);
        fetchData();
    };

    const handleOpenCourseEditor = (course: Course | null) => {
        setSelectedCourse(course); setIsCourseEditorOpen(true);
    };
    
    const handleOpenPostEditor = (post: InstructorPost | null) => {
        setSelectedPost(post); setIsPostEditorOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white">Instructor Dashboard</h1>
                    <p className="text-slate-400">Welcome back, {user?.username}!</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setIsProfileEditorOpen(true)}>Edit Profile</Button>
                    <Button variant="secondary" onClick={() => handleOpenCourseEditor(null)}>Create Course</Button>
                    <Button onClick={() => handleOpenPostEditor(null)}>Create Post</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card className="overflow-x-auto">
                    <h2 className="text-2xl font-bold mb-4">My Courses</h2>
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-slate-700 sticky top-0 bg-slate-800"><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                            <tbody>
                                {courses.length > 0 ? courses.map(course => (
                                    <tr key={course.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                        <td className="p-3 flex items-center gap-3 min-w-[200px]"><img src={course.thumbnailUrl} alt={course.title} className="w-16 h-9 object-cover rounded" />{course.title}</td>
                                        <td className="p-3"><Badge color={course.publishStatus === 'Published' ? 'green' : 'yellow'}>{course.publishStatus}</Badge></td>
                                        <td className="p-3"><Button onClick={() => handleOpenCourseEditor(course)} size="sm" variant="secondary">Edit</Button></td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="text-center p-8 text-slate-400">You haven't created any courses yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card className="overflow-x-auto">
                    <h2 className="text-2xl font-bold mb-4">My Posts</h2>
                     <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-slate-700 sticky top-0 bg-slate-800"><th className="p-3">Title</th><th className="p-3">Stats</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                            <tbody>
                                {posts.length > 0 ? posts.map(post => (
                                    <tr key={post.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                        <td className="p-3 min-w-[200px]">{post.title}</td>
                                        <td className="p-3 text-sm">❤️ {post.likes.length}  💬 {post.comments.length}</td>
                                        <td className="p-3"><Badge color={post.status === 'Published' ? 'green' : 'yellow'}>{post.status}</Badge></td>
                                        <td className="p-3"><Button onClick={() => handleOpenPostEditor(post)} size="sm" variant="secondary">Edit</Button></td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="text-center p-8 text-slate-400">You haven't created any posts yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {isCourseEditorOpen && (<InstructorCourseEditor course={selectedCourse} onClose={handleSave} onSave={handleSave} />)}
            {isPostEditorOpen && (<InstructorPostEditor post={selectedPost} allCourses={courses} onClose={handleSave} onSave={handleSave} />)}
            {isProfileEditorOpen && instructorProfile && (<InstructorEditor instructor={instructorProfile} onClose={handleSave} onSave={handleSave} />)}
        </div>
    );
};

export default InstructorDashboardPage;
