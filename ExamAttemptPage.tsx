
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Exam, Question } from './types';
import { Card, Button, Spinner } from './commonComponents';
import { NotificationType } from './types';

const ExamAttemptPage: React.FC = () => {
    const { user, selectedExamId, setPage, addNotification, updateUser } = useAppStore();
    const [exam, setExam] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [isFinished, setIsFinished] = useState(false);
    const [result, setResult] = useState<{ score: number; totalMarks: number, coinsEarned: number } | null>(null);
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

    const DRAFT_KEY = useMemo(() => `exam-draft-${user?.id}-${exam?.id}`, [user, exam]);

    // Security: Prevent leaving page
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isFinished) {
                e.preventDefault();
                e.returnValue = 'Are you sure you want to leave? Your exam progress will be saved, but the timer will continue.';
            }
        };
        const handleVisibilityChange = () => {
            if (document.hidden && !isFinished) {
                addNotification("Switching tabs is not allowed during the exam.", NotificationType.ERROR);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isFinished, addNotification]);

    useEffect(() => {
        if (selectedExamId) {
            api.getExamById(selectedExamId).then(examData => {
                if (examData) {
                    setExam(examData);
                    setTimeLeft(examData.duration * 60);
                    // Shuffle questions and options once
                    const questions = [...examData.questions].sort(() => Math.random() - 0.5);
                    const shuffledWithOptions = questions.map(q => ({...q, options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : []}));
                    setShuffledQuestions(shuffledWithOptions);
                }
                setIsLoading(false);
            });
        }
    }, [selectedExamId]);

     // Restore draft on load
    useEffect(() => {
        if (!exam || !user) return;
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setAnswers(draft.answers || {});
                addNotification('Unfinished exam draft restored.', NotificationType.INFO);
            } catch (e) { console.error('Failed to parse exam draft.'); }
        }
    }, [exam, user, DRAFT_KEY, addNotification]);


    useEffect(() => {
        if (timeLeft > 0 && !isFinished) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft <= 0 && !isFinished) {
            handleSubmit();
        }
    }, [timeLeft, isFinished]);

    const handleAnswerChange = (questionId: string, answer: string) => {
        const newAnswers = { ...answers, [questionId]: answer };
        setAnswers(newAnswers);
        // Auto-save to local storage
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers: newAnswers }));
    };

    const handleSubmit = useCallback(async () => {
        if (!exam || !user || isFinished) return;
        setIsFinished(true);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        
        const res = await api.submitExam({
            examId: exam.id,
            userId: user.id,
            username: user.username,
            answers,
            timeTaken,
        });

        localStorage.removeItem(DRAFT_KEY); // Clean up draft

        if (res.success && res.result) {
            setResult(res.result);
            if (res.user) updateUser(res.user);
            addNotification(`Exam submitted! You earned ${res.result.coinsEarned} coins.`, NotificationType.SUCCESS);
        } else {
             addNotification(res.message || "Failed to submit exam.", NotificationType.ERROR);
        }
    }, [exam, user, answers, startTime, updateUser, addNotification, DRAFT_KEY, isFinished]);

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    if (!exam) return <div>Exam not found.</div>;

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isFinished && result) {
        const isPassed = result.score >= exam.passMarks;
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <Card>
                    <h1 className="text-3xl font-bold text-white mb-4">Exam Result</h1>
                    <p className={`text-5xl font-bold mb-2 ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                        {result.score} / {result.totalMarks}
                    </p>
                    <p className={`text-xl font-semibold mb-6 ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                        {isPassed ? 'Congratulations! You Passed!' : 'Better Luck Next Time!'}
                    </p>
                    <p className="text-lg text-yellow-400 mb-6">You earned <span className="font-bold">{result.coinsEarned}</span> coins!</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => setPage('leaderboard')}>View Leaderboard</Button>
                        <Button variant="secondary" onClick={() => setPage('dashboard')}>Back to Dashboard</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6" style={{ userSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
            <Card>
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">{exam.title}</h1>
                    <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-sky-400'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </Card>

            <div className="space-y-6">
                {shuffledQuestions.map((question, index) => (
                    <Card key={question.id}>
                        <p className="font-semibold text-white mb-4">{index + 1}. {question.questionText} ({question.marks} marks)</p>
                        <div className="space-y-3">
                            {question.options?.map(option => (
                                <label key={option} className="flex items-center p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                                    <input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => handleAnswerChange(question.id, option)} className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-500 focus:ring-sky-500" />
                                    <span className="ml-3 text-slate-300">{option}</span>
                                </label>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
            <div className="text-center sticky bottom-4">
                <Button onClick={handleSubmit} className="w-full max-w-xs shadow-lg" size="md">Submit Exam</Button>
            </div>
        </div>
    );
};

export default ExamAttemptPage;
