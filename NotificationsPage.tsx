
import React from 'react';
import { useAppStore } from './store';
import { Card } from './commonComponents';
import { NotificationType } from './types';

const NotificationsPage: React.FC = () => {
    const { notifications } = useAppStore();

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.SUCCESS: return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case NotificationType.ERROR: return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case NotificationType.INFO: return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            default: return null;
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-8">Notifications</h1>
            <Card>
                <div className="space-y-4">
                    {notifications.length > 0 ? (
                        notifications.slice().reverse().map(n => (
                            <div key={n.id} className="flex items-start bg-slate-700/50 p-4 rounded-lg">
                                <div className="flex-shrink-0 mt-1">{getIcon(n.type)}</div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm text-slate-200">{n.message}</p>
                                    <p className="text-xs text-slate-500 mt-1">{new Date(n.id).toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 text-center py-8">You have no new notifications.</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default NotificationsPage;
