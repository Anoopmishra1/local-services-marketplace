import React, { useEffect, useState } from 'react';
import api from '../services/api';

const StatCard = ({ icon, label, value, color }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border-t-4 ${color}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-black text-gray-800 mt-1">{value}</p>
            </div>
            <span className="text-4xl">{icon}</span>
        </div>
    </div>
);

export default function Dashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.get('/admin/dashboard').then(({ data }) => setStats(data)).catch(console.error);
    }, []);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-400 text-sm mt-1">Welcome back, Admin 👋</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                <StatCard icon="👥" label="Total Users" value={stats?.total_users ?? '—'} color="border-violet-500" />
                <StatCard icon="📅" label="Total Bookings" value={stats?.total_bookings ?? '—'} color="border-blue-500" />
                <StatCard icon="💰" label="Platform Revenue" value={stats ? `₹${stats.total_revenue.toFixed(0)}` : '—'} color="border-emerald-500" />
                <StatCard icon="⏳" label="Pending Approvals" value={stats?.pending_approvals ?? '—'} color="border-amber-500" />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { icon: '👷', title: 'Review Providers', sub: 'Approve or reject applications', href: '/providers', color: 'text-violet-600' },
                    { icon: '⚠️', title: 'Open Disputes', sub: 'Resolve customer complaints', href: '/disputes', color: 'text-red-500' },
                    { icon: '💰', title: 'Revenue Report', sub: 'View commissions & payouts', href: '/revenue', color: 'text-emerald-600' },
                ].map((q) => (
                    <a key={q.href} href={q.href} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 border border-gray-100">
                        <span className="text-3xl">{q.icon}</span>
                        <div>
                            <p className={`font-bold text-base ${q.color}`}>{q.title}</p>
                            <p className="text-xs text-gray-400">{q.sub}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
