
import React from 'react';
import { Card, Button, Badge } from './commonComponents';
import type { Exam } from './types';

interface ExamManagementViewProps {
    exams: Exam[];
    onEdit: (q: Exam) => void;
    onDelete: (q: Exam) => void;
    onAdd: () => void;
}

const ExamManagementView: React.FC<ExamManagementViewProps> = ({ exams, onEdit, onDelete, onAdd }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Exams</h2>
            <Button onClick={onAdd}>Add New Exam</Button>
        </div>
        <Card className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-700">
                        <th className="p-3">Title</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Marks</th>
                        <th className="p-3">Coin Reward</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {exams.map(exam => (
                        <tr key={exam.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                            <td className="p-3">{exam.title}</td>
                            <td className="p-3">{exam.duration} mins</td>
                            <td className="p-3">{exam.totalMarks}</td>
                            <td className="p-3">{exam.coinReward}</td>
                            <td className="p-3"><Badge color={exam.status === 'Published' ? 'green' : 'yellow'}>{exam.status}</Badge></td>
                            <td className="p-3 space-x-2">
                                <Button onClick={() => onEdit(exam)} size="sm" variant="secondary">Edit</Button>
                                <Button onClick={() => onDelete(exam)} size="sm" variant="danger">Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    </div>
);

export default ExamManagementView;
