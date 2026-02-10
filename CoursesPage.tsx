
import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner } from './commonComponents';
import { api } from './api';
import { useAppStore } from './store';
import type { Course } from './types';

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
    const { selectCourse } = useAppStore();
    const finalPrice = course.discount ?? course.price;

    return (
        <Card className="flex flex-col hover:border-sky-500 transition-colors duration-300">
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-40 object-cover rounded-t-lg mb-4" loading="lazy" />
            <div className="flex-grow">
                <span className="text-xs font-semibold bg-sky-500/20 text-sky-400 px-2 py-1 rounded-full">{course.category}</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-1">{course.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{course.author}</p>
                 {course.publishStatus === 'Draft' && <span className="text-xs font-bold text-yellow-400">DRAFT</span>}
            </div>
            <div className="flex items-center justify-between mt-2">
                <div>
                    <p className="text-2xl font-bold text-sky-400">৳{finalPrice.toLocaleString()}</p>
                    {course.discount && <p className="text-sm text-slate-500 line-through">৳{course.price.toLocaleString()}</p>}
                </div>
                <Button onClick={() => selectCourse(course.id)}>View Details</Button>
            </div>
        </Card>
    );
};

const CoursesPage: React.FC = () => {
    const { searchTerm, setSearchTerm, isPreviewMode } = useAppStore();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [category, setCategory] = useState('All');

    useEffect(() => {
        api.getCourses(isPreviewMode).then(courseData => {
            setCourses(courseData);
            setIsLoading(false);
        });
    }, [isPreviewMode]);
    
    const filteredCourses = courses
        .filter(c => category === 'All' || c.category === category)
        .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.author.toLowerCase().includes(searchTerm.toLowerCase()));

    const categories = ['All', ...new Set(courses.map(c => c.category))];

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">Our Courses</h1>
                <p className="text-slate-400 mt-2">Find the perfect course to excel in your studies.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search for courses by title or author..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-md px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>

            {isLoading ? (
                <div className="flex justify-center"><Spinner /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCourses.length > 0 ? filteredCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    )) : <p className="text-slate-400 col-span-full text-center">No courses found matching your criteria.</p>}
                </div>
            )}
        </div>
    );
};

export default CoursesPage;
