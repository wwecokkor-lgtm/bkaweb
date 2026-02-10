
import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Spinner } from './commonComponents';
import { api } from './api';
import type { Course } from './types';
import { useAppStore } from './store';

interface PromotionPopupProps {
    onClose: () => void;
}

const PromotionPopup: React.FC<PromotionPopupProps> = ({ onClose }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { selectCourse } = useAppStore();

    useEffect(() => {
        api.getCourses().then(allCourses => {
            // Logic to select featured/popular courses (e.g., first 3 published)
            const featured = allCourses.filter(c => c.publishStatus === 'Published').slice(0, 3);
            setCourses(featured);
            setIsLoading(false);
        });
    }, []);

    const handleEnroll = (courseId: string) => {
        selectCourse(courseId);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Welcome to BK Academy!">
            <div className="space-y-4 text-center">
                <h2 className="text-2xl font-bold text-sky-400">Check Out Our Popular Courses!</h2>
                <p className="text-slate-300">Start your learning journey today with one of our top-rated courses designed for success.</p>
                
                {isLoading ? <div className="flex justify-center p-8"><Spinner /></div> : (
                    <div className="space-y-4 pt-4">
                        {courses.map(course => (
                            <div key={course.id} className="flex items-center text-left bg-slate-700/50 p-3 rounded-lg">
                                <img src={course.thumbnailUrl} alt={course.title} className="w-20 h-12 object-cover rounded-md mr-4" />
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-white">{course.title}</h4>
                                    <p className="text-sm text-sky-400 font-bold">৳{course.discount ?? course.price}</p>
                                </div>
                                <Button size="sm" onClick={() => handleEnroll(course.id)}>Enroll Now</Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4">
                    <Button variant="secondary" onClick={onClose}>Explore Later</Button>
                </div>
            </div>
        </Modal>
    );
};

export default PromotionPopup;
