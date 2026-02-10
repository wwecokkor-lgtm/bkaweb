
import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Badge } from './commonComponents';
import { api } from './api';
import { useAppStore } from './store';
import type { Exam } from './types';

const ExamCard: React.FC<{ exam: Exam }> = ({ exam }) => {
    const { user, startExam, setPage } = useAppStore();
    const isEnrolledInCourse = user?.enrolledCourseIds.includes(exam.courseId);

    const handleStart = () => {
        if (isEnrolledInCourse) {
            startExam(exam.id);
        } else {
            setPage('courses'); // Redirect to courses if not enrolled
        }
    };

    return (
        <Card className="flex flex-col hover:border-sky-500 transition-colors duration-300">
            <div className="flex-grow">
                <span className="text-xs font-semibold bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">Exam</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-1">{exam.title}</h3>
                <p className="text-slate-400 text-sm mb-4 h-16 overflow-hidden">{exam.description}</p>
                {exam.status === 'Draft' && <Badge color="yellow">DRAFT</Badge>}
            </div>
            <div className="space-y-3 border-t border-slate-700 pt-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-semibold text-white">{exam.duration} minutes</span>
                </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Marks:</span>
                    <span className="font-semibold text-white">{exam.totalMarks}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Coin Reward:</span>
                    <span className="font-semibold text-yellow-400">{exam.coinReward} Coins</span>
                </div>
            </div>
            <div className="mt-4">
                <Button onClick={handleStart} className="w-full" disabled={!isEnrolledInCourse}>
                    {isEnrolledInCourse ? 'Start Exam' : 'Enroll in Course to Start'}
                </Button>
            </div>
        </Card>
    );
};

const ExamsPage: React.FC = () => {
    const { isPreviewMode } = useAppStore();
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.getExams(isPreviewMode).then(examData => {
            setExams(examData);
            setIsLoading(false);
        });
    }, [isPreviewMode]);

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">All Exams</h1>
                <p className="text-slate-400 mt-2">Test your knowledge and earn coins!</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center"><Spinner /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {exams.length > 0 ? exams.map(exam => (
                        <ExamCard key={exam.id} exam={exam} />
                    )) : <p className="text-slate-400 col-span-full text-center">No exams are available at the moment.</p>}
                </div>
            )}
        </div>
    );
};

export default ExamsPage;
