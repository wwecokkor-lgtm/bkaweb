
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { api } from './api';
import type { Exam, Question, Course } from './types';
import { QuestionType } from './types';
import { Modal, Button, Input, Spinner } from './commonComponents';
import { NotificationType } from './types';

interface ExamEditorProps {
    exam: Exam | null;
    allCourses: Course[];
    onClose: () => void;
    onSave: () => void;
}

const ExamEditor: React.FC<ExamEditorProps> = ({ exam, allCourses, onClose, onSave }) => {
    const { user, addNotification } = useAppStore();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Exam>>({
        title: '', description: '', courseId: allCourses[0]?.id || '', duration: 10, totalMarks: 10, passMarks: 5,
        status: 'Draft', questions: [], coinReward: 10, fullMarksBonus: 5, attemptLimit: 1,
    });
    
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({ questionType: QuestionType.MCQ, options: ['', '', '', ''], correctAnswer: '' });

    useEffect(() => { if (exam) setFormData(exam); }, [exam]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['duration', 'totalMarks', 'passMarks', 'coinReward', 'fullMarksBonus', 'attemptLimit'];
        setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
    };
    
    const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentQuestion(prev => ({ ...prev, [name]: value }));
    };
    
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...(currentQuestion.options || [])];
        newOptions[index] = value;
        setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
    };

    const addOrUpdateQuestion = () => {
        if (!currentQuestion.questionText || !currentQuestion.correctAnswer) {
            addNotification('Question text and correct answer are required.', NotificationType.ERROR);
            return;
        }
        const newQuestions = [...(formData.questions || [])];
        if (currentQuestion.id) { // Update existing
            const index = newQuestions.findIndex(q => q.id === currentQuestion.id);
            if (index > -1) newQuestions[index] = currentQuestion as Question;
        } else { // Add new
            newQuestions.push({ ...currentQuestion, id: `q-${Date.now()}` } as Question);
        }
        setFormData(prev => ({ ...prev, questions: newQuestions }));
        setCurrentQuestion({ questionType: QuestionType.MCQ, options: ['', '', '', ''], correctAnswer: '' }); // Reset form
    };
    
    const editQuestion = (question: Question) => { setCurrentQuestion(question); };
    const removeQuestion = (id: string) => { setFormData(prev => ({ ...prev, questions: prev.questions?.filter(q => q.id !== id) })); };

    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        const response = exam?.id
            ? await api.updateExam(user.id, exam.id, formData)
            : await api.createExam(user.id, formData as Omit<Exam, 'id' | 'createdAt'>);
        setIsLoading(false);
        if (response.success) { addNotification(response.message, NotificationType.SUCCESS); onSave(); } 
        else { addNotification(response.message, NotificationType.ERROR); }
    };
    
    const renderStep = () => {
        switch(step) {
            case 1: return (
                <div className="space-y-4">
                    <Input name="title" label="Exam Title" value={formData.title} onChange={handleChange} required />
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Assign to Course</label><select name="courseId" value={formData.courseId} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">{allCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input name="duration" label="Duration (Mins)" type="number" value={formData.duration} onChange={handleChange} />
                        <Input name="totalMarks" label="Total Marks" type="number" value={formData.totalMarks} onChange={handleChange} />
                        <Input name="passMarks" label="Pass Marks" type="number" value={formData.passMarks} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                        <Input name="coinReward" label="Coin Reward" type="number" value={formData.coinReward} onChange={handleChange} />
                        <Input name="fullMarksBonus" label="Full Marks Bonus" type="number" value={formData.fullMarksBonus} onChange={handleChange} />
                        <Input name="attemptLimit" label="Attempt Limit" type="number" value={formData.attemptLimit} onChange={handleChange} />
                    </div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Status</label><select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="Draft">Draft</option><option value="Published">Published</option></select></div>
                </div>
            );
            case 2: return (
                 <div className="space-y-6 max-h-[500px] overflow-y-auto">
                    {/* Question list */}
                    <div className="space-y-2">
                        {formData.questions?.map((q, i) => (
                            <div key={q.id} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
                                <p className="text-sm truncate">{i+1}. {q.questionText}</p>
                                <div className="space-x-1 flex-shrink-0"><Button size="sm" variant="secondary" onClick={() => editQuestion(q)}>Edit</Button><Button size="sm" variant="danger" onClick={() => removeQuestion(q.id)}>Del</Button></div>
                            </div>
                        ))}
                    </div>
                    {/* Question editor form */}
                    <div className="p-4 bg-slate-900/50 rounded-lg space-y-3 border border-slate-700">
                        <h4 className="font-semibold text-white">{currentQuestion.id ? 'Edit Question' : 'Add New Question'}</h4>
                        <Input name="questionText" label="Question" value={currentQuestion.questionText} onChange={handleQuestionChange} />
                        <div><label className="block text-sm font-medium text-slate-300 mb-1">Question Type</label><select name="questionType" value={currentQuestion.questionType} onChange={handleQuestionChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"><option value={QuestionType.MCQ}>Multiple Choice</option><option value={QuestionType.TrueFalse}>True/False</option></select></div>
                        {currentQuestion.questionType === QuestionType.MCQ && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">Options</label>
                                {currentQuestion.options?.map((opt, i) => <Input key={i} value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Option ${i+1}`} />)}
                                <div><label className="block text-sm font-medium text-slate-300 mb-1">Correct Answer</label><select name="correctAnswer" value={currentQuestion.correctAnswer} onChange={handleQuestionChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200">{currentQuestion.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}</select></div>
                            </div>
                        )}
                        {currentQuestion.questionType === QuestionType.TrueFalse && (
                             <div><label className="block text-sm font-medium text-slate-300 mb-1">Correct Answer</label><select name="correctAnswer" value={currentQuestion.correctAnswer} onChange={handleQuestionChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200"><option value="">Select...</option><option value="True">True</option><option value="False">False</option></select></div>
                        )}
                        <Button onClick={addOrUpdateQuestion}>{currentQuestion.id ? 'Update Question' : 'Add Question'}</Button>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={exam ? 'Edit Exam' : 'Create New Exam'}>
            <div>
                <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2"><button onClick={() => setStep(1)} className={`text-sm font-medium ${step === 1 ? 'text-sky-400' : 'text-slate-400'}`}>Basic Info</button><button onClick={() => setStep(2)} className={`text-sm font-medium ${step === 2 ? 'text-sky-400' : 'text-slate-400'}`}>Questions</button></div>
                <div className="min-h-[300px]">{renderStep()}</div>
                <div className="flex justify-between mt-6">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <div className="flex gap-2">
                        {step > 1 && <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Previous</Button>}
                        {step < 2 && <Button onClick={() => setStep(s => s + 1)}>Next</Button>}
                        {step === 2 && <Button onClick={handleSubmit} isLoading={isLoading}>Save Exam</Button>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
export default ExamEditor;
