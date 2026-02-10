
import React from 'react';
import { Card, Button, Badge } from './commonComponents';
import type { Instructor } from './types';
import { useAppStore } from './store';
import { api } from './api';

interface InstructorManagementViewProps {
    instructors: Instructor[];
    onEdit: (i: Instructor) => void;
    onAdd: () => void;
    onSave: () => void;
}

const InstructorManagementView: React.FC<InstructorManagementViewProps> = ({ instructors, onEdit, onAdd, onSave }) => {
    const { user, showConfirmation } = useAppStore();

    const handleDelete = (instructor: Instructor) => {
        if (!user) return;
        showConfirmation({
            title: `Delete Instructor ${instructor.name}?`,
            message: 'This action is irreversible. Are you sure you want to delete this instructor?',
            actionType: 'danger',
            onConfirm: async () => {
                const res = await api.deleteInstructor(user.id, instructor.id);
                if (res.success) {
                    onSave();
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Instructor Management</h2>
                <Button onClick={onAdd}>Add New Instructor</Button>
            </div>
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="p-3">Name</th>
                            <th className="p-3">Title</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {instructors.map(instructor => (
                            <tr key={instructor.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <img src={instructor.photoUrl} alt={instructor.name} className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <p className="font-semibold text-white">{instructor.name}</p>
                                            <p className="text-xs text-slate-400">{instructor.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">{instructor.title}</td>
                                <td className="p-3"><Badge color={instructor.status === 'Active' ? 'green' : 'slate'}>{instructor.status}</Badge></td>
                                <td className="p-3 space-x-2">
                                    <Button onClick={() => onEdit(instructor)} size="sm" variant="secondary">Edit</Button>
                                    <Button onClick={() => handleDelete(instructor)} size="sm" variant="danger">Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default InstructorManagementView;
