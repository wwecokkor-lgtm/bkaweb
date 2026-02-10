
import React from 'react';
import { useAppStore } from './store';
import { Card, Button } from './commonComponents';

const PendingApprovalPage: React.FC = () => {
    const { user, logout } = useAppStore();

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="text-center max-w-lg">
                <h1 className="text-3xl font-bold text-sky-400">Account Pending Approval</h1>
                <p className="text-slate-300 mt-4">
                    Thank you for registering as an instructor, {user?.username}! Your account is currently under review by our administration team.
                </p>
                <p className="text-slate-400 mt-2">
                    You will be notified once your account has been approved. You can then access your instructor dashboard and start creating courses.
                </p>
                <Button onClick={logout} className="mt-6">
                    Logout
                </Button>
            </Card>
        </div>
    );
};

export default PendingApprovalPage;
