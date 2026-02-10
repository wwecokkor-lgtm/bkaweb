
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Spinner, Badge } from './commonComponents';
import { api } from './api';
import type { Exam, ExamAttempt } from './types';

const LeaderboardPage: React.FC = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [leaderboard, setLeaderboard] = useState<ExamAttempt[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            api.getExams(true), // Get all exams including drafts for the selector
            api.getLeaderboard(selectedExamId)
        ]).then(([examData, leaderboardData]) => {
            setExams(examData.filter(e => e.status === 'Published'));
            setLeaderboard(leaderboardData);
            if (selectedExamId === 'all' && examData.length > 0) {
                 setSelectedExamId(examData.filter(e => e.status === 'Published')[0]?.id || 'all');
            }
            setIsLoading(false);
        });
    }, [selectedExamId]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };
    
    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-yellow-400 text-slate-900';
        if (rank === 2) return 'bg-slate-400 text-slate-900';
        if (rank === 3) return 'bg-yellow-600 text-white';
        return 'bg-slate-600 text-slate-200';
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
                <p className="text-slate-400 mt-2">See who's at the top of their game.</p>
            </div>

            <Card>
                <div className="flex items-center gap-4 mb-4">
                    <label htmlFor="exam-select" className="font-semibold">Select Exam:</label>
                    <select
                        id="exam-select"
                        value={selectedExamId}
                        onChange={e => setSelectedExamId(e.target.value)}
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        {/* <option value="all">Overall</option> */}
                        {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                    </select>
                </div>
            </Card>

            {isLoading ? (
                <div className="flex justify-center"><Spinner /></div>
            ) : (
                <Card className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="p-3 text-center">Rank</th>
                                <th className="p-3">Student</th>
                                <th className="p-3 text-center">Score</th>
                                <th className="p-3 text-center">Time Taken</th>
                                <th className="p-3 text-center">Coins Earned</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.length > 0 ? leaderboard.map((attempt, index) => (
                                <tr key={attempt.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                    <td className="p-3 text-center">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mx-auto ${getRankColor(index + 1)}`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="p-3 font-semibold text-white">{attempt.username}</td>
                                    <td className="p-3 text-center font-bold text-sky-400">{attempt.score}/{attempt.totalMarks}</td>
                                    <td className="p-3 text-center text-slate-300">{formatTime(attempt.timeTaken)}</td>
                                    <td className="p-3 text-center text-yellow-400 font-semibold">{attempt.coinsEarned}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No attempts recorded for this exam yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};

export default LeaderboardPage;
