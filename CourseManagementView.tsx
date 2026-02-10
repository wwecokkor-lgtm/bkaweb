
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from './commonComponents';
import type { Course } from './types';
import { useAppStore } from './store';
import { api } from './api';

interface CourseManagementViewProps {
    courses: Course[];
    onEdit: (c: Course) => void;
    onAdd: () => void;
    onSave: () => void;
    setConfirmationAction: (action: any) => void;
}

const CourseManagementView: React.FC<CourseManagementViewProps> = ({ courses, onEdit, onAdd, onSave, setConfirmationAction }) => {
    const { user: adminUser } = useAppStore();
    const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');

    const filteredCourses = useMemo(() => (
        viewMode === 'active' ? courses.filter(c => !c.deletedAt) : courses.filter(c => c.deletedAt)
    ), [courses, viewMode]);

    const handleSoftDelete = (course: Course) => {
        if (!adminUser) return;
        setConfirmationAction({
            title: 'Move Course to Trash?',
            message: `Are you sure you want to trash "${course.title}"? It will be unpublished and hidden from users.`,
            actionType: 'warning',
            onConfirm: () => api.softDeleteCourse(adminUser.id, course.id)
        });
    };

    const handleRestore = (course: Course) => {
        if (!adminUser) return;
        api.restoreCourse(adminUser.id, course.id).then(onSave);
    };

    const handlePermanentDelete = (course: Course) => {
        if (!adminUser) return;
        setConfirmationAction({
            title: 'Delete Course Permanently?',
            message: `This action is irreversible. All data for "${course.title}" including enrollments will be affected.`,
            actionType: 'danger',
            onConfirm: () => api.permanentlyDeleteCourse(adminUser.id, course.id)
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Course Management</h2>
                <Button onClick={onAdd}>Add New Course</Button>
            </div>
             <div className="flex border-b border-slate-700">
                <button onClick={() => setViewMode('active')} className={`px-4 py-2 text-sm font-medium ${viewMode === 'active' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400'}`}>Active Courses</button>
                <button onClick={() => setViewMode('trash')} className={`px-4 py-2 text-sm font-medium ${viewMode === 'trash' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-slate-400'}`}>Trash</button>
            </div>
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="p-3">Title</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.map(course => (
                            <tr key={course.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                <td className="p-3 flex items-center gap-3 min-w-[250px]">
                                    <img src={course.thumbnailUrl} alt={course.title} className="w-16 h-9 object-cover rounded" loading="lazy"/>
                                    {course.title}
                                </td>
                                <td className="p-3">{course.category}</td>
                                <td className="p-3">৳{course.price}</td>
                                <td className="p-3"><Badge color={course.publishStatus === 'Published' ? 'green' : 'yellow'}>{course.publishStatus}</Badge></td>
                                <td className="p-3 space-x-2">
                                    {viewMode === 'trash' ? (
                                        <>
                                            <Button onClick={() => handleRestore(course)} size="sm" variant="secondary">Restore</Button>
                                            <Button onClick={() => handlePermanentDelete(course)} size="sm" variant="danger">Delete Forever</Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button onClick={() => onEdit(course)} size="sm" variant="secondary">Edit</Button>
                                            <Button onClick={() => handleSoftDelete(course)} size="sm" variant="danger">Trash</Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}

export default CourseManagementView;
