
import React from 'react';
import { useAppStore } from './store';
import { NotificationType } from './types';

const Notification: React.FC = () => {
    const { notifications, removeNotification } = useAppStore();

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.SUCCESS:
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case NotificationType.ERROR:
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case NotificationType.INFO:
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            default:
                return null;
        }
    };

    const getBorderColor = (type: NotificationType) => {
        switch (type) {
            case NotificationType.SUCCESS: return 'border-green-500';
            case NotificationType.ERROR: return 'border-red-500';
            case NotificationType.INFO: return 'border-sky-500';
            default: return 'border-slate-600';
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 space-y-3">
            {notifications.map(n => (
                <div
                    key={n.id}
                    className={`flex items-center bg-slate-800 border-l-4 ${getBorderColor(n.type)} rounded-r-md shadow-lg p-4 w-80 animate-fade-in-up`}
                >
                    <div className="flex-shrink-0">{getIcon(n.type)}</div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm text-slate-200">{n.message}</p>
                    </div>
                    <button onClick={() => removeNotification(n.id)} className="ml-4 text-slate-400 hover:text-white">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
            <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Notification;
