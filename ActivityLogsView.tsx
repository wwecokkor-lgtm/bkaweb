
import React from 'react';
import { Card, Button } from './commonComponents';
import type { AdminLog } from './types';

interface ActivityLogsViewProps {
    logs: AdminLog[];
}

const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({ logs }) => {
    
    const exportToCSV = () => {
        const headers = ["Timestamp", "Admin", "Action", "IP Address"];
        const rows = logs.map(log => [
            `"${new Date(log.timestamp).toLocaleString()}"`,
            `"${log.adminName}"`,
            `"${log.action}"`,
            `"${log.ipAddress || 'N/A'}"`
        ].join(','));
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "bk_academy_activity_logs.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-bold">Activity Logs</h2>
                 <Button onClick={exportToCSV} variant="secondary">Export as CSV</Button>
            </div>
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-slate-700">
                            <th className="p-3">Admin</th>
                            <th className="p-3">Action</th>
                            <th className="p-3">Timestamp</th>
                            <th className="p-3">IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.slice(0, 100).map(log => (
                            <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                <td className="p-3 font-semibold text-sky-400">{log.adminName}</td>
                                <td className="p-3">{log.action.toLowerCase()}</td>
                                <td className="p-3 text-sm text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="p-3 text-sm text-slate-500 font-mono">{log.ipAddress}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default ActivityLogsView;
