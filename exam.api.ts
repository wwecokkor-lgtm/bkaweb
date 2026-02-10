
import type { Exam, Question, User, ExamAttempt } from './types';
import { mockExams, mockUsers, mockExamAttempts, simulateDelay, logAdminAction, saveDB } from './db';

export const examApi = {
    getExams: async (isPreview: boolean = false): Promise<Exam[]> => {
        await simulateDelay(200);
        if (isPreview) return [...mockExams];
        return [...mockExams.filter(e => e.status === 'Published')];
    },
    getExamById: async (id: string): Promise<Exam | undefined> => {
        await simulateDelay(200);
        return mockExams.find(q => q.id === id);
    },
    createExam: async (adminId: string, examData: Omit<Exam, 'id' | 'createdAt'>): Promise<{ success: boolean; exam?: Exam; message: string }> => {
        await simulateDelay(1000);
        const newExam: Exam = { ...examData, id: `e${mockExams.length + 1}`, createdAt: new Date() };
        mockExams.push(newExam);
        logAdminAction(adminId, `Created exam: ${newExam.title}`, 'Exam', newExam.id);
        return { success: true, exam: newExam, message: 'Exam created successfully!' };
    },
    updateExam: async (adminId: string, examId: string, examData: Partial<Exam>): Promise<{ success: boolean; exam?: Exam; message: string }> => {
        await simulateDelay(1000);
        const examIndex = mockExams.findIndex(q => q.id === examId);
        if (examIndex === -1) return { success: false, message: 'Exam not found.' };
        mockExams[examIndex] = { ...mockExams[examIndex], ...examData };
        logAdminAction(adminId, `Updated exam: ${mockExams[examIndex].title}`, 'Exam', examId);
        return { success: true, exam: mockExams[examIndex], message: 'Exam updated successfully!' };
    },
    deleteExam: async (adminId: string, examId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const examIndex = mockExams.findIndex(q => q.id === examId);
        if (examIndex === -1) return { success: false, message: 'Exam not found.' };
        const exam = mockExams[examIndex];
        mockExams.splice(examIndex, 1);
        logAdminAction(adminId, `Deleted exam: ${exam.title}`, 'Exam', examId);
        return { success: true, message: 'Exam deleted successfully.' };
    },
    submitExam: async (submission: { userId: string, username: string, examId: string, answers: { [key: string]: string }, timeTaken: number }): Promise<{ success: boolean; result?: { score: number; totalMarks: number, coinsEarned: number }; user?: User; message?: string }> => {
        await simulateDelay(800);
        const exam = mockExams.find(e => e.id === submission.examId);
        const user = mockUsers.find(u => u.id === submission.userId);
        if (!exam || !user) return { success: false, message: 'Exam or user not found.' };

        let score = 0;
        exam.questions.forEach(q => {
            if (submission.answers[q.id] === q.correctAnswer) {
                score += q.marks;
            }
        });
        
        let coinsEarned = 0;
        if (score >= exam.passMarks) {
            coinsEarned += exam.coinReward;
            if (score === exam.totalMarks) {
                coinsEarned += exam.fullMarksBonus;
            }
        }
        
        user.coins += coinsEarned;
        if (coinsEarned > 0) {
            user.coinTransactions.push({
                id: `ctx-${Date.now()}`,
                type: 'Earned',
                amount: coinsEarned,
                description: `For completing exam: ${exam.title}`,
                timestamp: new Date()
            });
        }
        
        const newAttempt: ExamAttempt = {
            id: `att-${Date.now()}`,
            examId: submission.examId,
            userId: submission.userId,
            username: submission.username,
            score,
            totalMarks: exam.totalMarks,
            submittedAt: new Date(),
            timeTaken: submission.timeTaken,
            coinsEarned,
        };
        mockExamAttempts.push(newAttempt);
        saveDB();

        return {
            success: true,
            result: { score, totalMarks: exam.totalMarks, coinsEarned },
            user: {...user}
        };
    },
    getLeaderboard: async (examId: string): Promise<ExamAttempt[]> => {
        await simulateDelay(400);
        
        const relevantAttempts = mockExamAttempts.filter(att => att.examId === examId);
        
        // Get the best attempt for each user
        const bestAttempts = new Map<string, ExamAttempt>();
        for (const attempt of relevantAttempts) {
            const existing = bestAttempts.get(attempt.userId);
            if (!existing || attempt.score > existing.score || (attempt.score === existing.score && attempt.timeTaken < existing.timeTaken)) {
                bestAttempts.set(attempt.userId, attempt);
            }
        }

        const sortedLeaderboard = Array.from(bestAttempts.values()).sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return a.timeTaken - b.timeTaken;
        });

        return sortedLeaderboard.slice(0, 20); // Return top 20
    },
};
