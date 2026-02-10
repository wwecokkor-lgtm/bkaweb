
import type { Instructor } from './types';
import { mockInstructors, simulateDelay, logAdminAction } from './db';

export const instructorApi = {
    getInstructors: async (): Promise<Instructor[]> => {
        await simulateDelay(300);
        return [...mockInstructors];
    },
    createInstructor: async (adminId: string, instructorData: Omit<Instructor, 'id'>): Promise<{ success: boolean; instructor?: Instructor; message: string }> => {
        await simulateDelay(800);
        const newInstructor: Instructor = { ...instructorData, id: `i${Date.now()}` };
        mockInstructors.push(newInstructor);
        logAdminAction(adminId, `Created instructor: ${newInstructor.name}`, 'Instructor', newInstructor.id);
        return { success: true, instructor: newInstructor, message: 'Instructor created successfully!' };
    },
    updateInstructor: async (adminId: string, instructorId: string, instructorData: Partial<Instructor>): Promise<{ success: boolean; instructor?: Instructor; message: string }> => {
        await simulateDelay(800);
        const index = mockInstructors.findIndex(i => i.id === instructorId);
        if (index === -1) return { success: false, message: 'Instructor not found.' };
        mockInstructors[index] = { ...mockInstructors[index], ...instructorData };
        logAdminAction(adminId, `Updated instructor: ${mockInstructors[index].name}`, 'Instructor', instructorId);
        return { success: true, instructor: mockInstructors[index], message: 'Instructor updated successfully!' };
    },
    deleteInstructor: async (adminId: string, instructorId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const index = mockInstructors.findIndex(i => i.id === instructorId);
        if (index === -1) return { success: false, message: 'Instructor not found.' };
        const name = mockInstructors[index].name;
        mockInstructors.splice(index, 1);
        // In a real app, you would also remove the instructorId from all courses.
        logAdminAction(adminId, `Deleted instructor: ${name}`, 'Instructor', instructorId);
        return { success: true, message: 'Instructor deleted successfully.' };
    },
};
