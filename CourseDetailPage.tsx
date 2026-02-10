
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Course, Lesson, User, Instructor } from './types';
import { Card, Button, Spinner } from './commonComponents';
import { NotificationType } from './types';
import InstructorSlideshow from './InstructorSlideshow';

const StarRating: React.FC<{ rating: number; setRating: (r: number) => void }> = ({ rating, setRating }) => {
    return ( <div className="flex items-center"> {[1, 2, 3, 4, 5].map((star) => ( <button key={star} onClick={() => setRating(star)} className="text-2xl"> <span className={star <= rating ? 'text-yellow-400' : 'text-slate-600'}>★</span> </button> ))} </div> );
};

const CourseDetailPage: React.FC = () => {
    const { user, selectedCourseId, addNotification, openPaymentModal, updateUser, startLesson } = useAppStore();
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [instructors, setInstructors] = useState<Instructor[]>([]);

    const isEnrolled = useMemo(() => user?.enrolledCourseIds.includes(selectedCourseId || ''), [user, selectedCourseId]);
    const isInWishlist = useMemo(() => user?.wishlistCourseIds.includes(selectedCourseId || ''), [user, selectedCourseId]);

    useEffect(() => {
        if (selectedCourseId) {
            setIsLoading(true);
            Promise.all([
                api.getCourseById(selectedCourseId),
                api.getInstructors() // Fetch all instructors
            ]).then(([courseData, allInstructors]) => {
                if (courseData) {
                    setCourse(courseData);
                    // Filter instructors for this course
                    const courseInstructors = allInstructors.filter(i => courseData.instructorIds?.includes(i.id));
                    setInstructors(courseInstructors);
                    
                    const firstFreeLesson = courseData.lessons.find(l => l.isFree);
                    setActiveLesson(firstFreeLesson || courseData.lessons[0] || null);
                }
                setIsLoading(false);
            });
        }
    }, [selectedCourseId]);

    const handleCommentSubmit = () => {
        if (!comment || rating === 0) {
            addNotification('Please write a comment and select a rating.', NotificationType.ERROR);
            return;
        }
        addNotification('Thank you for your feedback!', NotificationType.SUCCESS);
        setComment('');
        setRating(0);
    };
    
    const handleFreeEnroll = async () => {
        if (user && course) {
            const res = await api.enrollInCourse(user.id, course.id); 
            if (res.success && res.user) {
                updateUser(res.user);
                addNotification(res.message, NotificationType.SUCCESS);
            } else {
                addNotification(res.message, NotificationType.ERROR);
            }
        }
    };

    const handleToggleWishlist = async () => {
        if (user && course) {
            const res = await api.toggleWishlist(user.id, course.id);
            if (res.success && res.user) {
                updateUser(res.user);
                addNotification(res.message, NotificationType.SUCCESS);
            } else {
                addNotification(res.message, NotificationType.ERROR);
            }
        }
    };

    const handleGoToCourse = () => {
        if (course && course.lessons.length > 0) {
            startLesson(course.id, course.lessons[0].id);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    if (!course) return <div className="text-center text-red-400">Course not found.</div>;

    const finalPrice = course.discount ?? course.price;

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-white">{course.title}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-0">
                        <div className="bg-black aspect-video w-full rounded-t-lg flex items-center justify-center">
                             <p className="text-slate-400">Video Player for: <br/> <span className="font-bold text-white text-xl">{activeLesson?.title || 'No lesson selected'}</span></p>
                        </div>
                        <div className="p-6"> <h2 className="text-2xl font-bold mb-2">About this course</h2> <p className="text-slate-400">{course.description}</p> </div>
                    </Card>
                    
                    {instructors.length > 0 && <InstructorSlideshow instructors={instructors} />}

                    <Card>
                        <h3 className="text-xl font-bold mb-4">Leave a Rating & Comment</h3>
                        <div className="space-y-4">
                            <StarRating rating={rating} setRating={setRating} />
                            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your comment here..." className="w-full h-24 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            <Button onClick={handleCommentSubmit}>Submit Feedback</Button>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        {isEnrolled ? (
                            <Button className="w-full" onClick={handleGoToCourse}>Go to Course</Button>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-sky-400">{finalPrice > 0 ? `৳${finalPrice.toLocaleString()}` : 'Free'}</h2>
                                {course.discount && <p className="text-sm text-slate-500 line-through">৳{course.price.toLocaleString()}</p>}
                                {finalPrice > 0 ? (
                                     <Button className="w-full mt-4" onClick={() => openPaymentModal(course)}>Enroll Now</Button>
                                ) : (
                                    <Button className="w-full mt-4" onClick={handleFreeEnroll}>Enroll for Free</Button>
                                )}
                                <p className="text-xs text-slate-500 mt-2 text-center">30-Day Money-Back Guarantee</p>
                            </>
                        )}
                         <Button variant="secondary" className="w-full mt-3" onClick={handleToggleWishlist}>
                            {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                         </Button>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold mb-4">Course Content</h3>
                        <ul className="space-y-2">
                           {course.lessons.map((lesson, index) => (
                               <li key={lesson.id} onClick={() => setActiveLesson(lesson)} className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${activeLesson?.id === lesson.id ? 'bg-sky-600/30' : 'hover:bg-slate-700/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                                        <p className="font-medium text-white">{lesson.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">{lesson.duration}</span>
                                        {lesson.isFree || isEnrolled ? ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 11V7a4 4 0 118 0v4m-5 9V9a5 5 0 00-10 0v6a5 5 0 0010 0z" /></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> )}
                                    </div>
                               </li>
                           ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailPage;
