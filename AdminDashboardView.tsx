
import React, { useMemo } from 'react';
import { Card, Button, Badge } from './commonComponents';
import { BarChart } from './ChartComponents';
import type { User, Course, Order, AdminLog, Instructor } from './types';
import type { AdminView } from './AdminPage';
import { Role } from './types';

// --- Helper Functions for Date ---
const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};
const isThisMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

// --- Child Components for Dashboard ---
const StatCard: React.FC<{ title: string; value: string | number; change?: string; icon: React.ReactElement; }> = ({ title, value, change, icon }) => (
    <Card>
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-sky-500/20 text-sky-400 mr-4">{icon}</div>
            <div>
                <p className="text-sm text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
        {change && <p className="text-xs text-slate-500 mt-2">{change}</p>}
    </Card>
);

const ListCard: React.FC<{ title: string; children: React.ReactNode; viewAllLink?: AdminView; onViewAll?: () => void; }> = ({ title, children, viewAllLink, onViewAll }) => (
    <Card className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{title}</h3>
            {viewAllLink && onViewAll && <Button variant="secondary" size="sm" onClick={onViewAll}>View All</Button>}
        </div>
        <div className="flex-grow space-y-3 overflow-y-auto">{children}</div>
    </Card>
);

// --- Main Admin Dashboard View Component ---
const AdminDashboardView: React.FC<{ users: User[]; courses: Course[]; orders: Order[]; adminLogs: AdminLog[]; instructors: Instructor[]; onQuickAction: (view: AdminView) => void; }> = ({ users, courses, orders, adminLogs, instructors, onQuickAction }) => {

    const stats = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'Completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.finalAmount, 0);
        const revenueThisMonth = completedOrders.filter(o => isThisMonth(o.createdAt)).reduce((sum, o) => sum + o.finalAmount, 0);
        const usersToday = users.filter(u => isToday(u.createdAt)).length;
        const usersThisMonth = users.filter(u => isThisMonth(u.createdAt)).length;
        
        return {
            totalUsers: users.length,
            usersChange: `+${usersThisMonth} this month`,
            totalCourses: courses.length,
            coursesChange: `${courses.filter(c => c.publishStatus === 'Published').length} Published`,
            totalRevenue: `৳${totalRevenue.toLocaleString()}`,
            revenueChange: `+৳${revenueThisMonth.toLocaleString()} this month`,
            pendingPayments: orders.filter(o => o.status === 'Pending').length,
            pendingPaymentsValue: orders.filter(o => o.status === 'Pending').reduce((sum, o) => sum + o.finalAmount, 0),
            totalInstructors: instructors.length,
            activeInstructors: instructors.filter(i => i.status === 'Active').length,
        };
    }, [users, courses, orders, instructors]);

    const chartData = useMemo(() => {
        const revenueByMonth: { [key: string]: number } = {};
        orders.filter(o => o.status === 'Completed').forEach(order => {
            const month = order.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
            revenueByMonth[month] = (revenueByMonth[month] || 0) + order.finalAmount;
        });
        const revenueChart = Object.entries(revenueByMonth).map(([label, value]) => ({ label, value })).slice(-6);
        
        const courseStatusChart = [
            { label: 'Published', value: courses.filter(c => c.publishStatus === 'Published').length },
            { label: 'Draft', value: courses.filter(c => c.publishStatus === 'Draft').length },
        ];
        
        return { revenueChart, courseStatusChart };
    }, [orders, courses]);
    
    const recentPendingOrders = useMemo(() => orders.filter(o => o.status === 'Pending').slice(0, 5), [orders]);
    const recentAdminLogs = useMemo(() => adminLogs.slice(0, 5), [adminLogs]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Dashboard Overview</h2>
            
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={stats.totalRevenue} change={stats.revenueChange} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 11V3m0 8h8m-8 0l-4 4m12 0l-4-4m-4 4v8m0-8H3" /></svg>} />
                <StatCard title="Total Users" value={stats.totalUsers} change={stats.usersChange} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" /></svg>} />
                <StatCard title="Total Instructors" value={stats.totalInstructors} change={`${stats.activeInstructors} Active`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>} />
                <StatCard title="Pending Payments" value={stats.pendingPayments} change={`Value: ৳${stats.pendingPaymentsValue.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>

            {/* Charts & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     <BarChart data={chartData.revenueChart} title="Monthly Revenue (Last 6 Months)" />
                </div>
                <div className="lg:col-span-1">
                     <BarChart data={chartData.courseStatusChart} title="Course Status" />
                </div>
            </div>
            
            {/* Recent Activities & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <ListCard title="Recent Pending Orders" viewAllLink="payments" onViewAll={() => onQuickAction('payments')}>
                         {recentPendingOrders.length > 0 ? recentPendingOrders.map(order => (
                            <div key={order.id} className="text-sm bg-slate-700/50 p-2 rounded-md">
                                <p className="font-semibold text-white">{order.courseTitle}</p>
                                <p className="text-slate-400">by {users.find(u=>u.id === order.userId)?.username || 'N/A'} - <span className="font-bold text-sky-400">৳{order.finalAmount}</span></p>
                            </div>
                         )) : <p className="text-slate-400 text-center py-4">No pending orders.</p>}
                     </ListCard>
                      <ListCard title="Recent Admin Activity" viewAllLink="logs" onViewAll={() => onQuickAction('logs')}>
                        {recentAdminLogs.map(log => (
                             <div key={log.id} className="text-sm bg-slate-700/50 p-2 rounded-md">
                                 <p className="font-semibold text-white">{log.adminName} <span className="text-slate-400 font-normal">{log.action.toLowerCase()}</span></p>
                                 <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                             </div>
                        ))}
                      </ListCard>
                 </div>
                 <Card className="lg:col-span-1">
                      <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                         <Button variant="secondary" onClick={() => onQuickAction('courses')}>Add Course</Button>
                         <Button variant="secondary" onClick={() => onQuickAction('exams')}>Add Exam</Button>
                         <Button variant="secondary" onClick={() => onQuickAction('news')}>Add Post</Button>
                         <Button variant="secondary" onClick={() => onQuickAction('media')}>Upload Media</Button>
                         <Button variant="secondary" onClick={() => onQuickAction('instructors')}>Add Instructor</Button>
                      </div>
                      <h3 className="text-xl font-bold mt-6 mb-4">System Status</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center"><p>API Health:</p><Badge color="green">Healthy</Badge></div>
                        <div className="flex justify-between items-center"><p>Database:</p><Badge color="green">Connected</Badge></div>
                        <div className="flex justify-between items-center"><p>Server Load:</p><Badge color="sky">Optimal</Badge></div>
                      </div>
                 </Card>
            </div>
        </div>
    );
};

export default AdminDashboardView;
