
import type { Course, User } from './types';
import { mockCourses, mockUsers, mockExams, simulateDelay, logAdminAction, saveDB } from './db';
import { Role } from './types';

export const courseApi = {
    getCourses: async (isPreview: boolean = false, includeDeleted: boolean = false): Promise<Course[]> => {
        await simulateDelay(300);
        let courses = [...mockCourses];
        if (!includeDeleted) {
            courses = courses.filter(c => !c.deletedAt);
        }
        if (isPreview) {
            return courses;
        }
        return courses.filter(c => c.publishStatus === 'Published');
    },
    getCourseById: async (id: string): Promise<Course | undefined> => {
        await simulateDelay(200);
        return mockCourses.find(c => c.id === id);
    },
    getCoursesForInstructor: async (instructorId: string): Promise<Course[]> => {
        await simulateDelay(300);
        return mockCourses.filter(c => c.authorId === instructorId && !c.deletedAt);
    },
    createCourse: async (userId: string, courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; course?: Course; message: string }> => {
        await simulateDelay(1000);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found.' };

        const newCourse: Course = { 
            ...courseData, 
            id: `c${mockCourses.length + 1}`, 
            createdAt: new Date(), 
            updatedAt: new Date(),
            authorId: userId, // Set ownership
            // Instructors can only create drafts
            publishStatus: (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) ? (courseData.publishStatus || 'Draft') : 'Draft',
        };
        mockCourses.push(newCourse);
        logAdminAction(userId, `Created course: ${newCourse.title}`, 'Course', newCourse.id);
        return { success: true, course: newCourse, message: 'Course created successfully!' };
    },
    updateCourse: async (userId: string, courseId: string, courseData: Partial<Course>): Promise<{ success: boolean; course?: Course; message: string }> => {
        await simulateDelay(1000);
        const user = mockUsers.find(u => u.id === userId);
        const courseIndex = mockCourses.findIndex(c => c.id === courseId);
        if (!user) return { success: false, message: 'User not found.' };
        if (courseIndex === -1) return { success: false, message: 'Course not found.' };
        
        const existingCourse = mockCourses[courseIndex];
        const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
        
        // Permission check: only admin or the author can edit
        if (!isAdmin && existingCourse.authorId !== userId) {
            return { success: false, message: 'You do not have permission to edit this course.' };
        }
        
        let updateData = { ...courseData };
        // Instructors cannot change publish status
        if (!isAdmin) {
            delete updateData.publishStatus;
        }

        mockCourses[courseIndex] = { ...existingCourse, ...updateData, updatedAt: new Date() };
        logAdminAction(userId, `Updated course: ${mockCourses[courseIndex].title}`, 'Course', courseId);
        return { success: true, course: mockCourses[courseIndex], message: 'Course updated successfully!' };
    },
    softDeleteCourse: async (adminId: string, courseId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const courseIndex = mockCourses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) return { success: false, message: 'Course not found.' };
        mockCourses[courseIndex].deletedAt = new Date();
        logAdminAction(adminId, `Moved course to trash: ${mockCourses[courseIndex].title}`, 'Course', courseId);
        return { success: true, message: 'Course moved to trash.' };
    },
    restoreCourse: async (adminId: string, courseId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const courseIndex = mockCourses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) return { success: false, message: 'Course not found in trash.' };
        mockCourses[courseIndex].deletedAt = undefined;
        logAdminAction(adminId, `Restored course: ${mockCourses[courseIndex].title}`, 'Course', courseId);
        return { success: true, message: 'Course restored successfully.' };
    },
    permanentlyDeleteCourse: async (adminId: string, courseId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(800);
        // Data Integrity Check: Prevent deletion if exams are associated with this course
        if (mockExams.some(exam => exam.courseId === courseId)) {
            return { success: false, message: 'Cannot delete course. It has associated exams. Please delete or reassign them first.' };
        }
        
        const courseIndex = mockCourses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) return { success: false, message: 'Course not found.' };
        
        const courseTitle = mockCourses[courseIndex].title;
        mockCourses.splice(courseIndex, 1);
        
        // Remove enrollments for this course
        mockUsers.forEach(user => {
            user.enrolledCourseIds = user.enrolledCourseIds.filter(id => id !== courseId);
        });

        logAdminAction(adminId, `Permanently deleted course: ${courseTitle}`, 'Course', courseId);
        return { success: true, message: 'Course permanently deleted.' };
    },
    enrollInCourse: async (userId: string, courseId: string): Promise<{ success: boolean; message: string; user?: User }> => {
        await simulateDelay(1500);
        const user = mockUsers.find(u => u.id === userId);
        const course = mockCourses.find(c => c.id === courseId);
        if (!user || !course) return { success: false, message: 'User or Course not found.' };
        if (user.enrolledCourseIds.includes(courseId)) return { success: false, message: 'You are already enrolled.' };
        if (course.price > 0) return { success: false, message: 'This course requires payment.' };
        user.enrolledCourseIds.push(courseId);
        saveDB();
        return { success: true, message: `Successfully enrolled in ${course.title}!`, user };
    },
};
